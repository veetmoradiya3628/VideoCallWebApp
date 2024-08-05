import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from 'axios';
import './videoComponents.css';
import CallInfo from "./CallInfo";
import ChatWindow from "./ChatWindow";

const MainVideoPage = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const [apptInfo, setApptInfo] = useState({})

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
                <video id="large-feed" autoPlay controls playsInline></video>
                <video id="own-feed" autoPlay controls playsInline></video>

                {apptInfo.professionalsFullName ? <CallInfo apptInfo={apptInfo} /> : <></>}

                <ChatWindow />
            </div>
        </div>
    )
}

export default MainVideoPage;