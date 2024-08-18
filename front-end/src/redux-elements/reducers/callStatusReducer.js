const initState = {
    current: "idle",
    video: "off", // video feed status: "off", "enabled", "disabled", "complete"
    audio: "off", // 
    audioDevice: 'default',
    videoDevice: 'default',
    shareScreen: false,
    haveMedia: false,
    haveCreatedOffer: false
}

export default (state = initState, action) => {
    if (action.type === "UPDATE_CALL_STATUS") {
        const copyState = { ...state }
        copyState[action.payload.prop] = action.payload.value
        return copyState
    } else if ((action.type === "LOGOUT_ACTION") || (action.type === "NEW_VERSION")) {
        return initState
    } else {
        return state
    }
}