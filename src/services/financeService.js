// Finance services (currency, stocks, etc.)
const supabase = require('../lib/supabaseClient');

// Helper function to format currency in Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

// Check balance for a user
async function checkSaldo(userId) {
  try {
    // Query the finance table for the user
    const { data, error } = await supabase
      .from('finance')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying finance data:', error);
      return `> *ERROR QUERY SALDO* 😢\n\n\`\`\`\nGagal mengambil data saldo: ${error.message}\n\`\`\``;
    }

    // Calculate total balance
    let total = 0;
    data.forEach(record => {
      if (record.type === 'IN') {
        total += record.amount;
      } else if (record.type === 'OUT') {
        total -= record.amount;
      }
    });

    // Format response according to updated UI guidelines
    const response = `> *INFO SALDO DOMPET* 💰\n\n\`\`\`\nSaldo : ${formatRupiah(total)}\nStatus: ${total >= 0 ? 'Aman Bro!' : 'Hati-hati minus!'}\n\`\`\`\n\nGunakan \`/catat <jumlah> <deskripsi>\` untuk mencatat pengeluaran atau \`/pemasukan <jumlah> <deskripsi>\` untuk mencatat pemasukan.`;
    
    return response;
  } catch (error) {
    console.error('Unexpected error in checkSaldo:', error);
    return `> *ERROR SISTEM* 🚨\n\n\`\`\`\nTerjadi kesalahan tak terduga: ${error.message}\n\`\`\``;
  }
}

// Add a transaction
async function addTransaction(userId, amount, type, description, platform) {
  try {
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return `> *ERROR INPUT* ❌\n\n\`\`\`\nJumlah harus angka positif.\n\`\`\``;
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('finance')
      .insert({
        user_id: userId,
        amount: amount,
        type: type,
        description: description,
        platform: platform,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting transaction:', error);
      return `> *ERROR TRANSAKSI* 😓\n\n\`\`\`\nGagal mencatat transaksi: ${error.message}\n\`\`\``;
    }

    // Format success response according to updated UI guidelines
    const typeText = type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const emoji = type === 'IN' ? '💸' : '📝';
    const response = `> *TRANSAKSI BERHASIL* ${emoji}\n\n\`\`\`\nTipe   : ${typeText}\nJumlah : ${formatRupiah(amount)}\nDesk   : ${description}\nPlatform: ${platform}\n\`\`\`\n\nTransaksi telah tercatat dengan baik. Gunakan \`/saldo\` untuk melihat saldo terkini.`;
    
    return response;
  } catch (error) {
    console.error('Unexpected error in addTransaction:', error);
    return `> *ERROR SISTEM* 🚨\n\n\`\`\`\nTerjadi kesalahan tak terduga: ${error.message}\n\`\`\``;
  }
}

module.exports = {
  checkSaldo,
  addTransaction,
  formatRupiah
};
