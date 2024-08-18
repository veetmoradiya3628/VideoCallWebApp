const app = require('./server').app;
const jwt = require('jsonwebtoken')
const linkSecret = "aklsdalkdaskdnasa";
const { v4: uuidv4 } = require('uuid');

const professionalAppointments = []

app.set('professionalAppointments', professionalAppointments)

// this route is for us - internal use, for external system scheduling app or some interface should sent this link out
app.get('/user-link', (req, res) => {
    const uuid = uuidv4(); // this is standing as primary key

    // data for the end user's appt
    const apptData = {
        professionalsFullName: "Robert Bunch, J.D.",
        apptDate: Date.now() + 500000,
        uuid,
        clientName: "Jim Jones"
    }

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