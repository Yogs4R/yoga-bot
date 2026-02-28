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
      
      // Deteksi apakah pesan dari grup
      const isGroup = msg.key.remoteJid.endsWith('@g.us');
      
      // Dapatkan bot ID
      const botId = this.sock.user?.id?.split(':')[0] || this.sock.user?.id;
      
      // Periksa apakah bot di-mention atau di-reply
      let isBotMentioned = false;
      let text = '';
      
      // Ambil teks pesan
      if (msg.message?.conversation) {
        text = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        text = msg.message.extendedTextMessage.text;
      }
      
      // Periksa mention di extendedTextMessage
      const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      // Periksa apakah pesan adalah reply ke bot
      const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant === botId || 
                           msg.message?.extendedTextMessage?.contextInfo?.stanzaId?.includes(botId);
      
      // Cek apakah bot di-mention
      if (botId && mentionedJids.includes(botId)) {
        isBotMentioned = true;
      }
      
      // Jika di grup dan bot tidak di-mention atau di-reply, abaikan pesan
      if (isGroup && !isBotMentioned && !isReplyToBot) {
        return;
      }
      
      // Bersihkan teks dari mention jika bot di-mention
      let cleanText = text.trim();
      if (isBotMentioned && botId) {
        // Hapus mention dari teks (format: @628123456789)
        const mentionRegex = new RegExp(`@${botId}\\s*`, 'g');
        cleanText = cleanText.replace(mentionRegex, '').trim();
      }
      
      // e. Sistem Router
      let replyText = '';
      
      // Periksa apakah pesan dimulai dengan prefix '/'
      if (cleanText.startsWith('/')) {
        // Pisahkan command dan argumen
        const parts = cleanText.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Normalisasi command: ganti /laporan-chart menjadi /laporan_chart
        let normalizedCommand = command;
        if (normalizedCommand === '/laporan-chart') {
          normalizedCommand = '/laporan_chart';
        }
        
        switch (normalizedCommand) {
          case '/ping':
            replyText = 'Pong! 🏓';
            break;
          case '/saldo':
          case '/catat':
          case '/pemasukan':
          case '/laporan_chart':
          case '/riwayat':
          case '/hapus':
          case '/edit':
            // Handle finance commands
            const financeReply = await handleFinanceCommand(normalizedCommand, args, msg.key.remoteJid, 'whatsapp');
            if (financeReply) {
              if (typeof financeReply === 'object' && financeReply.type === 'image') {
                await this.sock.sendMessage(msg.key.remoteJid, 
                  { 
                    image: { url: financeReply.url }, 
                    caption: financeReply.caption 
                  }, 
                  { quoted: msg }
                );
              } else {
                await this.sock.sendMessage(msg.key.remoteJid, 
                  { text: financeReply }, 
                  { quoted: msg }
                );
              }
              return; // Hentikan eksekusi agar tidak lanjut ke AI
            }
            break;
          case '/start':
            const startHeader = '> *SELAMAT DATANG DI YOGA BOT* 🤖';
            const startBody = `Halo! Saya adalah asisten virtual pribadi.\n\nGunakan /info untuk melihat daftar perintah lengkap.\n\nBot ini dapat membantu Anda dengan:\n• Manajemen keuangan (/saldo, /catat, dll)\n• Percakapan AI (langsung ketik pesan)\n• Dan berbagai fitur lainnya!`;
            replyText = `${startHeader}\n\n${startBody}`;
            break;
          case '/info':
            const header = '> *INFORMASI YOGA BOT* 🤖';
            const body = `Saya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n📋 *FITUR KEUANGAN* 💰\n- \`/saldo\`         : Cek saldo keuangan\n- \`/catat\`         : Catat pengeluaran\n- \`/pemasukan\`     : Catat pemasukan\n- \`/laporan_chart\` : Grafik laporan keuangan\n- \`/riwayat\`       : Riwayat transaksi terakhir\n- \`/hapus\`         : Hapus transaksi\n- \`/edit\`          : Edit transaksi\n\n📋 *FITUR SISTEM* ⚙️\n- \`/ping\`          : Cek status bot\n- \`/info\`          : Menampilkan pesan ini\n- \`/start\`         : Memulai bot\n\n💡 *FITUR AI* 🧠\nKirimkan pesan biasa (tanpa awalan '/') untuk ngobrol,\nbertanya seputar coding, teknologi, atau sekadar bertukar pikiran!`;
            replyText = `${header}\n\n${body}`;
            break;
          default:
            const defaultHeader = '> *COMMAND TIDAK DIKENAL* 🤔';
            const defaultBody = `Perintah "${command}" tidak tersedia.\nCoba \`/ping\`, \`/saldo\`, \`/catat\`, \`/pemasukan\`, \`/laporan_chart\`, atau \`/info\`.`;
            replyText = `${defaultHeader}\n\n${defaultBody}`;
        }
      } else {
        // Filter pesan terlalu pendek untuk menghemat kuota AI (misal cuma huruf 'P', 'y', 'ok')
        if (cleanText.length <= 2) {
            const shortHeader = '> *PESAN TERLALU PENDEK* 📏';
            const shortBody = `Maaf, pesan terlalu pendek atau kurang jelas.\nKetik \`/info\` untuk melihat daftar kemampuanku ya!`;
            replyText = `${shortHeader}\n\n${shortBody}`;
        } else {
            // Jika bukan command dan pesan cukup panjang, kirim ke Gemini AI
            try {
              replyText = await askGemini(cleanText);
            } catch (error) {
              console.error('Error dari Gemini AI:', error);
              
              // Berikan pesan error yang lebih spesifik
              let errorHeader, errorBody;
              if (error.message.includes('Kuota Gemini AI telah habis')) {
                errorHeader = '> *KUOTA AI HABIS* 💸';
                errorBody = 'Maaf, kuota AI saya sudah habis untuk hari ini.\nSilakan coba lagi besok atau hubungi admin untuk menambah kuota.';
              } else if (error.message.includes('Akses ditolak')) {
                errorHeader = '> *AKSES DITOLAK* 🔒';
                errorBody = 'Maaf, akses AI sedang bermasalah (autentikasi gagal).\nAdmin telah diberitahu.';
              } else if (error.message.includes('model tidak ditemukan')) {
                errorHeader = '> *MODEL TIDAK DITEMUKAN* 🔍';
                errorBody = 'Maaf, konfigurasi AI sedang diperbarui.\nCoba lagi nanti.';
              } else if (error.message.includes('API key')) {
                errorHeader = '> *API KEY TIDAK VALID* 🔑';
                errorBody = 'Maaf, konfigurasi AI belum lengkap.\nAdmin telah diberitahu.';
              } else {
                errorHeader = '> *ERROR AI* 🤯';
                errorBody = 'Maaf, otak AI sedang gangguan.\nCoba lagi nanti atau gunakan perintah sistem (/ping, /saldo).';
              }
              replyText = `${errorHeader}\n\n${errorBody}`;
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
