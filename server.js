const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require("nodemailer");
const port = process.env.PORT || 3000;

// Enter the Page Access Token from the previous step
const FACEBOOK_PAGE_ACCESS_TOKEN = 'EAAZAdI5IqWlkBABzq5w0NlfvDhGj87KMp6ebQKlUXVryuVoerAAv8y3onNzf6P1ZBVWzDC2GmMBW0Dp17AVvqBkgrFvD9TL7ZAdejQ1NU5gQEzwC0bmG2gmZAcw8puS2cslDHPHAA0rfAEZAeJqJ7gV8R2JjPu6FEu96RWmbTxfoaZCQ2ZBTmqg';

// Accept JSON POST body
app.use(bodyParser.json());

// GET /webhook
app.get('/webhook', (req, res) => {
    // Facebook sends a GET request
    // To verify that the webhook is set up
    // properly, by sending a special challenge that
    // we need to echo back if the "verify_token" is as specified
    if (req.query['hub.verify_token'] === 'CUSTOM_WEBHOOK_VERIFY_TOKEN') {
        res.send(req.query['hub.challenge']);
        return;
    }
})

// POST /webhook
app.post('/webhook', async (req, res) => {
    // Facebook will be sending an object called "entry" for "leadgen" webhook event
    if (!req.body.entry) {
        return res.status(500).send({ error: 'Invalid POST data received' });
    }

    // Traverse entries & changes and process lead IDs
    for (const entry of req.body.entry) {
        for (const change of entry.changes) {
            // Process new lead (leadgen_id)
            await processNewLead(change.value.leadgen_id);
        }
    }

    // Success
    res.send({ success: true });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

// Process incoming leads
async function processNewLead(leadId) {
    let response;

    try {
        // Get lead details by lead ID from Facebook API
        response = await axios.get(`https://graph.facebook.com/v9.0/${leadId}/?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
    }
    catch (err) {
        // Log errors
        return console.warn(`An invalid response was received from the Facebook API:`, err.response.data ? JSON.stringify(err.response.data) : err.response);
    }

    // Ensure valid API response returned
    if (!response.data || (response.data && (response.data.error || !response.data.field_data))) {
        return console.warn(`An invalid response was received from the Facebook API: ${response}`);
    }

    // Lead fields
    const leadForm = [];
    // Extract fields
    for (const field of response.data.field_data) {
        // Get field name & value
        const fieldName = field.name;
        const fieldValue = field.values[0];

        // Store in lead array
        leadForm.push(`${fieldName}: ${fieldValue}`);
    }
    // Implode into string with newlines in between fields
    const leadInfo = leadForm.join('\n');

    // Log to console
    console.log('A new lead was received!\n', leadInfo);

    // Use a library like "nodemailer" to notify you about the new lead
    // Send plaintext e-mail with nodemailer
    // transporter.sendMail({
    //     from: `fateh@famproperties.com`,
    //     to: `inzamam@famproperties.com`,
    //     subject: 'Lead from Primary Real Estate Page',
    //     text: new Buffer(leadInfo),
    //     headers: { 'X-Entity-Ref-ID': 1 }
    // }, function (err) {
    //     if (err) return console.log(err);
    //     console.log('Message sent successfully.');
    // });
    // create reusable transporter object using the default SMTP transport
    var smtpConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use SSL
        auth: {
            user: 'inzamam@famproperties.com',
            pass: 'Allahis0001!'
        }
    };
    var transporter = nodemailer.createTransport(smtpConfig);
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'inzamam@famproperties.com', // sender address
        to: 'inzamam@famproperties.com', // list of receivers
        subject: 'Lead from Primary Real Estate', // Subject line
        text: 'Lead Id:'+response.data.id+'\n'+'Ad Id:1454788844646\n'+'Form Id: 454787955454\n'+Buffer.from(leadInfo), // plaintext body
        headers: { 'X-Entity-Ref-ID': 1 }
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}