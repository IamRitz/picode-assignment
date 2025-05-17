require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { WebClient } = require('@slack/web-api');

const app = express();
app.use(express.json());

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
const PORT = process.env.PORT || 3000;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const AUTH_TOKEN = process.env.API_AUTH_TOKEN;

// Verify Slack Signature
function verifySlackRequest(req, res, next) {
    const slackSignature = req.headers['x-slack-signature'];
	const requestTimestamp = req.headers['x-slack-request-timestamp'];

	// Avoid replay attacks
	const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
	if (requestTimestamp < fiveMinutesAgo) {
		return res.status(400).send('Ignored (too old)');
	}

	const sigBaseString = `v0:${requestTimestamp}:${JSON.stringify(req.body)}`;
	const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
	const mySignature = `v0=${hmac.update(sigBaseString).digest('hex')}`;

	if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
		return next();
	}

	return res.status(400).send('Slack verification failed');
}

// channel message timer
const ackTimers = {}; 

app.post('/slack/events', verifySlackRequest, async (req, res) => {

    try {
        const { type, challenge, event } = req.body;

        if (type === 'url_verification') {
            return res.status(200).send({ challenge });
        }

        if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
            console.log(`[Slack] Message received: ${event.text} from user ${event.user}`);

            // Reset acknowledgment timer for the channel to avoid duplicate acknowledgments
            if (ackTimers[event.channel]) clearTimeout(ackTimers[event.channel]);

            // Store the acknowledgment timer for the channel
            ackTimers[event.channel] = setTimeout(async () => {
                try {
                    await slackClient.chat.postMessage({
                        channel: event.channel,
                        text: 'acknowledged'
                    });
                    console.log(`[Slack] Sent "acknowledged" to ${event.channel}`);
                } catch (err) {
                    console.error('Error sending acknowledgment:', err);
                }
            }, 5000);
        }

        res.sendStatus(200);
    }
    catch (error) {
        console.error('Error in /slack/events:', err);
        return res.status(500).send('Server Error');
    }
});


// root health check
app.get('/', (req, res) => {
	res.send('Slack bot backend is running');
});

// Start server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

