let localStream;
let localPeer;
let remotePeer;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

startButton.onclick = startCamera;
callButton.onclick = startCall;
hangupButton.onclick = hangUp;

async function startCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        localVideo.srcObject = localStream;
        
        startButton.disabled = true;
        callButton.disabled = false;
    } catch (error) {
        console.error('Camera error', error);
        alert('Camera is not accessible');
    }
}

async function startCall() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    localPeer = new RTCPeerConnection();
    remotePeer = new RTCPeerConnection();

    localPeer.onicecandidate = (event) => {
        if (event.candidate) {
            remotePeer.addIceCandidate(event.candidate);
        }
    };
    remotePeer.onicecandidate = (event) => {
        if (event.candidate) {
            localPeer.addIceCandidate(event.candidate);
        }
    };

    remotePeer.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => {
        localPeer.addTrack(track, localStream);
    });

    const offer = await localPeer.createOffer();
    await localPeer.setLocalDescription(offer);
    await remotePeer.setRemoteDescription(offer);

    const answer = await remotePeer.createAnswer();
    await remotePeer.setLocalDescription(answer);
    await localPeer.setRemoteDescription(answer);
}

function hangUp() {
    localPeer.close();
    remotePeer.close();
    localPeer = null;
    remotePeer = null;
    
    hangupButton.disabled = true;
    callButton.disabled = false;
    remoteVideo.srcObject = null;
}