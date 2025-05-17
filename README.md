# Slack Webhook & Messaging Bot

A lightweight Express.js backend service that:

* Receives real-time messages from a Slack channel via the Slack Events API.
* Sends messages back to Slack using a bot.
* Includes token-based authentication, validation, retries, and optional JWT support.

---

## ✨ Features

* Webhook listener for Slack messages via `/slack/events`
* JWT-protected endpoint `/send-message` to send messages to a Slack channel
* HMAC signature verification (Slack Signing Secret)
* Zod-based input validation
* Retry logic for Slack API failures
* Hosted on Railway (can also be deployed on Vercel, Heroku, etc.)

---

## ⚡ Tech Stack & Design Decisions

| Area              | Choice            | Why                                             |
| ----------------- | ----------------- | ----------------------------------------------- |
| Backend Framework | Express.js        | Minimal, fast, widely used                      |
| Validation        | Zod               | Declarative, strict, easy to compose            |
| Slack Integration | `@slack/web-api`  | Official and well-documented Slack SDK          |
| Deployment        | Railway.app       | Free tier, easy GitHub integration, auto HTTPS  |
| Auth for API      | JWT               | Secure, stateless, and decoupled                |
| Signature Check   | HMAC via `crypto` | Required for verifying Slack event authenticity |

---

## 🚀 Setup & Configuration

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/slack-bot-service.git
cd slack-bot-service
yarn install  # or npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=CXXXXXXX
PORT=5000
JWT_SECRET=your_jwt_secret
```

> Get these from the Slack App configuration (see below).

### 3. Slack Setup

1. **Create a Slack Account & Workspace**

   * Go to [https://slack.com](https://slack.com) and sign up (if you don’t already have an account)
   * Create a new workspace or use an existing one

2. **Create a Slack App**

   * Visit [Slack API: Create App](https://api.slack.com/apps) and choose "From scratch"
   * Set the app name and associate it with your workspace

3. **Configure OAuth & Permissions**

   * In the left sidebar, click **OAuth & Permissions**
   * Under "Bot Token Scopes", add:

     * `chat:write`
     * `im:history`
     * `app_mentions:read`
   * Save changes

4. **Install the App**

   * Go to **Install App** in the sidebar and click "Install to Workspace"
   * Approve the requested permissions


5. **Deploy Your Backend First** (e.g. on Railway, Vercel, etc.)

   * This is necessary before Slack can verify the endpoint

6. **Enable Event Subscriptions**

   * Go to **Event Subscriptions** and enable it
   * Set the **Request URL** to your live server URL: `https://yourdomain.com:PORT/slack/events`
   * Subscribe to bot events:

     * `message.channels`
     * `message.im`

7. **Invite Bot to Channel**

   ```bash
   /invite @your-app-name
   ```

8. **Get Signing Secret, Bot Token and Channel ID**

   * Go to **Basic Information** in the sidebar to find the **Signing Secret**
   * **Bot User OAuth Token** (`xoxb-...`) will be available in the **OAuth & Permissions** section
   * Right-Click the channel under your workspace and view the channel details to get the **Channel ID** (e.g., `C12345678`)
   * Copy and paste these into your `.env` file

* Invite bot to your desired channel:

```bash
/invite @your-app-name
```

---

## 📦 Deployment (Railway)

1. Go to [railway.app](https://railway.app)
2. Link GitHub repo and set up environment variables in Railway UI
3. Set start command:

```bash
yarn start  # Railway detects this from package.json automatically
```

4. Access the deployed URL (e.g., `https://slack-bot-production.up.railway.app`)

> The above project is deployed on Railway, and you can find the live version [here](https://picode-assignment-production.up.railway.app/).

---

## 🔍 Testing the API

### Generate JWT Token for Authorization

Run the following command to generate a token using the included script:

```bash
node genjwttoken.js
```

The generated token will be logged to the console. Copy and use it in your API requests.

### Test `/send-message` using curl

```bash
curl -X POST https://yourdomain/send-message \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from cURL!"}'
```

### Test Slack Webhook

* Send a message in the connected channel
* Wait 5 seconds
* You should see a bot reply: `acknowledged`

---

## 🧠 Endpoint Summary

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| POST   | `/slack/events` | Slack webhook receiver        |
| POST   | `/send-message` | Auth-protected message sender |
| GET    | `/`             | Health check route            |

---

## 🚫 Security & Validation

* All incoming Slack messages are verified via HMAC signature
* JWT used for `/send-message` access
* Zod used to validate request headers, body, and env variables

---

## 📁 Folder Structure

```bash
picode-assignment/
├── Assignment.pdf          # Original problem statement
├── genjwttoken.js          # Script to generate JWT tokens manually
├── node_modules/           # Project dependencies
├── package.json            # Project metadata and scripts
├── README.md               # Project documentation
├── server.js               # Main Express server with Slack integration
├── validation.js           # Zod schemas for input validation
├── yarn.lock               # Yarn lockfile for dependency consistency
```

---

## 📄 .env Example

```env
SLACK_SIGNING_SECRET=your-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ID=C12345678
PORT=3000
JWT_SECRET=supersecret
```

---

## 📚 Credits & References

* [Slack API Docs](https://api.slack.com)
* [Slack Events API Signature Verification](https://api.slack.com/authentication/verifying-requests-from-slack)
* [Zod](https://zod.dev)
* [Railway Deployment](https://railway.app)

---

## 🧠 TODO / Optional Enhancements

* Store messages in SQLite
* Dockerize the application for portability
* Deploy on a personal VPS with custom domain
* Add frontend interface
* Rate limiting or per-user command support

