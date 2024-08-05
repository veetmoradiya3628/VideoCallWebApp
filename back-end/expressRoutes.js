const app = require('./server').app;
const jwt = require('jsonwebtoken')
const linkSecret = "aklsdalkdaskdnasa";

// this route is for us - internal use, for external system scheduling app or some interface should sent this link out
app.get('/user-link', (req, res) => {

    // data for the end user's appt
    const apptData = {
        professionalsFullName: "Robert Bunch, J.D.",
        apptDate: Date.now()
    }

    // we need to encode this data into token
    const token = jwt.sign(apptData, linkSecret);
    res.send(`https://localhost:3000/join-video?token=${token}`)
})

app.post('/validate-link', (req, res) => {
    const token = req.body.token;
    const decodedData = jwt.verify(token, linkSecret);
    res.json(decodedData)
})