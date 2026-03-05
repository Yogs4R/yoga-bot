// Application settings
// TODO: Load from environment and define defaults

const path = require('path');

const settings = {
  app: {
    name: 'Yoga Bot',
    version: '1.0.0',
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  whatsapp: {
    sessionDir: process.env.WA_SESSION_DIR || path.join(__dirname, '../../auth/whatsapp'),
    phoneNumber: process.env.WA_PHONE_NUMBER,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    sessionDir: process.env.TELEGRAM_SESSION_DIR || path.join(__dirname, '../../auth/telegram'),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    apiKey: process.env.GOOGLE_API_KEY,
    tokenPath: path.join(__dirname, '../../credentials/google-token.json'),
    serviceAccountPath: path.join(__dirname, '../../credentials/service-account.json'),
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },

  finance: {
    apiKey: process.env.FINANCE_API_KEY,
  },

  weather: {
    apiKey: process.env.WEATHER_API_KEY,
  },

  monitor: {
    url: process.env.MONITOR_URL,
    interval: parseInt(process.env.MONITOR_INTERVAL) || 300000,
  },

  paths: {
    temp: path.join(__dirname, '../../temp'),
    downloads: path.join(__dirname, '../../temp/downloads'),
    credentials: path.join(__dirname, '../../credentials'),
  },
};

module.exports = settings;
