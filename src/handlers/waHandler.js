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
      
      // e. Jika teks di-lowercase (.toLowerCase()) sama persis dengan "ping", balas pesan
      if (text.toLowerCase() === 'ping') {
        await this.sock.sendMessage(msg.key.remoteJid, { 
          text: 'Pong!  Yoga Bot Online dan siap melayani.' 
        });
      }
    });
  }
}

module.exports = WhatsAppHandler;
