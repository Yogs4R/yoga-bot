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
      const cleanText = text.trim(); // Membersihkan spasi berlebih di awal/akhir
      
      // e. Sistem Router
      let replyText = '';
      
      // Periksa apakah pesan dimulai dengan prefix '/'
      if (cleanText.startsWith('/')) {
        // Pisahkan command dan argumen
        const parts = cleanText.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (command) {
          case '/ping':
            replyText = 'Pong! 🏓';
            break;
          case '/saldo':
            replyText = '💰 Fitur Keuangan diproses secara lokal. Saldo Anda aman dari pantauan AI.';
            break;
          case '/info':
            replyText = '🤖 *Informasi Yoga Bot*\n\nSaya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n*Daftar Perintah Sistem:*\n- */ping* : Cek status bot\n- */saldo* : Cek fitur keuangan lokal\n- */info* : Menampilkan pesan ini\n\n*Fitur AI:*\nKirimkan pesan biasa (tanpa awalan \'/\') untuk ngobrol, bertanya seputar coding, teknologi, atau sekadar bertukar pikiran!';
            break;
          default:
            replyText = `Perintah "${command}" tidak dikenali. Coba /ping, /saldo, atau /info`;
        }
      } else {
        // Filter pesan terlalu pendek untuk menghemat kuota AI (misal cuma huruf 'P', 'y', 'ok')
        if (cleanText.length <= 2) {
            replyText = 'Maaf, pesan terlalu pendek atau kurang jelas. 😅 Ketik */info* untuk melihat daftar kemampuanku ya!';
        } else {
            // Jika bukan command dan pesan cukup panjang, kirim ke Gemini AI
            try {
              replyText = await askGemini(cleanText);
            } catch (error) {
              console.error('Error dari Gemini AI:', error);
              
              // Berikan pesan error yang lebih spesifik
              if (error.message.includes('Kuota Gemini AI telah habis')) {
                replyText = 'Maaf, kuota AI saya sudah habis untuk hari ini. Silakan coba lagi besok atau hubungi admin untuk menambah kuota.';
              } else if (error.message.includes('Akses ditolak')) {
                replyText = 'Maaf, akses AI sedang bermasalah (autentikasi gagal). Admin telah diberitahu.';
              } else if (error.message.includes('model tidak ditemukan')) {
                replyText = 'Maaf, konfigurasi AI sedang diperbarui. Coba lagi nanti.';
              } else if (error.message.includes('API key')) {
                replyText = 'Maaf, konfigurasi AI belum lengkap. Admin telah diberitahu.';
              } else {
                replyText = 'Maaf, otak AI sedang gangguan. Coba lagi nanti atau gunakan perintah sistem (/ping, /saldo).';
              }
            }
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