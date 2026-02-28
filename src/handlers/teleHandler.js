// Telegram message/event handler
const bot = require('../lib/telegramClient');
const { Markup } = require('telegraf');
const { askGemini } = require('../lib/geminiClient');
const handleFinanceCommand = require('../commands/finance/index');
const { getHistoryPage } = require('../services/financeService');

const HISTORY_PAGE_SIZE = 5;

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function autoLink(text) {
    return String(text || '').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
}

function formatTelegramHtml(rawText) {
    let text = String(rawText || '').replace(/\r\n/g, '\n').trim();

    text = escapeHtml(text);

    text = text.replace(/^&gt;\s*\*([^*]+)\*\s*(.*)$/gm, (_match, title, suffix) => {
        const cleanTitle = title.trim();
        const cleanSuffix = (suffix || '').trim();
        return cleanSuffix ? `<b>${cleanTitle}</b> ${cleanSuffix}` : `<b>${cleanTitle}</b>`;
    });

    text = text.replace(/```([\s\S]*?)```/g, (_match, codeBlock) => `<pre>${codeBlock.trim()}</pre>`);
    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    text = text.replace(/\*([^*\n]+)\*/g, '<b>$1</b>');

    text = text.replace(/(^|\n)-\s+/g, '$1');
    text = autoLink(text);

    return text;
}

function buildMainMenuKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 Cek Saldo', 'cmd:saldo')],
        [Markup.button.callback('📜 Riwayat', 'cmd:riwayat')],
        [Markup.button.callback('📊 Laporan Keuangan', 'cmd:laporan')],
        [Markup.button.callback('⚙️ Info', 'cmd:info'), Markup.button.callback('🏓 Ping', 'cmd:ping')]
    ]);
}

function buildHistoryKeyboard(page, hasPrev, hasNext) {
    const navButtons = [];

    if (hasPrev) {
        navButtons.push(Markup.button.callback('⬅️ Prev', `history:${page - 1}`));
    }

    if (hasNext) {
        navButtons.push(Markup.button.callback('Next ➡️', `history:${page + 1}`));
    }

    const rows = [];
    if (navButtons.length > 0) {
        rows.push(navButtons);
    }
    rows.push([Markup.button.callback('🔄 Refresh', `history:${page}`), Markup.button.callback('🏠 Menu', 'cmd:start')]);

    return Markup.inlineKeyboard(rows);
}

function buildDeleteConfirmKeyboard(transactionId) {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('✅ Ya, hapus', `delete_confirm:${transactionId}`),
            Markup.button.callback('❌ Batal', `delete_cancel:${transactionId}`)
        ]
    ]);
}

async function sendTelegramReply(ctx, payload, extra = {}) {
    if (payload && typeof payload === 'object' && payload.type === 'image') {
        const caption = formatTelegramHtml(payload.caption || '');
        await ctx.replyWithPhoto(payload.url, {
            caption,
            parse_mode: 'HTML',
            ...extra
        });
        return;
    }

    const text = formatTelegramHtml(typeof payload === 'string' ? payload : String(payload || ''));
    await ctx.reply(text, { parse_mode: 'HTML', ...extra });
}

async function sendHistoryPageMessage(ctx, userId, page = 1, useEdit = false) {
    const result = await getHistoryPage(userId, page, HISTORY_PAGE_SIZE);
    const html = formatTelegramHtml(result.text);
    const replyMarkup = buildHistoryKeyboard(result.page, result.hasPrev, result.hasNext).reply_markup;

    if (useEdit) {
        try {
            await ctx.editMessageText(html, { parse_mode: 'HTML', reply_markup: replyMarkup });
            return;
        } catch (error) {
            console.error('Error editing history message in Telegram:', error);
        }
    }

    await ctx.reply(html, { parse_mode: 'HTML', reply_markup: replyMarkup });
}

