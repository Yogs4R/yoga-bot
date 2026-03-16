const { checkWebsites, formatMonitorMessage } = require('../../services/monitorService');

async function handleAdminCommand(command, args, userId, platform) {
  void args;
  void userId;
  void platform;

  const cleanCommand = String(command || '').toLowerCase();

  switch (cleanCommand) {
    case '/admin': {
      const header = '*MENU ADMIN* 🛡️';
      const body = [
        'Daftar command admin:',
        '• /admin : Tampilkan menu admin',
        '• /monitor : Cek status website'
      ].join('\n');
      return `${header}\n\n${body}`;
    }

    case '/monitor': {
      const { results } = await checkWebsites();
      return formatMonitorMessage(results);
    }

    default: {
      const header = '*COMMAND ADMIN TIDAK DIKENAL* ❌';
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