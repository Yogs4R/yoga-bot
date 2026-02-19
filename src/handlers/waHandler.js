const { askGemini } = require('../lib/geminiClient');

class WhatsAppHandler {
  constructor(sock) {
    this.sock = sock;
    this.setup();
  }

  setup() {
    this.sock.ev.on('messages.upsert', async (m) => {
      // a. Return jika m.type !== 'notify'
      if (m.type !== 'notify') return;
      
      // b. Ambil pesan dengan const msg = m.messages[0];
      const msg = m.messages[0];
      
      // c. Return jika tidak ada pesan (!msg.message) atau jika pesan dari bot sendiri (msg.key.fromMe)
      if (!msg.message || msg.key.fromMe) return;
      
      // d. Ekstrak teks pesan dari msg.message.conversation ATAU msg.message.extendedTextMessage?.text
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      
      // e. Sistem Router
      let replyText = '';
      
      // Periksa apakah pesan dimulai dengan prefix '/'
      if (text.startsWith('/')) {
        // Pisahkan command dan argumen
        const parts = text.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (command) {
          case '/ping':
            replyText = 'Pong! 🏓 (Mode Sistem - Tanpa AI)';
            break;
          case '/saldo':
            replyText = '💰 Fitur Keuangan diproses secara lokal. Saldo Anda aman dari pantauan AI.';
            break;
          default:
            replyText = `Perintah "${command}" tidak dikenali. Coba /ping atau /saldo`;
        }
      } else {
        // Jika bukan command, kirim ke Gemini AI
        try {
          replyText = await askGemini(text);
        } catch (error) {
          console.error('Error dari Gemini AI:', error);
          replyText = 'Maaf, otak AI sedang gangguan.';
        }
      }
      
      // Kirim balasan
      if (replyText) {
        await this.sock.sendMessage(msg.key.remoteJid, { 
          text: replyText 
        });
      }
    });
  }
}

module.exports = WhatsAppHandler;
