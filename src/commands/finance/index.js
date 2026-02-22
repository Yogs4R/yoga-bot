const { checkSaldo, addTransaction } = require('../../services/financeService');

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
        return `> *ERROR FORMAT* 📝\n\nFormat: ${cleanCommand} <jumlah> <deskripsi>\nContoh: ${cleanCommand} 50000 Makan siang`;
      }
      
      // Clean the amount: remove non-numeric characters except digits
      const rawAmount = args[0];
      const cleanedAmount = rawAmount.replace(/[^\d]/g, '');
      const amount = parseInt(cleanedAmount);
      
      if (isNaN(amount) || amount <= 0) {
        return `> *ERROR INPUT* ❌\n\nJumlah harus angka positif.\nDiterima: ${rawAmount}\nContoh yang benar: ${cleanCommand} 50000 Makan siang`;
      }
      
      // The rest of the arguments form the description
      const description = args.slice(1).join(' ');
      
      // Determine transaction type based on command
      const type = cleanCommand === '/catat' ? 'OUT' : 'IN';
      
      return await addTransaction(userId, amount, type, description, platform);
      
    default:
      return `> *COMMAND TIDAK DIKENAL* 🤔\n\nPerintah keuangan "${command}" tidak tersedia.\nGunakan /saldo, /catat, atau /pemasukan.`;
  }
}

module.exports = handleFinanceCommand;
