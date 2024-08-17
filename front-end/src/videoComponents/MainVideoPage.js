import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from 'axios';
import './videoComponents.css';
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButtons";
import addStrem from "../redux-elements/actions/addStream"
import { useDispatch } from "react-redux";
import createPeerConnection from "../webRTCutilities/createPeerConnection";
import socket from "../webRTCutilities/socketConnection"
import updateCallStatus from "../redux-elements/actions/updateCallStatus";

const MainVideoPage = () => {
    const dispatch = useDispatch()

    const [searchParams, setSearchParams] = useSearchParams();
    const [apptInfo, setApptInfo] = useState({})
    const smallFeedEl = useRef(null);
    const largeFeedEl = useRef(null);

    useEffect(() => {
        // fetch user media
        const fetchMedia = async () => {
            const constraints = {
                video: true,
                audio: true
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                dispatch(updateCallStatus('haveMedia', true))
                dispatch(addStrem('localStream', stream))
                const { peerConnection, remoteStream } = await createPeerConnection()
                dispatch(addStrem('remote1', remoteStream, peerConnection))
            } catch (err) {
                console.log(err);
            }
        }
        fetchMedia()
    }, [])

    useEffect(() => {
        const token = searchParams.get('token');
        console.log(token);

        const fetchDecoedToken = async () => {
            const resp = await axios.post('https://localhost:9000/validate-link', { token })
            console.log(resp.data);
            setApptInfo(resp.data);
        }
        fetchDecoedToken()
    }, [])

    return (
        <div className="main-video-page">
            <div className="video-chat-wrapper">
                {/* Div to hold our own video, remote video & our chat window */}
                <video ref={largeFeedEl} id="large-feed" autoPlay controls playsInline></video>
                <video ref={smallFeedEl} id="own-feed" autoPlay controls playsInline></video>

                {apptInfo.professionalsFullName ? <CallInfo apptInfo={apptInfo} /> : <></>}

                <ChatWindow />
            </div>
            <ActionButtons smallFeedlEl={smallFeedEl} />
        </div>
    )
}

export default MainVideoPage;