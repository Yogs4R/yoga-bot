const { askGemini } = require('../lib/geminiClient');
const handleFinanceCommand = require('../commands/finance/index');

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
          case '/catat':
          case '/pemasukan':
            // Handle finance commands
            replyText = await handleFinanceCommand(command, args, msg.key.remoteJid, 'whatsapp');
            break;
          case '/info':
            replyText = `> *INFORMASI YOGA BOT* 🤖\n\nSaya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n📋 DAFTAR PERINTAH SISTEM:\n- \`/ping\`   : Cek status bot\n- \`/saldo\`  : Cek saldo keuangan\n- \`/catat\`  : Catat pengeluaran\n- \`/pemasukan\`: Catat pemasukan\n- \`/info\`   : Menampilkan pesan ini\n\n💡 FITUR AI:\nKirimkan pesan biasa (tanpa awalan '/') untuk ngobrol,\nbertanya seputar coding, teknologi, atau sekadar bertukar pikiran!\n`;
            break;
          default:
            replyText = `> *COMMAND TIDAK DIKENAL* 🤔\n\nPerintah "${command}" tidak tersedia.\nCoba \`/ping\`, \`/saldo\`, \`/catat\`, \`/pemasukan\`, atau \`/info\`.\n`;
        }
      } else {
        // Filter pesan terlalu pendek untuk menghemat kuota AI (misal cuma huruf 'P', 'y', 'ok')
        if (cleanText.length <= 2) {
            replyText = '> *PESAN TERLALU PENDEK* 📏\n\nMaaf, pesan terlalu pendek atau kurang jelas.\nKetik `/info` untuk melihat daftar kemampuanku ya!';
        } else {
            // Jika bukan command dan pesan cukup panjang, kirim ke Gemini AI
            try {
              replyText = await askGemini(cleanText);
            } catch (error) {
              console.error('Error dari Gemini AI:', error);
              
              // Berikan pesan error yang lebih spesifik
              if (error.message.includes('Kuota Gemini AI telah habis')) {
                replyText = '> *KUOTA AI HABIS* 💸\n\nMaaf, kuota AI saya sudah habis untuk hari ini.\nSilakan coba lagi besok atau hubungi admin untuk menambah kuota.';
              } else if (error.message.includes('Akses ditolak')) {
                replyText = '> *AKSES DITOLAK* 🔒\n\nMaaf, akses AI sedang bermasalah (autentikasi gagal).\nAdmin telah diberitahu.';
              } else if (error.message.includes('model tidak ditemukan')) {
                replyText = '> *MODEL TIDAK DITEMUKAN* 🔍\n\nMaaf, konfigurasi AI sedang diperbarui.\nCoba lagi nanti.';
              } else if (error.message.includes('API key')) {
                replyText = '> *API KEY TIDAK VALID* 🔑\n\nMaaf, konfigurasi AI belum lengkap.\nAdmin telah diberitahu.';
              } else {
                replyText = '> *ERROR AI* 🤯\n\nMaaf, otak AI sedang gangguan.\nCoba lagi nanti atau gunakan perintah sistem (/ping, /saldo).';
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
