// Telegram client using Telegraf
const { Telegraf } = require('telegraf');

// Initialize bot with token from environment variable
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Export the bot instance
module.exports = bot;
