const { checkWebsites, formatMonitorMessage } = require('../../services/monitorService');
const { generateBoxTemplate } = require('../../utils/formatter');

async function handleAdminCommand(command, args, userId, platform) {
  void args;
  void userId;
  void platform;

  const cleanCommand = String(command || '').toLowerCase();

  switch (cleanCommand) {
    case '/admin': {
      const header = '> *MENU ADMIN* 🛡️';
      const body = generateBoxTemplate([
        '/admin - Daftar command admin',
        '/monitor - Cek status web'
      ]);
      return `${header}\n\n${body}`;
    }

    case '/monitor': {
      const { results } = await checkWebsites();
      return formatMonitorMessage(results);
    }

    default: {
      const header = '> *COMMAND ADMIN TIDAK DIKENAL* ❌';
      const body = generateBoxTemplate([
        `Perintah admin "${cleanCommand}" tidak tersedia.`,
        'Gunakan /admin untuk melihat daftar command admin.'
      ]);
      return `${header}\n\n${body}`;
    }
  }
}

module.exports = {
  handleAdminCommand
};