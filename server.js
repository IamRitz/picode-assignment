require('dotenv').config();
const express = require('express');
const { SlackEventSchema, sendMessageSchema } = require('./validation');

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

    if (!slackSignature || !requestTimestamp) {
        console.warn('[Slack Verification] Missing Slack headers');
        return res.status(400).send('Missing Slack headers');
    }

    // Check if the request is a retry and ignore it
    if (req.headers['x-slack-retry-num']) {
        console.log('Slack retry detected');
        return res.sendStatus(200);
    }

	// Avoid replay attacks
	const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
	if (requestTimestamp < fiveMinutesAgo) {
		return res.status(400).send('Ignored (too old)');
	}

    const parsed = SlackEventSchema.safeParse(req.body);

    // Check if the request body is valid
    if (!parsed.success) {
        console.warn('[Slack Verificatioion] Invalid Slack body:', parsed.error.flatten());
        return res.status(400).json({
          error: 'Invalid Slack request body',
          issues: parsed.error.issues,
        });
    }

	const sigBaseString = `v0:${requestTimestamp}:${JSON.stringify(req.body)}`;
	const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
	const mySignature = `v0=${hmac.update(sigBaseString).digest('hex')}`;

	if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
		return next();
	}
    else{
        console.log("[Slack Verification] Signature verification failed");
        return res.status(400).send('Slack verification failed');
    }
}

// Function to send a message to Slack with retries in case of failure
async function safeSlackPostMessage(client, params, retries = 2) {
	try {
		return await client.chat.postMessage(params);
	} catch (err) {
		if (retries > 0) {
			console.warn('Slack API failed, retrying...', err.message);
			await new Promise(res => setTimeout(res, 1000)); // wait 1s
			return safeSlackPostMessage(client, params, retries - 1);
		} else {
			throw err;
		}
	}
}


const ackTimers = {};  // channel message timer

// /slack/events - endpoint to handle Slack events and messages
app.post('/slack/events', verifySlackRequest, async (req, res) => {
    try {
        const { type, challenge, event } = req.body;

        if (type === 'url_verification') {
            return res.status(200).send({ challenge });
        }

        if (event.subtype === 'bot_message' || event.bot_id) {
            console.log('[Slack] Ignoring bot message from bot');
            return res.sendStatus(200); // Ignore messages from any bot
        }

        if (type === 'event_callback' && event.type === 'message' && !event.bot_id) {
            console.log(`[Slack] Message received: ${event.text} from user ${event.user}`);

            // Reset acknowledgment timer for the channel to avoid duplicate acknowledgments
            if (ackTimers[event.channel]) clearTimeout(ackTimers[event.channel]);

            // Store the acknowledgment timer for the channel
            ackTimers[event.channel] = setTimeout(async () => {
                try {
                    await safeSlackPostMessage(slackClient, {
                        channel: event.channel,
                        text: 'acknowledged'
                    });
                    console.log(`[Slack] Sent "acknowledged" to ${event.channel}`);
                } catch (err) {
                    console.error('Slack message failed after retries:', err);
                }
            }, 5000);
        }

        res.sendStatus(200);
    }
    catch (error) {
        console.error('Error in /slack/events:', error);
        return res.status(500).send('Server Error');
    }
});


function jwtAuthMiddleware(req, res, next) {
	const authHeader = req.headers['authorization'] || '';
	const token = authHeader.split(' ')[1]; // Bearer <token>

	if (!token) {
		return res.status(401).json({ error: 'Token missing' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;  // Store user info in request object, can be used later
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

// /send-message - endpoint to send a message to the given channel
app.post('/send-message', jwtAuthMiddleware, async (req, res) => {
	const validation = sendMessageSchema.safeParse(req.body);

	if (!validation.success) {
		return res.status(400).json({
			error: 'Validation failed',
			details: validation.error.format()
		});
	}

	const { text } = validation.data;

	try {
		const result = await slackClient.chat.postMessage({
			channel: SLACK_CHANNEL_ID,
			text
		});
		res.status(200).json({ success: true, slackResponse: result });
	} catch (err) {
		console.error('Slack send error:', err);
		res.status(500).json({ error: 'Failed to send message' });
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
