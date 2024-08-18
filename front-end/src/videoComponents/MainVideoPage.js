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

const MainVideoPage = () => {
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
                const { peerConnection, remoteStream } = await createPeerConnection()
                dispatch(addStrem('remote1', remoteStream, peerConnection))
            } catch (err) {
                console.log(err);
            }
        }
        fetchMedia()
    }, [])

    useEffect(() => {
        const createOfferAsync = async () => {
            for (const s in streams) {
                if (s !== "localStream") {
                    try {
                        const pc = streams[s].peerConnection;
                        const offer = await pc.createOffer();
                        // get the token from the url for socket connection
                        const token = searchParams.get('token');
                        const socket = socketConnection(token);
                        socket.emit('newOffer', { offer, apptInfo })
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
            dispatch(updateCallStatus('haveCreatedOffer', true));
        }
        if (callStatus.audio === "enabled"
            && callStatus.video === "enabled"
            && !callStatus.haveCreatedOffer) {
            // we have audio and video and now we need offer, let's make it
            createOfferAsync()
        }

    }, [callStatus.audio, callStatus.video, callStatus.haveCreatedOffer])

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