async function processMenuCommand(ctx, command, userId) {
    switch (command) {
        case '/start': {
            const welcomeHeader = '<b>SELAMAT DATANG DI YOGA BOT</b> 🤖';
            const welcomeBody = `Halo <b>${escapeHtml(ctx.from.first_name || 'Pengguna')}</b>! Saya asisten virtual pribadi.\n\nGunakan tombol di bawah untuk akses cepat fitur keuangan.`;
            await ctx.reply(`${welcomeHeader}\n\n${welcomeBody}`, {
                parse_mode: 'HTML',
                ...buildMainMenuKeyboard()
            });
            return;
        }
        case '/info': {
            const header = '<b>INFORMASI YOGA BOT</b> 🤖';
            const body = `Saya adalah asisten virtual pribadi milik <b>Ridwan Yoga Suryantara</b>.\n\n<b>FITUR KEUANGAN</b> 💰\n• /saldo : Cek saldo keuangan\n• /catat : Catat pengeluaran\n• /pemasukan : Catat pemasukan\n• /laporan_chart : Grafik laporan keuangan\n• /riwayat : Riwayat transaksi (paging 5 data)\n• /hapus : Hapus transaksi (dengan konfirmasi)\n• /edit : Edit transaksi\n\n<b>FITUR SISTEM</b> ⚙️\n• /ping : Cek status bot\n• /info : Menampilkan pesan ini\n• /start : Memulai bot\n\n<b>FITUR AI</b> 🧠\nKirim pesan biasa (tanpa awalan /) untuk ngobrol, tanya coding, atau diskusi teknologi.`;
            await ctx.reply(`${header}\n\n${body}`, {
                parse_mode: 'HTML',
                ...buildMainMenuKeyboard()
            });
            return;
        }
        case '/ping':
            await ctx.reply('Pong! 🏓');
            return;
        case '/saldo':
        case '/catat':
        case '/pemasukan':
        case '/laporan_chart':
        case '/edit': {
            const parts = ctx.message?.text?.trim()?.split(' ') || [command];
            const args = parts.slice(1);
            const replyPayload = await handleFinanceCommand(command, args, userId, 'telegram');
            await sendTelegramReply(ctx, replyPayload);
            return;
        }
        case '/riwayat':
            await sendHistoryPageMessage(ctx, userId, 1, false);
            return;
        default:
            return;
    }
}

