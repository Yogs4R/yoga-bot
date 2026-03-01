const os = require('os');
const { askGeminiDetailed } = require('../lib/geminiClient');
const handleFinanceCommand = require('../commands/finance/index');

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}h`);
  parts.push(`${hours}j`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

function getCpuUsagePercent() {
  const cpus = os.cpus() || [];
  if (cpus.length === 0) return 0;

  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    const times = cpu.times || {};
    idle += times.idle || 0;
    total += (times.user || 0) + (times.nice || 0) + (times.sys || 0) + (times.idle || 0) + (times.irq || 0);
  }

  if (total <= 0) return 0;
  return Math.round((1 - (idle / total)) * 100);
}

function getRamUsageText() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = Math.max(total - free, 0);
  const usedGb = (used / (1024 ** 3)).toFixed(1);
  const totalGb = (total / (1024 ** 3)).toFixed(1);
  return `${usedGb}/${totalGb} GB`;
}

function buildSystemStatsFooter() {
  return [
    '—'.repeat(19),
    `*CPU:* ${getCpuUsagePercent()}%`,
    `*RAM:* ${getRamUsageText()}`,
    `*UPTIME:* ${formatDuration(os.uptime())}`,
    `*STATUS:* ONLINE`
  ].join('\n');
}

function buildAiStatsFooter(aiMeta = {}) {
  const model = aiMeta.model || '-';
  const tokenIn = aiMeta.usage?.promptTokenCount ?? 0;
  const tokenOut = aiMeta.usage?.candidatesTokenCount ?? 0;
  const rpmLabel = aiMeta.rpm?.label || '-';

  return [
    '—'.repeat(19),
    `*Model:* ${model}`,
    `*Token In:* ${tokenIn} | *Token Out:* ${tokenOut}`,
    `*RPM:* ${rpmLabel}`
  ].join('\n');
}

function appendFooter(text, footer) {
  const base = String(text || '').trim();
  const foot = String(footer || '').trim();
  if (!base) return foot;
  if (!foot) return base;
  return `${base}\n\n${foot}`;
}

function formatWhatsAppReply(text) {
  const lines = String(text || '').split('\n');
  const isBoxLine = (line) => /^[┌├└]\s/.test(String(line || '').trim());

  const bodyBoxIndexes = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (isBoxLine(lines[i])) {
      bodyBoxIndexes.push(i);
    }
  }

  if (bodyBoxIndexes.length === 0) {
    return String(text || '');
  }

  const lastBodyBoxIndex = bodyBoxIndexes[bodyBoxIndexes.length - 1];
  const firstFooterLineIndex = lines.findIndex((line, index) => index > lastBodyBoxIndex && String(line || '').trim().length > 0);

  if (firstFooterLineIndex === -1) {
    return String(text || '');
  }

  const formatted = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (i === firstFooterLineIndex) {
      if (formatted.length > 0 && String(formatted[formatted.length - 1]).trim().length > 0) {
        formatted.push('');
      }
      formatted.push('—'.repeat(19));
    }

    formatted.push(line);
  }

  return formatted.join('\n');
}

class WhatsAppHandler {
  constructor(sock) {
    this.sock = sock;
    this.setup();
  }

  setup() {
    this.sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const isGroup = msg.key.remoteJid.endsWith('@g.us');
      const botId = this.sock.user?.id?.split(':')[0] || this.sock.user?.id;

      let isBotMentioned = false;
      let text = '';

      if (msg.message?.conversation) {
        text = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        text = msg.message.extendedTextMessage.text;
      }

      const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant === botId ||
        msg.message?.extendedTextMessage?.contextInfo?.stanzaId?.includes(botId);

      if (botId && mentionedJids.includes(botId)) {
        isBotMentioned = true;
      }

      if (isGroup && !isBotMentioned && !isReplyToBot) {
        return;
      }

      let cleanText = text.trim();
      if (isBotMentioned && botId) {
        const mentionRegex = new RegExp(`@${botId}\\s*`, 'g');
        cleanText = cleanText.replace(mentionRegex, '').trim();
      }

      let replyText = '';

      if (cleanText.startsWith('/')) {
        const parts = cleanText.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
          case '/ping':
            replyText = appendFooter('Pong! 🏓', buildSystemStatsFooter());
            break;

          case '/saldo':
          case '/catat':
          case '/pemasukan':
          case '/laporan_chart':
          case '/riwayat':
          case '/hapus':
          case '/edit': {
            const financeReply = await handleFinanceCommand(command, args, msg.key.remoteJid, 'whatsapp');
            if (financeReply) {
              if (typeof financeReply === 'object' && financeReply.type === 'image') {
                await this.sock.sendMessage(
                  msg.key.remoteJid,
                  {
                    image: { url: financeReply.url },
                    caption: formatWhatsAppReply(financeReply.caption || '')
                  },
                  { quoted: msg }
                );
              } else {
                await this.sock.sendMessage(
                  msg.key.remoteJid,
                  { text: formatWhatsAppReply(financeReply) },
                  { quoted: msg }
                );
              }
              return;
            }
            break;
          }

          case '/start': {
            const startHeader = '> *SELAMAT DATANG DI YOGA BOT* 🤖';
            const startBody = `Halo! Saya adalah asisten virtual pribadi.\n\nGunakan /info untuk melihat daftar perintah lengkap.\n\nBot ini dapat membantu Anda dengan:\n• Manajemen keuangan (/saldo, /catat, dll)\n• Percakapan AI (langsung ketik pesan)\n• Dan berbagai fitur lainnya!`;
            replyText = `${startHeader}\n\n${startBody}`;
            break;
          }

          case '/info': {
            const header = '> *INFORMASI YOGA BOT* 🤖';
            const body = `Saya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n📋 *FITUR KEUANGAN* 💰\n- \`/saldo\`         : Cek saldo keuangan\n- \`/catat\`         : Catat pengeluaran\n- \`/pemasukan\`     : Catat pemasukan\n- \`/laporan_chart\` : Grafik laporan keuangan\n- \`/riwayat\`       : Riwayat transaksi terakhir\n- \`/hapus\`         : Hapus transaksi\n- \`/edit\`          : Edit transaksi\n\n📋 *FITUR SISTEM* ⚙️\n- \`/ping\`          : Cek status bot\n- \`/info\`          : Menampilkan pesan ini\n- \`/start\`         : Memulai bot\n\n💡 *FITUR AI* 🧠\nKirimkan pesan biasa (tanpa awalan '/') untuk ngobrol,\nbertanya seputar coding, teknologi, atau sekadar bertukar pikiran!`;
            replyText = appendFooter(`${header}\n\n${body}`, buildSystemStatsFooter());
            break;
          }

          default: {
            const defaultHeader = '> *COMMAND TIDAK DIKENAL* 🤔';
            const defaultBody = `Perintah "${command}" tidak tersedia.\nCoba \`/ping\`, \`/saldo\`, \`/catat\`, \`/pemasukan\`, \`/laporan_chart\`, atau \`/info\`.`;
            replyText = `${defaultHeader}\n\n${defaultBody}`;
          }
        }
      } else {
        if (cleanText.length <= 2) {
          const shortHeader = '> *PESAN TERLALU PENDEK* 📏';
          const shortBody = 'Maaf, pesan terlalu pendek atau kurang jelas.\nKetik \`/info\` untuk melihat daftar kemampuanku ya!';
          replyText = `${shortHeader}\n\n${shortBody}`;
        } else {
          try {
            const aiResult = await askGeminiDetailed(cleanText);
            replyText = appendFooter(aiResult.text, buildAiStatsFooter(aiResult));
          } catch (error) {
            console.error('Error dari Gemini AI:', error);

            let errorHeader;
            let errorBody;
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

            replyText = appendFooter(
              `${errorHeader}\n\n${errorBody}`,
              buildAiStatsFooter({ model: '-', usage: { promptTokenCount: 0, candidatesTokenCount: 0 }, rpm: { label: '-' } })
            );
          }
        }
      }

      if (replyText) {
        await this.sock.sendMessage(msg.key.remoteJid, {
          text: formatWhatsAppReply(replyText)
        });
      }
    });
  }
}

module.exports = WhatsAppHandler;
