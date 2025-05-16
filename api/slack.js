import { App, ExpressReceiver } from '@slack/bolt';
import serverless from 'serverless-http';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Setup ExpressReceiver (so you can export handler)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Slack event: reply with a quote when message includes "quote"
app.message('quote', async ({ message, say }) => {
  const response = await axios.get('https://api.quotable.io/random');
  await say(`Here's a quote: "${response.data.content}"`);
});

// Optional root route for health check
receiver.app.get('/', (req, res) => {
  res.send('Slack bot is alive 🚀');
});

// 👇 Export the handler for Vercel serverless
export default serverless(receiver.app);

