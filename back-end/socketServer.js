const io = require('./server').io;
const app = require('./server').app;

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

    // to fill in later
    const fullName = socket.handshake.auth.fullName;

    connectedProfessionals.push({
        socketId: socket.id,
        fullName: fullName,
    })

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
        if(p){
            // only emit if professional is logged in / active
            const socketId = p.socketId;
            socket.to(socketId).emit('newOfferWaiting', allKnownOffers[apptInfo.uuid])
        }
    })
})