function setupTelegramBot() {
    // Event listener for text messages
    bot.on('text', async (ctx) => {
        let text = ctx.message.text.trim();
        const userId = ctx.from.id.toString();
        
        // Bersihkan teks dari username bot jika ada
        // Format: /command@bot_username atau @bot_username pesan
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Yoga Bot';
        const botMentionRegex = new RegExp(`@${botUsername}\\b`, 'g');
        text = text.replace(botMentionRegex, '').trim();
        
        // Handle commands
        if (text.startsWith('/')) {
            const parts = text.split(' ');
            let command = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            switch (command) {
                case '/start':
                    await processMenuCommand(ctx, '/start', userId);
                    break;
                    
                case '/ping':
                    await processMenuCommand(ctx, '/ping', userId);
                    break;
                    
                case '/info':
                    await processMenuCommand(ctx, '/info', userId);
                    break;
                    
                case '/saldo':
                case '/catat':
                case '/pemasukan':
                case '/laporan_chart':
                case '/edit':
                    try {
                        const replyText = await handleFinanceCommand(command, args, userId, 'telegram');
                        await sendTelegramReply(ctx, replyText);
                    } catch (error) {
                        console.error('Error handling finance command in Telegram:', error);
                        const errorHeader = '<b>ERROR SISTEM</b> ❌';
                        const errorBody = `Terjadi kesalahan saat memproses perintah: ${escapeHtml(error.message)}`;
                        await ctx.reply(`${errorHeader}\n\n${errorBody}`, { parse_mode: 'HTML' });
                    }
                    break;

                case '/riwayat':
                    try {
                        const requestedPage = args.length > 0 ? parseInt(args[0], 10) : 1;
                        await sendHistoryPageMessage(ctx, userId, Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, false);
                    } catch (error) {
                        console.error('Error handling riwayat command in Telegram:', error);
                        await ctx.reply('<b>ERROR RIWAYAT</b> ❌\n\nGagal menampilkan riwayat transaksi.', { parse_mode: 'HTML' });
                    }
                    break;

                case '/hapus':
                    if (args.length < 1) {
                        await ctx.reply('Format: <code>/hapus &lt;id_transaksi&gt;</code>\nContoh: <code>/hapus 123e4567</code>\nGunakan /riwayat untuk melihat ID transaksi.', { parse_mode: 'HTML' });
                        break;
                    }

                    await ctx.reply(
                        `<b>KONFIRMASI HAPUS</b> ⚠️\n\nYakin ingin menghapus transaksi dengan ID <code>${escapeHtml(args[0])}</code>?`,
                        {
                            parse_mode: 'HTML',
                            ...buildDeleteConfirmKeyboard(args[0])
                        }
                    );
                    break;
                    
                default:
                    const defaultHeader = '<b>COMMAND TIDAK DIKENAL</b> ❌';
                    const defaultBody = `Perintah <code>${escapeHtml(command)}</code> tidak tersedia.\nGunakan /info untuk melihat daftar perintah yang tersedia.`;
                    await ctx.reply(`${defaultHeader}\n\n${defaultBody}`, { parse_mode: 'HTML' });
            }
        } else {
            // AI Path: Non-command messages
            if (text.length <= 2) {
                const shortHeader = '<b>PESAN TERLALU PENDEK</b> ❌';
                const shortBody = `Maaf, pesan terlalu pendek atau kurang jelas.\nKetik /info untuk melihat daftar kemampuan.`;
                await ctx.reply(`${shortHeader}\n\n${shortBody}`, { parse_mode: 'HTML' });
                return;
            }
            
            try {
                const geminiReply = await askGemini(text);
                await ctx.reply(formatTelegramHtml(geminiReply), { parse_mode: 'HTML' });
            } catch (error) {
                console.error('Error from Gemini AI in Telegram:', error);
                
                let errorHeader, errorBody;
                if (error.message.includes('Kuota Gemini AI telah habis')) {
                    errorHeader = '<b>KUOTA AI HABIS</b> ❌';
                    errorBody = 'Maaf, kuota AI saya sudah habis untuk hari ini.\nSilakan coba lagi besok atau hubungi admin untuk menambah kuota.';
                } else if (error.message.includes('Akses ditolak')) {
                    errorHeader = '<b>AKSES DITOLAK</b> ❌';
                    errorBody = 'Maaf, akses AI sedang bermasalah (autentikasi gagal).\nAdmin telah diberitahu.';
                } else if (error.message.includes('model tidak ditemukan')) {
                    errorHeader = '<b>MODEL TIDAK DITEMUKAN</b> ❌';
                    errorBody = 'Maaf, konfigurasi AI sedang diperbarui.\nCoba lagi nanti.';
                } else if (error.message.includes('API key')) {
                    errorHeader = '<b>API KEY TIDAK VALID</b> ❌';
                    errorBody = 'Maaf, konfigurasi AI belum lengkap.\nAdmin telah diberitahu.';
                } else {
                    errorHeader = '<b>ERROR AI</b> ❌';
                    errorBody = 'Maaf, otak AI sedang gangguan.\nCoba lagi nanti atau gunakan perintah sistem (/ping, /saldo).';
                }
                await ctx.reply(`${errorHeader}\n\n${errorBody}`, { parse_mode: 'HTML' });
            }
        }
    });

    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery?.data || '';
        const userId = ctx.from.id.toString();

        try {
            if (data.startsWith('cmd:')) {
                const key = data.split(':')[1];
                const commandMap = {
                    start: '/start',
                    info: '/info',
                    ping: '/ping',
                    saldo: '/saldo',
                    riwayat: '/riwayat',
                    laporan: '/laporan_chart'
                };

                const mapped = commandMap[key];
                if (mapped) {
                    await ctx.answerCbQuery();

                    if (mapped === '/riwayat') {
                        await sendHistoryPageMessage(ctx, userId, 1, false);
                        return;
                    }

                    if (mapped === '/laporan_chart') {
                        const result = await handleFinanceCommand('/laporan_chart', [], userId, 'telegram');
                        await sendTelegramReply(ctx, result);
                        return;
                    }

                    await processMenuCommand(ctx, mapped, userId);
                } else {
                    await ctx.answerCbQuery('Aksi tidak dikenal.');
                }

                return;
            }

            if (data.startsWith('history:')) {
                const page = parseInt(data.split(':')[1], 10);
                await ctx.answerCbQuery();
                await sendHistoryPageMessage(ctx, userId, Number.isInteger(page) && page > 0 ? page : 1, true);
                return;
            }

            if (data.startsWith('delete_confirm:')) {
                const transactionId = data.split(':')[1] || '';
                await ctx.answerCbQuery('Menghapus transaksi...');
                const result = await handleFinanceCommand('/hapus', [transactionId], userId, 'telegram');

                try {
                    await ctx.editMessageText(formatTelegramHtml(result), {
                        parse_mode: 'HTML'
                    });
                } catch (error) {
                    console.error('Error editing delete confirmation message:', error);
                    await sendTelegramReply(ctx, result);
                }
                return;
            }

            if (data.startsWith('delete_cancel:')) {
                await ctx.answerCbQuery('Dibatalkan.');
                await ctx.editMessageText('<b>HAPUS DIBATALKAN</b> ℹ️\n\nTransaksi tidak jadi dihapus.', {
                    parse_mode: 'HTML'
                });
                return;
            }

            await ctx.answerCbQuery('Aksi tidak tersedia.');
        } catch (error) {
            console.error('Error handling Telegram callback query:', error);
            try {
                await ctx.answerCbQuery('Terjadi kesalahan. Coba lagi.');
            } catch (_ignored) {
                // no-op
            }
        }
    });
    
    // Error handling
    bot.catch((err, ctx) => {
        console.error(`Telegram Bot Error for ${ctx.updateType}:`, err);
        ctx.reply('<b>ERROR SISTEM</b> ❌\n\nTerjadi kesalahan internal. Silakan coba lagi nanti.', { parse_mode: 'HTML' });
    });
}

module.exports = { setupTelegramBot };
