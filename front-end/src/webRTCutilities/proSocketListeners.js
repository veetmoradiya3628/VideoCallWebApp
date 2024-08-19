import updateCallStatus from "../redux-elements/actions/updateCallStatus";

const proSocketListeners = (socket, setApptInfo, dispatch) => {
    socket.on('apptData', apptData => {
        console.log(apptData);
        setApptInfo(apptData);
    })

    socket.on('newOfferWaiting', offerData => {
        dispatch(updateCallStatus('offer', offerData.offer))
        dispatch(updateCallStatus('myRole', 'answerer'))
    })
}
export default proSocketListeners;