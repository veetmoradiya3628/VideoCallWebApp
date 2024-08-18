const io = require('./server').io;
const app = require('./server').app;
const jwt = require('jsonwebtoken')
const linkSecret = "aklsdalkdaskdnasa";

// const professionalAppointments = app.get('professionalAppointments')
const connectedProfessionals = []
const allKnownOffers = {
    // uniqueId - key
    // offer
    // professionalsFullName
    // clientName
    // apptDate
    // offererIceCandidates
    // answer
    // answerIceCandidates
};


io.on('connection', socket => {
    console.log(`${socket.id} has connected`);

    const handshakeData = socket.handshake.auth.jwt;
    let decodedData;
    try {
        decodedData = jwt.verify(handshakeData, linkSecret);
    } catch (error) {
        console.log(error);
        socket.disconnect();
        return
    }
    const { fullName, proId } = decodedData;
    if (proId) {
        // check to see if this user is already in connected professionals
        const connectedPro = connectedProfessionals.find((cp) => cp.proId === proId);
        if (connectedPro) {
            connectedPro.socketId = socket.id;
        } else {
            connectedProfessionals.push({
                socketId: socket.id,
                fullName: fullName,
                proId
            })
        }
    } else {
        console.log(`This is client`);
    }

    console.log(connectedProfessionals);

    socket.on('newOffer', ({
        offer,
        apptInfo
    }) => {
        // offer = sdp/type, apptInfo has the uuid that we can add to allKnownOffers so that professional can find EXACTLY the right allKnownOffer
        allKnownOffers[apptInfo.uuid] = {
            ...apptInfo,
            offer,
            offererIceCandidates: [],
            answer: null,
            answerIceCandidates: [],
        }

        // we need to emit it to only required professional, not to every one
        const p = connectedProfessionals.find((cp) => cp.fullName === apptInfo.professionalsFullName)
        if (p) {
            // only emit if professional is logged in / active
            const socketId = p.socketId;
            socket.to(socketId).emit('newOfferWaiting', allKnownOffers[apptInfo.uuid])
        }
    })
})