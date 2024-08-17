import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import getDevices from "../../webRTCutilities/getDevices";
import addStream from "../../redux-elements/actions/addStream";
import updateCallStatus from "../../redux-elements/actions/updateCallStatus";
import ActionButtonCaretDropDown from "../ActionButtonCaretDropDown";
import startAudioStream from "./startAudioStream";

const AudioButton = ({ smallFeedlEl }) => {
    const dispatch = useDispatch();

    const callStatus = useSelector(state => state.callStatus);
    const streams = useSelector(state => state.streams);

    const [caretOpen, setCaretOpen] = useState(false);
    const [audioDeviceList, setAudioDeviceList] = useState([]);

    let micText;
    if (callStatus.audio === "off") {
        micText = "Join Audio"
    } else if (callStatus.audio === "enabled") {
        micText = "Mute"
    } else {
        micText = "Unmute"
    }

    useEffect(() => {
        const getDevicesAsync = async () => {
            if (caretOpen) {
                //then we need to check for audio devices
                const devices = await getDevices();
                console.log(devices);

                setAudioDeviceList(devices.audioOutputDevices.concat(devices.audioInputDevices))
            }
        }
        getDevicesAsync()
    }, [caretOpen])

    const startStopAudio = () => {
        if (callStatus.audio === "enabled") {
            dispatch(updateCallStatus('audio', "disabled"));
            // set the stream to disabled
            const tracks = streams.localStream.stream.getAudioTracks();
            tracks.forEach((t) => {
                t.enabled = false
            })
        } else if (callStatus.audio === "disabled") {
            dispatch(updateCallStatus('audio', "enabled"));
            const tracks = streams.localStream.stream.getAudioTracks();
            tracks.forEach((t) => {
                t.enabled = true
            })
        } else {
            changeAudioDevice({ target: { value: "inputdefault" } })
            startAudioStream(streams);
        }
    }

    const changeAudioDevice = async (e) => {
        // user changed the desired output audio device / input audio device
        console.log(e.target.value);
        let deviceId = e.target.value.slice(5);
        let audioType = e.target.value.slice(0, 5);

        // handle output text
        if (audioType === "outpu") {
            audioType = "output"
            deviceId = deviceId.slice(1);
        }

        // console.log(audioType);
        if (audioType === "output") {
            smallFeedlEl.current.setSinkId(deviceId);
        } else if (audioType === "input") {
            // 2. we need to getUserMedia (permission)
            const newConstraints = {
                audio: { deviceId: { exact: deviceId } },
                video: callStatus.videoDevice === "default" ? true : { deviceId: { exact: callStatus.videoDevice } }
            }
            const stream = await navigator.mediaDevices.getUserMedia(newConstraints);

            // 3. update redux with that video deviceId
            dispatch(updateCallStatus('audioDevice', deviceId));
            dispatch(updateCallStatus('audio', 'enabled'))

            // 4. update the smallFeedEl
            dispatch(addStream('localStream', stream))

            // 6. add tracks - actually replaceTracks
            const tracks = stream.getAudioTracks();
            // come back to this later 
        }
    }

    return (
        <div className="button-wrapper d-inline-block">
            <i className="fa fa-caret-up choose-audio" onClick={() => setCaretOpen(!caretOpen)}></i>
            <div className="button mic" onClick={startStopAudio}>
                <i className="fa fa-microphone"></i>
                <div className="btn-text">{micText}</div>
            </div>

            {caretOpen ? <ActionButtonCaretDropDown
                defaultValue={callStatus.audioDevice}
                changeHandler={changeAudioDevice}
                deviceList={audioDeviceList}
                type="audio" /> : <></>}
        </div>
    )
}
export default AudioButton;