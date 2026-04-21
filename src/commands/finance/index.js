const { 
  checkSaldo, 
  addTransaction, 
  getFinanceChart,
  getHistory,
  deleteTransaction,
  editTransaction 
} = require('../../services/financeService');
const { formatBulletList } = require('../../utils/formatter');

async function handleFinanceCommand(command, args, userId, platform) {
  // Clean command to ensure it's in lowercase
  const cleanCommand = command.toLowerCase();
  
  switch (cleanCommand) {
    case '/saldo':
      return await checkSaldo(userId);
      
    case '/catat':
    case '/pemasukan':
      // Ensure there are enough arguments
      if (args.length < 2) {
        const header = '> *ERROR FORMAT* ❌';
        const body = formatBulletList([
          `Format: ${cleanCommand} <jumlah> <deskripsi>`,
          `Contoh: ${cleanCommand} 50000 Makan siang`
        ]);
        return `${header}\n\n${body}`;
      }
      
      // Clean the amount: remove non-numeric characters except digits
      const rawAmount = args[0];
      const cleanedAmount = rawAmount.replace(/[^\d]/g, '');
      const amount = parseInt(cleanedAmount);
      
      if (isNaN(amount) || amount <= 0) {
        const header = '> *ERROR INPUT* ❌';
        const body = formatBulletList([
          `Jumlah harus angka positif.`,
          `Diterima: ${rawAmount}`,
          `Contoh yang benar: ${cleanCommand} 50000 Makan siang`
        ]);
        return `${header}\n\n${body}`;
      }
      
      // The rest of the arguments form the description
      const description = args.slice(1).join(' ');
      
      // Determine transaction type based on command
      const type = cleanCommand === '/catat' ? 'OUT' : 'IN';
      
      return await addTransaction(userId, amount, type, description, platform);
      
    case '/laporan_chart':
      return await getFinanceChart(userId);
      
    case '/riwayat':
      // Optional limit parameter
      const limit = args.length > 0 ? parseInt(args[0]) : 5;
      return await getHistory(userId, isNaN(limit) ? 5 : limit);
      
    case '/hapus':
      if (args.length < 1) {
        const header = '> *ERROR FORMAT* ❌';
        const body = formatBulletList([
          'Format: /hapus <id_transaksi>',
          'Contoh: /hapus 123e4567',
          'Gunakan /riwayat untuk melihat ID transaksi'
        ]);
        return `${header}\n\n${body}`;
      }
      return await deleteTransaction(userId, args[0]);
      
    case '/edit':
      if (args.length < 3) {
        const header = '> *ERROR FORMAT* ❌';
        const body = formatBulletList([
          'Format: /edit <id> <jumlah_baru> <deskripsi_baru>',
          'Contoh: /edit 123e4567 75000 Makan malam',
          'Gunakan /riwayat untuk melihat ID transaksi'
        ]);
        return `${header}\n\n${body}`;
      }
      
      // Clean the new amount
      const newRawAmount = args[1];
      const newCleanedAmount = newRawAmount.replace(/[^\d]/g, '');
      const newAmount = parseInt(newCleanedAmount);
      
      if (isNaN(newAmount) || newAmount <= 0) {
        const header = '> *ERROR INPUT* ❌';
        const body = formatBulletList([
          `Jumlah baru harus angka positif.`,
          `Diterima: ${newRawAmount}`,
          `Contoh yang benar: /edit ${args[0]} 75000 Makan malam`
        ]);
        return `${header}\n\n${body}`;
      }
      
      // The rest of the arguments form the new description
      const newDescription = args.slice(2).join(' ');
      
      return await editTransaction(userId, args[0], newAmount, newDescription);
      
    default:
      const header = '> *COMMAND TIDAK DIKENAL* ❌';
      const body = formatBulletList([
        `Perintah keuangan "${command}" tidak tersedia.`,
        `Gunakan /saldo, /catat, /pemasukan, /laporan_chart, /riwayat, /hapus, atau /edit.`
      ]);
      return `${header}\n\n${body}`;
  }
}

module.exports = handleFinanceCommand;
