let localStream;
let peer;
let currentCall;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const myIdDisplay = document.getElementById('my-id');
const remoteIdInput = document.getElementById('remote-id');

startButton.onclick = startCamera;
callButton.onclick = startCall;
hangupButton.onclick = hangUp;

peer = new Peer();

peer.on('open', (id) => {
    myIdDisplay.innerText = id;
    console.log('My peer ID is: ' + id);
});

peer.on('call', (call) => {
    call.answer(localStream);
    setupCallHandlers(call);
});

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

function startCall() {
    const remoteId = remoteIdInput.value;
    if (!remoteId) {
        alert("Please enter a remote Peer ID");
        return;
    }

    const call = peer.call(remoteId, localStream);
    setupCallHandlers(call);
}

function setupCallHandlers(call) {
    currentCall = call;
    callButton.disabled = true;
    hangupButton.disabled = false;

    call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
    });

    call.on('close', () => {
        remoteVideo.srcObject = null;
        hangupButton.disabled = true;
        callButton.disabled = false;
    });

    call.on('error', (err) => {
        console.error('Peer error:', err);
        hangUp();
    });
}

function hangUp() {
    if (currentCall) {
        currentCall.close();
    }

    hangupButton.disabled = true;
    callButton.disabled = false;
    remoteVideo.srcObject = null;
}