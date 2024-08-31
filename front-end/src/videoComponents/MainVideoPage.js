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
import clientSocketListeners from "../webRTCutilities/clientSocketListeners";

const MainVideoPage = () => {
    const dispatch = useDispatch()

    const callStatus = useSelector(state => state.callStatus)
    const streams = useSelector(state => state.streams)

    const [searchParams, setSearchParams] = useSearchParams();
    const [apptInfo, setApptInfo] = useState({})
    const smallFeedEl = useRef(null);
    const largeFeedEl = useRef(null);
    const uuidRef = useRef(null);
    const streamsRef = useRef(null);

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
        if(streams.remote1){
            streamsRef.current = streams;
        }
    }, [streams])

    useEffect(() => {
        const createOfferAsync = async () => {
            for (const s in streams) {
                if (s !== "localStream") {
                    try {
                        const pc = streams[s].peerConnection;
                        const offer = await pc.createOffer();
                        pc.setLocalDescription(offer);
                        // get the token from the url for socket connection
                        const token = searchParams.get('token');
                        const socket = socketConnection(token);
                        socket.emit('newOffer', { offer, apptInfo })

                        // add our event listeners
                        clientSocketListeners(socket, dispatch)
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
        // listen for changes to callStatus.answer
        const asyncAddAnswer = async () => {
            for (const s in streams) {
                if (s !== "localStream") {
                    const pc = streams[s].peerConnection;
                    await pc.setRemoteDescription(callStatus.answer);
                    console.log(pc.signalingState);
                    console.log('answer added');
                }
            }
        }
        if (callStatus.answer) {
            asyncAddAnswer();
        }
    }, [callStatus.answer])

    useEffect(() => {
        const token = searchParams.get('token');
        console.log(token);

        const fetchDecoedToken = async () => {
            const resp = await axios.post('https://localhost:9000/validate-link', { token })
            console.log(resp.data);
            setApptInfo(resp.data);
            uuidRef.current = resp.data.uuid;
        }
        fetchDecoedToken()
    }, [])

    useEffect(() => {
        const token = searchParams.get('token');
        const socket = socketConnection(token);
        clientSocketListeners(socket, addIceCandidateToPc);
    }, [])

    const addIceCandidateToPc = (iceC) => {
        // add the icecandidates from remote to peer connection
        for (const s in streamsRef.current) {
            if (s !== 'localStream') {
                const pc = streamsRef.current[s].peerConnection;
                pc.addIceCandidate(iceC);
                console.log("Added an ice candidate to existing page presence");
            }
        }
    }

    const addIce = (iceC) => {
        // emit a new ice candidate to a signaling server
        const socket = socketConnection(searchParams.get('token'));
        socket.emit('iceToServer', {
            iceC,
            who: 'client',
            uuid: uuidRef.current // we use useRef to keep value updated
        })
    }

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