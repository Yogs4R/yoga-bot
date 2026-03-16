function parseCommaSeparatedList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWhatsAppUserId(userId) {
  return String(userId || '')
    .split('@')[0]
    .split(':')[0]
    .replace(/[^\d]/g, '');
}

function normalizeTelegramUserId(userId) {
  return String(userId || '').trim();
}

function isAdmin(userId, platform) {
  const platformName = String(platform || '').toLowerCase();

  if (platformName === 'whatsapp') {
    const adminNumbers = parseCommaSeparatedList(process.env.ADMIN_WA_NUMBERS)
      .map((adminNumber) => adminNumber.replace(/[^\d]/g, ''));
    const normalizedUserId = normalizeWhatsAppUserId(userId);
    return adminNumbers.includes(normalizedUserId);
  }

  if (platformName === 'telegram') {
    const adminIds = parseCommaSeparatedList(process.env.ADMIN_TELE_IDS);
    const normalizedUserId = normalizeTelegramUserId(userId);
    return adminIds.includes(normalizedUserId);
  }

  return false;
}

module.exports = {
  isAdmin
};