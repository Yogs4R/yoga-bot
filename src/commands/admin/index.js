const { checkWebsites, formatMonitorMessage } = require('../../services/monitorService');
const { getPlatformStats, formatStatsMessage } = require('../../services/statsService');

async function handleAdminCommand(command, args, userId, platform) {
  void args;
  void userId;

  const cleanCommand = String(command || '').toLowerCase();
  const platformName = String(platform || '').toLowerCase().trim();
  const isWhatsApp = platformName === 'whatsapp';

  switch (cleanCommand) {
    case '/admin': {
      if (isWhatsApp) {
        const header = '> *MENU ADMIN* 🛡️';
        const body = [
          '📋 *FITUR ADMIN* 🛡️',
          '- \`/admin\` : Tampilkan menu command admin',
          '- \`/monitor\` : Cek status website',
          '- \`/stats\` : Statistik platform kreator'
        ].join('\n');
        const footer = ['—'.repeat(19), 'Gunakan command di atas untuk mengakses fitur admin.'].join('\n');
        return `${header}\n\n${body}\n\n${footer}`;
      }

      const header = '<b>MENU ADMIN</b> 🛡️';
      const body = [
        '<b>FITUR ADMIN</b> 🛡️',
        '• /admin : Tampilkan menu command admin',
        '• /monitor : Cek status website',
        '• /stats : Statistik platform kreator'
      ].join('\n');
      return `${header}\n\n${body}`;
    }

    case '/monitor': {
      const { results } = await checkWebsites();
      return formatMonitorMessage(results, null, platformName);
    }

    case '/stats': {
      const statsResult = await getPlatformStats();

      if (!statsResult.success) {
        const errorHeader = isWhatsApp ? '> *ERROR STATISTIK* ❌' : '<b>ERROR STATISTIK</b> ❌';
        const errorBody = `Gagal mengambil data statistik: ${statsResult.error}`;
        return `${errorHeader}\n\n${errorBody}`;
      }

      return formatStatsMessage(statsResult.data, platformName);
    }

    default: {
      if (isWhatsApp) {
        const header = '> *COMMAND ADMIN TIDAK DIKENAL* ❌';
        const body = [
          `Perintah admin "${cleanCommand}" tidak tersedia.`,
          'Gunakan \`/admin\` untuk melihat daftar command admin.'
        ].join('\n');
        return `${header}\n\n${body}`;
      }

      const header = '<b>COMMAND ADMIN TIDAK DIKENAL</b> ❌';
      const body = [
        `Perintah admin "${cleanCommand}" tidak tersedia.`,
        'Gunakan /admin untuk melihat daftar command admin.'
      ].join('\n');
      return `${header}\n\n${body}`;
    }
  }
}

module.exports = {
  handleAdminCommand
};