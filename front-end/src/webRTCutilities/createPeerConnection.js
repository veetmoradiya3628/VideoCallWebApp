import peerConnection from './stunServers'

const createPeerConnection = () => {
    return new Promise(async (resolve, reject) => {
        const peerConnection = await new RTCPeerConnection();
        const remoteStrem = new MediaStream();
        peerConnection.addEventListener('signalingstatechange', (e) => {
            console.log("signaling state changed");
            console.log(e);
        })

        peerConnection.addEventListener('icecandidate', e => {
            console.log("found ice candidate...");
            if(e.candidate){
                // emit to socket server
            }
        })
        resolve({
            peerConnection, 
            remoteStrem
        })
    })
}

export default createPeerConnection;