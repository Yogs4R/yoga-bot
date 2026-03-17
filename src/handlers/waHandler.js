const os = require('os');
const fs = require('fs/promises');
const path = require('path');
const { askAiDetailed } = require('../lib/aiClient');
const handleFinanceCommand = require('../commands/finance/index');
const { handleAdminCommand } = require('../commands/admin/index');
const { isAdmin } = require('../utils/auth');
const { checkWebsites, formatMonitorMessage } = require('../services/monitorService');
const { handleImgCommand } = require('../commands/converter/index');
const { MAX_FILE_SIZE } = require('../services/converterService');

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

function normalizeWhatsAppId(value) {
  return String(value || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/[^\d]/g, '');
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMessageContextInfo(msg) {
  return msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.buttonsResponseMessage?.contextInfo
    || msg.message?.templateButtonReplyMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo
    || msg.message?.videoMessage?.contextInfo
    || msg.message?.documentMessage?.contextInfo
    || null;
}

function cleanMentionFromGroupText(text, mentionIds = []) {
  let cleanText = String(text || '').trim();
  const normalizedMentionIds = mentionIds
    .map((mentionId) => normalizeWhatsAppId(mentionId))
    .filter(Boolean);

  for (const mentionId of normalizedMentionIds) {
    const mentionRegex = new RegExp(`@${escapeRegex(mentionId)}\\b`, 'gi');
    cleanText = cleanText.replace(mentionRegex, ' ');
  }

  // Tangani pola "@LID /command" agar command tetap terbaca.
  cleanText = cleanText.replace(/^(@\S+\s+)+(?=\/)/, '');

  return cleanText.replace(/\s{2,}/g, ' ').trim();
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
      const botJid = this.sock.user?.id || '';
      const botNumber = normalizeWhatsAppId(botJid);
      let text = '';

      if (msg.message?.conversation) {
        text = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        text = msg.message.extendedTextMessage.text;
      } else if (msg.message?.buttonsResponseMessage?.selectedButtonId) {
        text = msg.message.buttonsResponseMessage.selectedButtonId;
      } else if (msg.message?.templateButtonReplyMessage?.selectedId) {
        text = msg.message.templateButtonReplyMessage.selectedId;
      }

      const contextInfo = getMessageContextInfo(msg);
      const mentionedJids = contextInfo?.mentionedJid || [];
      const botLid = normalizeWhatsAppId(process.env.BOT_WA_LID);
      const isBotMentioned = mentionedJids.some((jid) => {
        // Hapus @s.whatsapp.net atau @lid beserta suffix device (:x)
        const normalizedJid = normalizeWhatsAppId(jid);
        return normalizedJid === botNumber || normalizedJid === botLid;
      });
      const isReplyToBot = normalizeWhatsAppId(contextInfo?.participant) === botNumber;
      
      // Di dalam grup, bot WAJIB di-tag (mention biru) atau pesannya di-reply.
      // Jika tidak memenuhi syarat tersebut, abaikan seluruh pesan.
      if (isGroup && !isBotMentioned && !isReplyToBot) {
        return;
      }

      let cleanText = text.trim();
      if (isGroup && isBotMentioned) {
        cleanText = cleanMentionFromGroupText(cleanText, [botNumber, botLid, ...mentionedJids]);
      }

      if (isGroup && !cleanText) {
        return;
      }

      const userId = isGroup
        ? (msg.key.participant || msg.participant || msg.key.remoteJid)
        : msg.key.remoteJid;

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
          
          case '/cuaca': {
            const { handleWeatherCommand } = require('../services/weatherService');
            const weatherReply = await handleWeatherCommand(command, args, msg.key.remoteJid, 'whatsapp');
            replyText = weatherReply;
            break;
          }
          
          case '/sholat': {
            const { handleReligionCommand } = require('../services/religionService');
            const sholatReply = await handleReligionCommand(command, args, msg.key.remoteJid, 'whatsapp');
            replyText = sholatReply;
            break;
          }

          case '/admin': {
            if (!isAdmin(userId, 'whatsapp')) {
              replyText = '> *AKSES DITOLAK* ❌\n\nCommand ini khusus admin.';
              break;
            }

            const adminReply = await handleAdminCommand('/admin', args, userId, 'whatsapp');
            replyText = adminReply;

            break;
          }

          case '/monitor': {
            if (!isAdmin(userId, 'whatsapp')) {
              replyText = '> *AKSES DITOLAK* ❌\n\nCommand ini khusus admin.';
              break;
            }

            const { results } = await checkWebsites();
            const monitorReply = formatMonitorMessage(results, null, 'whatsapp');
            replyText = monitorReply;
            break;
          }
          
          case '/me': {
            const { handleAboutMeCommand } = require('../services/aboutService');
            const aboutReply = await handleAboutMeCommand(command, args, msg.key.remoteJid, 'whatsapp');
            replyText = aboutReply;
            break;
          }

          case '/stats': {
            if (!isAdmin(userId, 'whatsapp')) {
              replyText = '> *AKSES DITOLAK* ❌\n\nCommand ini khusus admin.';
              break;
            }

            const statsReply = await handleAdminCommand('/stats', args, userId, 'whatsapp');
            replyText = statsReply;
            break;
          }

          case '/img': {
            let inputPath = null;
            let outputPath = null;

            try {
              const imageMsg = msg.message?.imageMessage;
              if (!imageMsg) {
                replyText = '> *❌ ERROR CONVERTER*\n\nBalas pesan dengan gambar untuk menggunakan converter.';
                break;
              }

              const fileSizeBytes = imageMsg.fileLength || 0;
              if (fileSizeBytes > MAX_FILE_SIZE) {
                replyText = '> *❌ Gagal*\n\nUkuran gambar maksimal 5MB!';
                break;
              }

              const timestamp = Date.now();
              const tempDir = path.join(process.cwd(), 'temp');
              inputPath = path.join(tempDir, `input_${timestamp}.jpg`);
              outputPath = path.join(tempDir, `output_${timestamp}.jpg`);

              const mediaBuffer = await this.sock.downloadMediaMessage(msg.message?.imageMessage || msg.message?.videoMessage);
              await fs.writeFile(inputPath, mediaBuffer);

              const action = String(args[0] || '').toLowerCase().trim();
              if (action === 'to' && args[1]) {
                const format = String(args[1]).toLowerCase();
                const formatMap = { 'jpg': '.jpg', 'jpeg': '.jpg', 'png': '.png', 'webp': '.webp' };
                const newExt = formatMap[format] || '.jpg';
                outputPath = path.join(tempDir, `output_${timestamp}${newExt}`);
              }

              const resultMsg = await handleImgCommand(args, inputPath, outputPath, 'whatsapp');
              replyText = resultMsg;

              const outputExists = await fs.stat(outputPath).catch(() => null);
              if (outputExists && replyText.includes('BERHASIL')) {
                const fileBuffer = await fs.readFile(outputPath);
                const mediaType = outputPath.endsWith('.png') ? 'image/png' : outputPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
                await this.sock.sendMessage(msg.key.remoteJid, {
                  image: fileBuffer,
                  mimetype: mediaType,
                  caption: '✅ Gambar siap!'
                });
              }
            } catch (error) {
              console.error('Error in /img handler for WhatsApp:', error);
              replyText = `> *❌ ERROR CONVERTER*\n\nGagal memproses gambar: ${error.message}`;
            } finally {
              if (inputPath) await fs.unlink(inputPath).catch(() => {});
              if (outputPath) await fs.unlink(outputPath).catch(() => {});
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
            const body = `Saya adalah asisten virtual pribadi milik Ridwan Yoga Suryantara.\n\n📋 *FITUR KEUANGAN* 💰\n- \`/saldo\`         : Cek saldo keuangan\n- \`/catat\`         : Catat pengeluaran\n- \`/pemasukan\`     : Catat pemasukan\n- \`/laporan_chart\` : Grafik laporan keuangan\n- \`/riwayat\`       : Riwayat transaksi terakhir\n- \`/hapus\`         : Hapus transaksi\n- \`/edit\`          : Edit transaksi\n\n📋 *FITUR SISTEM* ⚙️\n- \`/ping\`          : Cek status bot\n- \`/info\`          : Menampilkan pesan ini\n- \`/start\`         : Memulai bot\n\n💡 *FITUR AI* 🧠\nKirimkan pesan biasa (tanpa awalan '/') untuk ngobrol,\nbertanya seputar coding, teknologi, atau sekadar bertukar pikiran!\n\n🛠️ *FITUR UTILITAS*\n- \`/cuaca\`         : Info cuaca hari ini\n- \`/sholat\`        : Jadwal sholat hari ini\n- \`/me\`            : Tentang pembuat bot\n\n�️ *FITUR CONVERTER*\n- \`/img compress\`    : Kompres ukuran gambar\n- \`/img resize WxH\`  : Ubah ukuran (contoh: 500x500)\n- \`/img to format\`   : Konversi format (jpg, png, webp)\n- \`/img rotate deg\`  : Putar gambar (90, 180, 270°)\n_(Balas pesan dengan foto lalu ketik command. Max 5MB)_\n\n�🛡️ *FITUR ADMIN*\n- \`/admin\`         : Menu command admin`;
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
            const aiResult = await askAiDetailed(cleanText);
            replyText = appendFooter(aiResult.text, buildAiStatsFooter(aiResult));
          } catch (error) {
            console.error('Error dari OpenRouter AI:', error);

            let errorHeader;
            let errorBody;
            const message = String(error?.message || '');
            if (message.includes('429 Rate Limit')) {
              errorHeader = '> *RATE LIMIT AI* ⏳';
              errorBody = 'Maaf, request AI sedang padat (429 Rate Limit).\nSilakan coba lagi beberapa saat.';
            } else if (message.includes('401 Unauthorized') || message.includes('403 Forbidden')) {
              errorHeader = '> *AKSES AI DITOLAK* 🔒';
              errorBody = 'Maaf, akses AI ditolak (401/403).\nAdmin perlu memeriksa API key OpenRouter.';
            } else if (message.includes('tidak ditemukan di OpenRouter')) {
              errorHeader = '> *MODEL AI TIDAK DITEMUKAN* 🔍';
              errorBody = 'Maaf, model AI yang dipakai sedang tidak tersedia.\nCoba lagi nanti.';
            } else if (message.includes('API key OpenRouter')) {
              errorHeader = '> *API KEY AI TIDAK VALID* 🔑';
              errorBody = 'Maaf, konfigurasi OpenRouter belum lengkap atau tidak valid.\nAdmin telah diberitahu.';
            } else if (message.includes('Server OpenRouter sedang gangguan')) {
              errorHeader = '> *SERVER AI GANGGUAN* 🛠️';
              errorBody = 'Maaf, server AI sedang gangguan.\nSilakan coba lagi nanti.';
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
