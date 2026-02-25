// Finance services (currency, stocks, etc.)
const supabase = require('../lib/supabaseClient');
const { formatRupiah, generateBoxTemplate } = require('../utils/formatter');

// Get transaction history
async function getHistory(userId, limit = 5) {
  try {
    // Query the finance table for the user, ordered by most recent
    const { data, error } = await supabase
      .from('finance')
      .select('id, amount, type, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying finance history:', error);
      const header = '> *ERROR RIWAYAT* 😢';
      const body = generateBoxTemplate([`Gagal mengambil riwayat: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    if (!data || data.length === 0) {
      const header = '> *RIWAYAT TRANSAKSI TERAKHIR* 📜';
      const body = generateBoxTemplate(['Belum ada transaksi tercatat.']);
      return `${header}\n\n${body}`;
    }

    // Format each transaction
    const transactions = data.map((record, index) => {
      const typeEmoji = record.type === 'IN' ? '💸' : '📝';
      const typeText = record.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
      const date = new Date(record.created_at).toLocaleDateString('id-ID');
      return `[${index + 1}] ${typeEmoji} ${typeText}
  ID    : \`${record.id}\`
  Jumlah: ${formatRupiah(record.amount)}
  Desk  : ${record.description}
  Tanggal: ${date}`;
    });

    const header = '> *RIWAYAT TRANSAKSI TERAKHIR* 📜';
    const body = `\`\`\`\n${transactions.join('\n\n')}\n\`\`\``;
    const footer = `\nMenampilkan ${data.length} transaksi terakhir. Gunakan \`/hapus <id>\` untuk menghapus atau \`/edit <id> <jumlah> <deskripsi>\` untuk mengedit.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in getHistory:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Delete a transaction
async function deleteTransaction(userId, transactionId) {
  try {
    // Validate transactionId format (basic UUID check)
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      const header = '> *ERROR FORMAT* ❌';
      const body = generateBoxTemplate(['ID transaksi tidak valid.']);
      return `${header}\n\n${body}`;
    }

    // Delete transaction where id matches and belongs to user
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', transactionId.trim())
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction:', error);
      const header = '> *ERROR HAPUS* 😓';
      const body = generateBoxTemplate([`Gagal menghapus transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    const header = '> *TRANSAKSI DIHAPUS* 🗑️';
    const body = generateBoxTemplate([
      `ID: \`${transactionId}\``,
      'Status: Berhasil dihapus'
    ]);
    const footer = `\nTransaksi telah dihapus dari catatan keuangan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in deleteTransaction:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Edit a transaction
async function editTransaction(userId, transactionId, newAmount, newDescription) {
  try {
    // Validate transactionId
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      const header = '> *ERROR FORMAT* ❌';
      const body = generateBoxTemplate(['ID transaksi tidak valid.']);
      return `${header}\n\n${body}`;
    }

    // Validate amount
    if (isNaN(newAmount) || newAmount <= 0) {
      const header = '> *ERROR INPUT* ❌';
      const body = generateBoxTemplate(['Jumlah baru harus angka positif.']);
      return `${header}\n\n${body}`;
    }

    // Update transaction where id matches and belongs to user
    const { data, error } = await supabase
      .from('finance')
      .update({
        amount: newAmount,
        description: newDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId.trim())
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error editing transaction:', error);
      const header = '> *ERROR EDIT* 😓';
      const body = generateBoxTemplate([`Gagal mengedit transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    if (!data || data.length === 0) {
      const header = '> *TRANSAKSI TIDAK DITEMUKAN* 🔍';
      const body = generateBoxTemplate(['Transaksi tidak ditemukan atau tidak dapat diakses.']);
      return `${header}\n\n${body}`;
    }

    const updated = data[0];
    const typeText = updated.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const emoji = updated.type === 'IN' ? '💸' : '📝';
    const header = `> *TRANSAKSI DIEDIT* ${emoji}`;
    const body = generateBoxTemplate([
      `ID      : \`${transactionId}\``,
      `Tipe    : ${typeText}`,
      `Jumlah  : ${formatRupiah(updated.amount)}`,
      `Desk    : ${updated.description}`
    ]);
    const footer = `\nTransaksi berhasil diperbarui. Gunakan \`/riwayat\` untuk melihat perubahan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in editTransaction:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
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

// Generate finance chart
async function getFinanceChart(userId) {
  try {
    // Query all finance data for the user
    const { data, error } = await supabase
      .from('finance')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying finance data for chart:', error);
      const header = '> *ERROR QUERY DATA* 😢';
      const body = generateBoxTemplate([`Gagal mengambil data laporan: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    // Calculate total IN and OUT
    let totalIn = 0;
    let totalOut = 0;
    data.forEach(record => {
      if (record.type === 'IN') {
        totalIn += record.amount;
      } else if (record.type === 'OUT') {
        totalOut += record.amount;
      }
    });

    // Prepare chart configuration
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Pemasukan', 'Pengeluaran'],
        datasets: [{
          data: [totalIn, totalOut],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderColor: ['#388E3C', '#D32F2F'],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Laporan Keuangan',
            font: {
              size: 16
            }
          }
        }
      }
    };

    // Generate chart URL
    const chartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartConfig));

    const header = '> *LAPORAN GRAFIK KEUANGAN* 📊';
    const body = generateBoxTemplate({
      'Pemasukan': formatRupiah(totalIn),
      'Pengeluaran': formatRupiah(totalOut)
    });
    const footer = '\nTetap hemat dan bijak mengatur keuangan ya!';
    const captionText = `${header}\n\n${body}${footer}`;

    return {
      type: 'image',
      url: chartUrl,
      caption: captionText
    };
  } catch (error) {
    console.error('Unexpected error in getFinanceChart:', error);
    const header = '> *ERROR SISTEM* 🚨';
    const body = generateBoxTemplate([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

module.exports = {
  checkSaldo,
  addTransaction,
  getFinanceChart,
  getHistory,
  deleteTransaction,
  editTransaction
};
