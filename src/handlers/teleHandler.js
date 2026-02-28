// Telegram message/event handler
const bot = require('../lib/telegramClient');
const { askGemini } = require('../lib/geminiClient');
const handleFinanceCommand = require('../commands/finance/index');

function setupTelegramBot() {
    // Event listener for text messages
    bot.on('text', async (ctx) => {
        let text = ctx.message.text.trim();
        const userId = ctx.from.id.toString();
        
        // Bersihkan teks dari username bot jika ada
        // Format: /command@bot_username atau @bot_username pesan
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YogaBot';
        const botMentionRegex = new RegExp(`@${botUsername}\\b`, 'g');
        text = text.replace(botMentionRegex, '').trim();
        
        // Handle commands
        if (text.startsWith('/')) {
            const parts = text.split(' ');
            let command = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            // Normalisasi command: ganti /laporan-chart menjadi /laporan_chart
            if (command === '/laporan-chart') {
                command = '/laporan_chart';
            }
            
            switch (command) {
                case '/start':
                    const welcomeHeader = '> *SELAMAT DATANG DI YOGA BOT* 🤖';
                    const welcomeBody = `Halo ${ctx.from.first_name || 'Pengguna'}! Saya adalah asisten virtual pribadi.\n\nGunakan /info untuk melihat daftar perintah lengkap.\n\nBot ini dapat membantu Anda dengan:\n• Manajemen keuangan (/saldo, /catat, dll)\n• Percakapan AI (langsung ketik pesan)\n• Dan berbagai fitur lainnya!`;
                    await ctx.reply(`${welcomeHeader}\n\n${welcomeBody}`, { parse_mode: 'Markdown' });
                    break;
                    
                case '/ping':
                    await ctx.reply('Pong! 🏓');
                    break;
                    
                case '/info':
                    const header = '> *INFORMASI YOGA BOT* 🤖';
                    const body = `Saya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n📋 *FITUR KEUANGAN* 💰\n- \`/saldo\`         : Cek saldo keuangan\n- \`/catat\`         : Catat pengeluaran\n- \`/pemasukan\`     : Catat pemasukan\n- \`/laporan_chart\` : Grafik laporan keuangan\n- \`/riwayat\`       : Riwayat transaksi terakhir\n- \`/hapus\`         : Hapus transaksi\n- \`/edit\`          : Edit transaksi\n\n📋 *FITUR SISTEM* ⚙️\n- \`/ping\`          : Cek status bot\n- \`/info\`          : Menampilkan pesan ini\n- \`/start\`         : Memulai bot\n\n💡 *FITUR AI* 🧠\nKirimkan pesan biasa (tanpa awalan '/') untuk ngobrol,\nbertanya seputar coding, teknologi, atau sekadar bertukar pikrian!`;
                    await ctx.reply(`${header}\n\n${body}`, { parse_mode: 'Markdown' });
                    break;
                    
                case '/saldo':
                case '/catat':
                case '/pemasukan':
                case '/laporan_chart':
                case '/riwayat':
                case '/hapus':
                case '/edit':
                    try {
                        const replyText = await handleFinanceCommand(command, args, userId, 'telegram');
                        await ctx.reply(replyText, { parse_mode: 'Markdown' });
                    } catch (error) {
                        console.error('Error handling finance command in Telegram:', error);
                        const errorHeader = '> *ERROR SISTEM* ❌';
                        const errorBody = `Terjadi kesalahan saat memproses perintah: ${error.message}`;
                        await ctx.reply(`${errorHeader}\n\n${errorBody}`, { parse_mode: 'Markdown' });
                    }
                    break;
                    
                default:
                    const defaultHeader = '> *COMMAND TIDAK DIKENAL* ❌';
                    const defaultBody = `Perintah "${command}" tidak tersedia.\nGunakan /info untuk melihat daftar perintah yang tersedia.`;
                    await ctx.reply(`${defaultHeader}\n\n${defaultBody}`, { parse_mode: 'Markdown' });
            }
        } else {
            // AI Path: Non-command messages
            if (text.length <= 2) {
                const shortHeader = '> *PESAN TERLALU PENDEK* 📏';
                const shortBody = `Maaf, pesan terlalu pendek atau kurang jelas.\nKetik \`/info\` untuk melihat daftar kemampuanku ya!`;
                await ctx.reply(`${shortHeader}\n\n${shortBody}`, { parse_mode: 'Markdown' });
                return;
            }
            
            try {
                const geminiReply = await askGemini(text);
                await ctx.reply(geminiReply, { parse_mode: 'Markdown' });
            } catch (error) {
                console.error('Error from Gemini AI in Telegram:', error);
                
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
                    errorHeader = '> *ERROR AI* ❌';
                    errorBody = 'Maaf, otak AI sedang gangguan.\nCoba lagi nanti atau gunakan perintah sistem (/ping, /saldo).';
                }
                await ctx.reply(`${errorHeader}\n\n${errorBody}`, { parse_mode: 'Markdown' });
            }
        }
    });
    
    // Error handling
    bot.catch((err, ctx) => {
        console.error(`Telegram Bot Error for ${ctx.updateType}:`, err);
        ctx.reply('> *ERROR SISTEM* ❌\n\nTerjadi kesalahan internal. Silakan coba lagi nanti.', { parse_mode: 'Markdown' });
    });
}

module.exports = { setupTelegramBot };
