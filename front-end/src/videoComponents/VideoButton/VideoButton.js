import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const VideoButton = ({ smallFeedlEl }) => {
    const callStatus = useSelector(state => state.callStatus);
    const streams = useSelector(state => state.streams);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    const startStopVideo = () => {
        if (callStatus.haveMedia) {
            // we have the media, show the feed
            smallFeedlEl.current.srcObject = streams.localStream.stream
        } else {
            setPendingUpdate(true);
        }
    }

    useEffect(() => {
        if (pendingUpdate && callStatus.haveMedia) {
            setPendingUpdate(false)
            smallFeedlEl.current.srcObject = streams.localStream.stream

            // add tracks to the peerConnection
        }
    }, [pendingUpdate, callStatus.haveMedia])

    return (
        <div className="button-wrapper video-button d-inline-block">
            <i className="fa fa-caret-up choose-video"></i>
            <div className="button camera" onClick={startStopVideo}>
                <i className="fa fa-video"></i>
                <div className="btn-text">{callStatus.video === "display" ? "Stop" : "Start"} Video</div>
            </div>
        </div>
    )
}
export default VideoButton;