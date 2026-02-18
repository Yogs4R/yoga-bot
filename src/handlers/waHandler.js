const { default: makeWASocket } = require('@whiskeysockets/baileys');

class WhatsAppHandler {
  constructor(client) {
    this.client = client;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for incoming messages
    this.client.ev.on('messages.upsert', async ({ messages }) => {
      const message = messages[0];
      
      // Skip if message is from yourself or not a text message
      if (!message.message || message.key.fromMe) {
        return;
      }

      const text = message.message.conversation || 
                   message.message.extendedTextMessage?.text || 
                   message.message.imageMessage?.caption ||
                   '';
      
      const sender = message.key.remoteJid;
      const isGroup = sender.endsWith('@g.us');
      
      console.log(`Pesan dari ${isGroup ? 'grup' : 'pribadi'}: ${sender} - ${text}`);
      
      // Handle commands
      await this.handleCommand(text, sender, message);
    });

    // You can add more event listeners here for other types of events
  }

  async handleCommand(text, sender, message) {
    // Trim and convert to lowercase for easier matching
    const command = text.trim().toLowerCase();
    
    // Example: Echo command
    if (command === '!ping') {
      await this.sendMessage(sender, 'Pong!');
    } 
    // Add more commands here
    else if (command === '!help') {
      const helpText = `Daftar perintah:
!ping - Balas dengan Pong!
!help - Menampilkan pesan bantuan ini`;
      await this.sendMessage(sender, helpText);
    }
    // You can add more command handlers here
  }

  async sendMessage(jid, text) {
    try {
      await this.client.sendMessage(jid, { text: text });
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
    }
  }

  // You can add more methods for handling different types of messages, media, etc.
}

module.exports = WhatsAppHandler;
