const app = require('./server').app;
const jwt = require('jsonwebtoken')
const linkSecret = "aklsdalkdaskdnasa";
const { v4: uuidv4 } = require('uuid');

// normally this would be persistent data - coming from database or files etc.
const professionalAppointments = [{
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() + 500000,
    uuid: 1,
    clientName: "Jim Jones",
}, {
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() - 2000000,
    uuid: 2,// uuid:uuidv4(),
    clientName: "Akash Patel",
}, {
    professionalsFullName: "Peter Chan, J.D.",
    apptDate: Date.now() + 10000000,
    uuid: 3,//uuid:uuidv4(),
    clientName: "Mike Williams",
}];

app.set('professionalAppointments', professionalAppointments)

// this route is for us - internal use, for external system scheduling app or some interface should sent this link out
app.get('/user-link', (req, res) => {
    const apptData = professionalAppointments[0];
    professionalAppointments.push(apptData)

    // we need to encode this data into token
    const token = jwt.sign(apptData, linkSecret);
    res.send(`https://localhost:3000/join-video?token=${token}`)
})

app.post('/validate-link', (req, res) => {
    const token = req.body.token;
    const decodedData = jwt.verify(token, linkSecret);
    res.json(decodedData)
    console.log(professionalAppointments);
})

app.get('/pro-link', (req, res) => {
    const userData = {
        fullName: 'Peter Chan, J.D.',
        proId: 1234,
    }
    const token = jwt.sign(userData, linkSecret);
    res.send(`<a href="https://localhost:3000/dashboard?token=${token}" target="_blank"> Link Here </a>`)
})