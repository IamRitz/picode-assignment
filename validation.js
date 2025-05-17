const { z } = require('zod');

// Zod schema for validating /send-message
const sendMessageSchema = z.object({
  text: z.string().min(1, "Message text is required")
});

const SlackEventSchema = z.object({
  type: z.string(), // e.g. 'event_callback', 'url_verification'
  event_id: z.string().optional(),
  team_id: z.string().optional(),
  api_app_id: z.string().optional(),
  challenge: z.string().optional(),

  event: z.object({
    type: z.string(),       // e.g. 'message'
    user: z.string().optional(),
    text: z.string().optional(),
    channel: z.string().optional(),
    ts: z.string().optional(),
    bot_id: z.string().optional(),
    subtype: z.string().optional(),
  }).optional(),
});

module.exports = { SlackEventSchema, sendMessageSchema };
