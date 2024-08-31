const io = require('./server').io;
const app = require('./server').app;
const jwt = require('jsonwebtoken')
const linkSecret = "aklsdalkdaskdnasa";

// const professionalAppointments = app.get('professionalAppointments')
const connectedProfessionals = []
const connectedClients = []
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
        // send the appointment data out to the professional
        const professionalAppointments = app.get('professionalAppointments')
        socket.emit('apptData', professionalAppointments.filter(pa => pa.professionalsFullName === fullName))

        // loop through all known offer and sent out to the professional that just joined,
        // the ones that belongs to him / her
        for (const key in allKnownOffers) {
            if (allKnownOffers[key].professionalsFullName === fullName) {
                // this offer is for this pro
                io.to(socket.id).emit('newOfferWaiting', allKnownOffers[key])
            }
        }
    } else {
        console.log(`This is client`);
        const { professionalsFullName, uuid, clientName } = decodedData;
        const clientExists = connectedClients.find((c) => c.uuid == uuid);
        if (clientExists) {
            clientExists.socketId = socket.id;
        } else {
            connectedClients.push({
                clientName,
                uuid,
                professionalMeetingWith: professionalsFullName,
                socketId: socket.id,
            })
        }
        const offerForThisClient = allKnownOffers[uuid]
        if (offerForThisClient) {
            io.to(socket.id).emit('answerToClient', offerForThisClient.answer)
        }
    }

    console.log(connectedProfessionals);

    socket.on('newAnswer', ({ answer, uuid }) => {
        // emit this to the client
        const socketToSendTo = connectedClients.find((c) => c.uuid == uuid)
        if (socketToSendTo) {
            socket.to(socketToSendTo.socketId).emit('answerToClient', answer)
        }
        // update the offer
        const KnownOffer = allKnownOffers[uuid]
        if (KnownOffer) {
            KnownOffer.answer = answer;
        }
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

        const professionalAppointments = app.get('professionalAppointments')
        const pa = professionalAppointments.find(pa => pa.uuid === apptInfo.uuid)
        if (pa) {
            pa.waiting = true
        }

        // we need to emit it to only required professional, not to every one
        const p = connectedProfessionals.find((cp) => cp.fullName === apptInfo.professionalsFullName)
        if (p) {
            // only emit if professional is logged in / active
            const socketId = p.socketId;
            socket.to(socketId).emit('newOfferWaiting', allKnownOffers[apptInfo.uuid])
            socket.to(socketId).emit('apptData', professionalAppointments.filter(pa => pa.professionalsFullName === apptInfo.professionalsFullName))
        }
    })

    socket.on('getIce', (uuid, who, ackFunc) => {
        const offer = allKnownOffers[uuid];
        let iceCandidates = [];
        if (who === "professional") {
            iceCandidates = offer.offererIceCandidates
        } else if (who === "client") {
            iceCandidates = offer.answerIceCandidates
        }
        ackFunc(iceCandidates)
    })

    socket.on('iceToServer', ({ who, iceC, uuid }) => {
        console.log("=========================", who);
        const offerToUpdate = allKnownOffers[uuid];
        if (offerToUpdate) {
            if (who === "client") {
                // this means the client has sent an ice candidates
                // update the offer
                offerToUpdate.offererIceCandidates.push(iceC);
            } else if (who === "professional") {
                offerToUpdate.answerIceCandidates.push(iceC);
            }
        }
    })
})