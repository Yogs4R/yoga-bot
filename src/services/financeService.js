// Finance services (currency, stocks, etc.)
const supabase = require('../lib/supabaseClient');
const { formatRupiah, generateBoxTemplate } = require('../utils/formatter');

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
      // Header + Body + Footer
      const header = '> *ERROR QUERY SALDO* 😢';
      const body = generateBoxTemplate([`Gagal mengambil data saldo: ${error.message}`]);
      return `${header}\n\n${body}`;
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

    // Format response according to Hybrid UI v3
    const header = '> *INFO SALDO DOMPET* 💰';
    const body = generateBoxTemplate([
      `Saldo  : ${formatRupiah(total)}`,
      `Status : ${total >= 0 ? 'Aman Bro!' : 'Hati-hati minus!'}`
    ]);
    const footer = `\nGunakan \`/catat <jumlah> <deskripsi>\` untuk mencatat pengeluaran atau \`/pemasukan <jumlah> <deskripsi>\` untuk mencatat pemasukan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in checkSaldo:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Add a transaction
async function addTransaction(userId, amount, type, description, platform) {
  try {
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const header = '> *ERROR INPUT* ❌';
      const body = generateBoxTemplate(['Jumlah harus angka positif.']);
      return `${header}\n\n${body}`;
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
      const header = '> *ERROR TRANSAKSI* 😓';
      const body = generateBoxTemplate([`Gagal mencatat transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    // Format success response according to Hybrid UI v3
    const typeText = type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const emoji = type === 'IN' ? '💸' : '📝';
    const header = `> *TRANSAKSI BERHASIL* ${emoji}`;
    const body = generateBoxTemplate([
      `Tipe    : ${typeText}`,
      `Jumlah  : ${formatRupiah(amount)}`,
      `Desk    : ${description}`,
      `Platform: ${platform}`
    ]);
    const footer = `\nTransaksi telah tercatat dengan baik. Gunakan \`/saldo\` untuk melihat saldo terkini.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in addTransaction:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

module.exports = {
  checkSaldo,
  addTransaction
};
