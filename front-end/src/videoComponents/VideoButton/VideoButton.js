import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import startLocalVideoStream from "./startLocalVideoStream";
import updateCallStatus from "../../redux-elements/actions/updateCallStatus";
import getDevices from "../../webRTCutilities/getDevices";
import addStream from "../../redux-elements/actions/addStream";
import ActionButtonCaretDropDown from "../ActionButtonCaretDropDown";

const VideoButton = ({ smallFeedlEl }) => {
    const dispatch = useDispatch();

    const callStatus = useSelector(state => state.callStatus);
    const streams = useSelector(state => state.streams);

    const [pendingUpdate, setPendingUpdate] = useState(false);
    const [caretOpen, setCaretOpen] = useState(false);
    const [videoDeviceList, setVideoDeviceList] = useState([])

    useEffect(() => {
        const getDevicesAsync = async () => {
            if (caretOpen) {
                const devices = await getDevices()
                setVideoDeviceList(devices.videoDevices);
            }
        }
        getDevicesAsync();
    }, [caretOpen])

    const changeVideoDevice = async (e) => {
        // user changed the video device

        // 1. we need to get that device
        const deviceId = e.target.value;
        // console.log(deviceId);

        // 2. we need to getUserMedia (permission)
        const newConstraints = {
            audio: callStatus.audioDevice === "default" ? true : { deviceId: { exact: callStatus.audioDevice } },
            video: { deviceId: { exact: deviceId } }
        }
        const stream = await navigator.mediaDevices.getUserMedia(newConstraints);

        // 3. update redux with that video deviceId
        dispatch(updateCallStatus('videoDevice', deviceId));
        dispatch(updateCallStatus('video', 'enabled'))
        
        // 4. update the smallFeedEl
        smallFeedlEl.current.srcObject = stream;

        // 5. we need to update local stream in streams
        dispatch(addStream('localStream', stream))

        // 6. add tracks
        const tracks = stream.getVideoTracks();
        // come back to this later
    }

    const startStopVideo = () => {
        if (callStatus.video === "enabled") {
            dispatch(updateCallStatus('video', "disabled"));
            // set the stream to disabled
            const tracks = streams.localStream.stream.getVideoTracks();
            tracks.forEach((t) => {
                t.enabled = false
            })
        } else if (callStatus.video === "disabled") {
            dispatch(updateCallStatus('video', "enabled"));
            const tracks = streams.localStream.stream.getVideoTracks();
            tracks.forEach((t) => {
                t.enabled = true
            })
        } else if (callStatus.haveMedia) {
            // we have the media, show the feed
            smallFeedlEl.current.srcObject = streams.localStream.stream
            startLocalVideoStream(streams, dispatch);
        } else {
            setPendingUpdate(true);
        }
    }

    useEffect(() => {
        if (pendingUpdate && callStatus.haveMedia) {
            setPendingUpdate(false)
            smallFeedlEl.current.srcObject = streams.localStream.stream
            // add tracks to the peerConnection
            startLocalVideoStream(streams, dispatch);
        }
    }, [pendingUpdate, callStatus.haveMedia])

    return (
        <div className="button-wrapper video-button d-inline-block">
            <i className="fa fa-caret-up choose-video" onClick={() => setCaretOpen(!caretOpen)}></i>
            <div className="button camera" onClick={startStopVideo}>
                <i className="fa fa-video"></i>
                <div className="btn-text">{callStatus.video === "enabled" ? "Stop" : "Start"} Video</div>
            </div>
            {caretOpen ? <ActionButtonCaretDropDown 
                            defaultValue={callStatus.videoDevice} 
                            changeHandler={changeVideoDevice}
                            deviceList={videoDeviceList}
                            type="video" /> : <></>}
        </div>
    )
}
export default VideoButton;