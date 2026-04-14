const { checkWebsites, formatMonitorMessage } = require('../../services/monitorService');
const { getPlatformStats, formatStatsMessage } = require('../../services/statsService');
const { getUniqueUsers } = require('../../services/broadcastService');
const supabase = require('../../lib/supabaseClient');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

async function getCommandUsageStats() {
  const { count: totalExecution, error: totalError } = await supabase
    .from('command_logs')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw totalError;
  }

  const { data: userRows, error: userError } = await supabase
    .from('command_logs')
    .select('user_id');

  if (userError) {
    throw userError;
  }

  const { data: commandRows, error: commandError } = await supabase
    .from('command_logs')
    .select('command');

  if (commandError) {
    throw commandError;
  }

  const uniqueUsers = new Set(
    (userRows || [])
      .map((row) => String(row.user_id || '').trim())
      .filter(Boolean)
  ).size;

  const commandCounter = new Map();
  for (const row of commandRows || []) {
    const command = String(row.command || '').trim();
    if (!command) {
      continue;
    }
    commandCounter.set(command, (commandCounter.get(command) || 0) + 1);
  }

  const topCommands = Array.from(commandCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([command, count]) => ({ command, count }));

  return {
    totalExecution: Number(totalExecution || 0),
    uniqueUsers,
    topCommands
  };
}

async function handleAdminCommand(command, args, userId, platform, options = {}) {
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
          '- \`/stats\` : Statistik platform kreator',
          '- \`/cmd_usage\` : Statistik penggunaan bot',
          '- \`/broadcast\` : Kirim pesan ke semua pengguna'
        ].join('\n');
        const footer = ['—'.repeat(19), 'Gunakan command di atas untuk mengakses fitur admin.'].join('\n');
        return `${header}\n\n${body}\n\n${footer}`;
      }

      const header = '<b>MENU ADMIN</b> 🛡️';
      const body = [
        '<b>FITUR ADMIN</b> 🛡️',
        '• /admin : Tampilkan menu command admin',
        '• /monitor : Cek status website',
        '• /stats : Statistik platform kreator',
        '• /cmd_usage : Statistik penggunaan bot',
        '• /broadcast : Kirim pesan ke semua pengguna'
      ].join('\n');
      return `${header}\n\n${body}`;
    }

    case '/broadcast': {
      const broadcastMsg = args.join(' ').trim();
      if (!broadcastMsg) {
        return '❌ Harap masukkan pesan! Contoh: /broadcast Halo semua, bot sedang maintenance.';
      }

      const targets = await getUniqueUsers(platformName);
      if (!Array.isArray(targets) || targets.length === 0) {
        return '❌ Tidak ada pengguna yang ditemukan.';
      }

      const notifyAdmin = options.notifyAdmin;
      const sendToUser = options.sendToUser;

      if (typeof notifyAdmin !== 'function' || typeof sendToUser !== 'function') {
        return isWhatsApp
          ? '> *ERROR BROADCAST* ❌\n\nSender broadcast belum dikonfigurasi.'
          : '<b>ERROR BROADCAST</b> ❌\n\nSender broadcast belum dikonfigurasi.';
      }

      await notifyAdmin(`⏳ Memulai broadcast ke ${targets.length} pengguna... Mohon tunggu.`);

      let success = 0;
      let failed = 0;
      const payload = `[ 📢 BROADCAST ADMIN ]\n\n${broadcastMsg}`;

      for (const target of targets) {
        try {
          await sendToUser(target, payload);
          success += 1;
        } catch (_error) {
          failed += 1;
        }

        await delay(3000);
      }

      await notifyAdmin(`✅ Broadcast selesai!\nSukses: ${success}\nGagal: ${failed}`);
      return '';
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

    case '/cmd_usage': {
      try {
        const usageStats = await getCommandUsageStats();
        const topLines = usageStats.topCommands.length > 0
          ? usageStats.topCommands
            .map((item, index) => `${index + 1}. ${item.command} (${formatNumber(item.count)})`)
            .join('\n')
          : 'Belum ada data command.';

        if (isWhatsApp) {
          const header = '> 📊 LAPORAN PENGGUNAAN BOT';
          const body = [
            `Total Eksekusi: ${formatNumber(usageStats.totalExecution)}`,
            `Total Pengguna: ${formatNumber(usageStats.uniqueUsers)}`,
            '',
            'TOP 5 COMMANDS:',
            topLines
          ].join('\n');

          return `${header}\n\n${body}`;
        }

        const header = '<b>📊 LAPORAN PENGGUNAAN BOT</b>';
        const body = [
          `Total Eksekusi: ${formatNumber(usageStats.totalExecution)}`,
          `Total Pengguna: ${formatNumber(usageStats.uniqueUsers)}`,
          '',
          'TOP 5 COMMANDS:',
          topLines
        ].join('\n');

        return `${header}\n\n${body}`;
      } catch (error) {
        const errorHeader = isWhatsApp ? '> *ERROR CMD USAGE* ❌' : '<b>ERROR CMD USAGE</b> ❌';
        const errorBody = `Gagal mengambil data penggunaan command: ${error.message}`;
        return `${errorHeader}\n\n${errorBody}`;
      }
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