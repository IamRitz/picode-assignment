require("dotenv").config();
const axios = require("axios");
const { App } = require("@slack/bolt");

// Load environment variables
const signingSecret = process.env["SLACK_SIGNING_SECRET"];
const botToken = process.env["SLACK_BOT_TOKEN"];

// Initialize Bolt App
const app = new App({
    signingSecret: signingSecret,
    token: botToken,
});

const timers = new Map();

app.event('message', async ({ event, client }) => {
  const channelId = event.channel;

  // Clear previous timer if it exists
  if (timers.has(channelId)) {
    clearTimeout(timers.get(channelId));
  }

  // Start a new 5-second timer
  const timer = setTimeout(async () => {
    try {
      await client.chat.postMessage({
        channel: channelId,
        text: 'Acknowledged ✅',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, 5000);

  // Save timer for this channel
  timers.set(channelId, timer);
});

// Start the app
(async () => {
    await app.start(process.env.PORT || 3000);

    console.log("⚡️ Bolt app is running on port 3000!");

    app.message("quote", async ({ message, say }) => {
        try {
            const resp = await axios.get("https://zenquotes.io/api/random");
            const quote = resp.data[0].q + " — " + resp.data[0].a;

            console.log(message); // Log the message

            await say(`Hello, <@${message.user}>, ${quote}`);
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    });

})();

