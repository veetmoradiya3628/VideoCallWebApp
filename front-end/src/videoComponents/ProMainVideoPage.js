import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from 'axios';
import './videoComponents.css';
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";
import ActionButtons from "./ActionButtons";
import addStrem from "../redux-elements/actions/addStream"
import { useDispatch, useSelector } from "react-redux";
import createPeerConnection from "../webRTCutilities/createPeerConnection";
import socketConnection from "../webRTCutilities/socketConnection"
import updateCallStatus from "../redux-elements/actions/updateCallStatus";

const ProMainVideoPage = () => {
    const dispatch = useDispatch()

    const callStatus = useSelector(state => state.callStatus)
    const streams = useSelector(state => state.streams)

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
                const { peerConnection, remoteStream } = await createPeerConnection(addIce)
                dispatch(addStrem('remote1', remoteStream, peerConnection))
            } catch (err) {
                console.log(err);
            }
        }
        fetchMedia()
    }, [])

    useEffect(() => {
        const setAsyncOffer = async () => {
            for (const s in streams) {
                if (s !== "localStream") {
                    const pc = streams[s].peerConnection;
                    await pc.setRemoteDescription(callStatus.offer);
                    console.log(pc.signalingState); // should be have remote offer
                }
            }
        }
        if (callStatus.offer && streams.remote1 && streams.remote1.peerConnection) {
            setAsyncOffer()
        }
    }, [callStatus.offer, streams.remote1])

    useEffect(() => {
        const createAnswerAsync = async () => {
            // we have audio and video so we can make answer
            for (const s in streams) {
                if (s !== "localStream") {
                    const pc = streams[s].peerConnection;
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log(pc.signalingState); // should be have local answer
                    dispatch(updateCallStatus('haveCreatedAnswer', true))
                    dispatch(updateCallStatus('answer', answer))

                    // emit the answer to server
                    const token = searchParams.get('token');
                    const socket = socketConnection(token);
                    const uuid = searchParams.get('uuid')
                    socket.emit('newAnswer', { answer, uuid })
                }
            }
        }
        // we only create any answer if audio & video are enabled and have created answer is enabled
        if (callStatus.audio === "enabled" && callStatus.video === "enabled" && !callStatus.haveCreatedAnswer) {
            createAnswerAsync()
        }
    }, [callStatus.audio, callStatus.video, callStatus.haveCreatedAnswer])

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

    const addIce = (iceC) => {
        // emit a new ice candidate to a signaling server
        const socket = socketConnection(searchParams.get('token'));
        socket.emit('iceToServer', {
            iceC,
            who: 'professional',
            uuid: searchParams.get('uuid')
        })
    }

    return (
        <div className="main-video-page">
            <div className="video-chat-wrapper">
                {/* Div to hold our own video, remote video & our chat window */}
                <video ref={largeFeedEl} id="large-feed" autoPlay controls playsInline></video>
                <video ref={smallFeedEl} id="own-feed" autoPlay controls playsInline></video>
                {callStatus.audio === "off" || callStatus.video === "off" ? <div className="call-info">
                    <h1>
                        {searchParams.get('client')} is in waiting room.<br />
                        Call will start when video and audio are enabled
                    </h1>
                </div> : <></>}
                <ChatWindow />
            </div>
            <ActionButtons smallFeedlEl={smallFeedEl} />
        </div>
    )
}

export default ProMainVideoPage;