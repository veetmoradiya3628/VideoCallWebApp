// this functions job is to update all peer Connections and update redux call status

import updateCallStatus from "../../redux-elements/actions/updateCallStatus";

const startAudioStream = (streams) => {
    const localStream = streams.localStream;
    for (const s in streams) { //s is the key
        if (s !== "localStream") {
            //we don't addTracks to the localStream
            const curStream = streams[s];
            //addTracks to all peerConnecions
            localStream.stream.getAudioTracks().forEach(t => {
                curStream.peerConnection.addTrack(t, streams.localStream.stream);
            })
        }
    }
}

export default startAudioStream;