
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const startButton = document.getElementById('startButton');
const createOfferButton = document.getElementById('createOfferButton');
const createAnswerButton = document.getElementById('createAnswerButton');
const setRemoteAnswerButton = document.getElementById('setRemoteAnswerButton');

const localOfferArea = document.getElementById('localOffer');
const remoteOfferArea = document.getElementById('remoteOffer');
const localAnswerArea = document.getElementById('localAnswer');
const remoteAnswerArea = document.getElementById('remoteAnswer');

let localStream;
let peerConnection;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

startButton.onclick = async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        
        startButton.disabled = true;
        createOfferButton.disabled = false;
        createAnswerButton.disabled = false;
        
        initPeerConnection();
    } catch (e) {
        console.error("Camera failed", e);
        alert("Could not start camera: " + e.message);
    }
};

function initPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks to the connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle incoming streams
    peerConnection.ontrack = event => {
        console.log("Received remote stream");
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE State:", peerConnection.iceConnectionState);
    };
}

// User A: Create Offer
createOfferButton.onclick = async () => {
    createOfferButton.disabled = true;
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log("Offer created, waiting for ICE candidates...");
        // Wait for ICE gathering to complete so we have a completely self-contained SDP
        await waitForIceGathering(peerConnection);
        
        const jsonOffer = JSON.stringify(peerConnection.localDescription);
        localOfferArea.value = jsonOffer;
        
        setRemoteAnswerButton.disabled = false; // Now User A can wait for answer
    } catch (e) {
        console.error(e);
    }
};

// User B: Create Answer (after pasting offer)
createAnswerButton.onclick = async () => {
    const offerText = remoteOfferArea.value.trim();
    if (!offerText) return alert("Please paste the Offer from User A first.");

    createAnswerButton.disabled = true;

    try {
        const offer = JSON.parse(offerText);
        await peerConnection.setRemoteDescription(offer);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log("Answer created, waiting for ICE candidates...");
        await waitForIceGathering(peerConnection);

        const jsonAnswer = JSON.stringify(peerConnection.localDescription);
        localAnswerArea.value = jsonAnswer;
        
    } catch (e) {
        console.error(e);
        alert("Invalid Offer code");
        createAnswerButton.disabled = false;
    }
};

// User A: Set Remote Answer
setRemoteAnswerButton.onclick = async () => {
    const answerText = remoteAnswerArea.value.trim();
    if (!answerText) return alert("Please paste the Answer from User B first.");
    
    try {
        const answer = JSON.parse(answerText);
        await peerConnection.setRemoteDescription(answer);
        console.log("Remote Answer set! Connection should be establishing...");
        setRemoteAnswerButton.disabled = true;
    } catch (e) {
        console.error(e);
        alert("Invalid Answer code");
    }
};

function waitForIceGathering(pc) {
    return new Promise((resolve) => {
        if (pc.iceGatheringState === 'complete') {
            resolve();
        } else {
            const checkState = () => {
                if (pc.iceGatheringState === 'complete') {
                    pc.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }
            };
            pc.addEventListener('icegatheringstatechange', checkState);
        }
    });
}
