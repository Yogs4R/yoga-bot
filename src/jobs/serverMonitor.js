const cron = require('node-cron');
const { checkWebsites, formatMonitorMessage } = require('../services/monitorService');

const MONITOR_CRON_EXPRESSION = '0 6 * * *';
const URGENT_ALERT_HEADER = '> 🚨 URGENT: SERVER DOWN ALERT!';

function parseCommaSeparatedList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWhatsAppTarget(adminNumber) {
  const rawValue = String(adminNumber || '').trim();
  if (!rawValue) {
    return '';
  }

  if (rawValue.includes('@')) {
    return rawValue;
  }

  const digits = rawValue.replace(/[^\d]/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
}

function resolveWaSocket(waSocket) {
  return typeof waSocket === 'function' ? waSocket() : waSocket;
}

async function sendWhatsAppAlerts(waSocket, adminNumbers, message) {
  if (!waSocket || typeof waSocket.sendMessage !== 'function') {
    return;
  }

  for (const adminNumber of adminNumbers) {
    const target = normalizeWhatsAppTarget(adminNumber);

    if (!target) {
      continue;
    }

    try {
      await waSocket.sendMessage(target, { text: message });
    } catch (error) {
      console.error(`Gagal mengirim alert monitor ke WhatsApp admin ${adminNumber}:`, error.message || error);
    }
  }
}

async function sendTelegramAlerts(telegramBot, adminIds, message) {
  const telegramClient = telegramBot?.telegram;

  if (!telegramClient || typeof telegramClient.sendMessage !== 'function') {
    return;
  }

  for (const adminId of adminIds) {
    try {
      await telegramClient.sendMessage(adminId, message);
    } catch (error) {
      console.error(`Gagal mengirim alert monitor ke Telegram admin ${adminId}:`, error.message || error);
    }
  }
}

function startCronJobs(telegramBot, waSocket) {
  const task = cron.schedule(MONITOR_CRON_EXPRESSION, async () => {
    try {
      const { results, hasError } = await checkWebsites();

      if (!hasError) {
        return;
      }

      const alertMessage = formatMonitorMessage(results, URGENT_ALERT_HEADER, 'whatsapp');
      const adminWaNumbers = parseCommaSeparatedList(process.env.ADMIN_WA_NUMBERS);
      const adminTeleIds = parseCommaSeparatedList(process.env.ADMIN_TELE_IDS);
      const currentWaSocket = resolveWaSocket(waSocket);

      await Promise.all([
        sendWhatsAppAlerts(currentWaSocket, adminWaNumbers, alertMessage),
        sendTelegramAlerts(telegramBot, adminTeleIds, alertMessage)
      ]);
    } catch (error) {
      console.error('Error saat menjalankan cron monitor server:', error.message || error);
    }
  });

  console.log(`Cron monitor server aktif dengan jadwal ${MONITOR_CRON_EXPRESSION}`);
  return task;
}

module.exports = {
  startCronJobs
};
