import dotenv from 'dotenv';
dotenv.config();
// Import the required modules

import axios from 'axios';
import pkg from '@slack/bolt';
const { App } = pkg;
const signingSecret = process.env['SLACK_SIGNING_SECRET'];
const botToken = process.env['SLACK_BOT_TOKEN'];

const app = new App({
    signingSecret,
    token: botToken,
    });

// Listen for messages in channels
// This will listen to all messages in channels the bot is a member of
// You can also listen to specific channels by using the channel ID
// For example, to listen to a channel with ID C1234567890, use the following code

(async () => { 
    // start the app
    await app.start(process.env.PORT || 5000);


    app.message('quote', async ({ message, say }) => {
        let response = await axios.get('https://api.quotable.io/random');
        console.log(message); // Log the message object
        let quote = response.data.content;
        await say(`Here's a random quote: "${quote}"`);
    });

    console.log('⚡️ Bolt app is running on port 5000!');
})();

export default app;
