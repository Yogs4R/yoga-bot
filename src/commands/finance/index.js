const { checkSaldo, addTransaction, getFinanceChart } = require('../../services/financeService');
const { generateBoxTemplate } = require('../../utils/formatter');

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
        const header = '> *ERROR FORMAT* 📝';
        const body = generateBoxTemplate([
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
        const body = generateBoxTemplate([
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
      
    case '/laporan-chart':
      return await getFinanceChart(userId);
      
    default:
      const header = '> *COMMAND TIDAK DIKENAL* 🤔';
      const body = generateBoxTemplate([
        `Perintah keuangan "${command}" tidak tersedia.`,
        `Gunakan /saldo, /catat, /pemasukan, atau /laporan-chart.`
      ]);
      return `${header}\n\n${body}`;
  }
}

module.exports = handleFinanceCommand;
