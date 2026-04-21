// Finance services (currency, stocks, etc.)
const supabase = require('../lib/supabaseClient');
const { formatRupiah, formatBulletList } = require('../utils/formatter');

const SHORT_ID_LENGTH = 8;

function toShortTransactionId(transactionId) {
  return String(transactionId || '').slice(0, SHORT_ID_LENGTH);
}

async function resolveTransactionId(userId, transactionIdInput) {
  const rawId = String(transactionIdInput || '').trim().toLowerCase();

  if (!rawId) {
    return { errorMessage: 'ID transaksi tidak valid.' };
  }

  if (rawId.length === 36) {
    return { resolvedId: rawId, shortId: toShortTransactionId(rawId) };
  }

  const { data, error } = await supabase
    .from('finance')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error resolving transaction ID:', error);
    return { errorMessage: `Gagal memproses ID transaksi: ${error.message}` };
  }

  const matches = (data || []).filter((record) =>
    String(record.id || '').toLowerCase().startsWith(rawId)
  );

  if (matches.length === 0) {
    return { errorMessage: 'Transaksi tidak ditemukan. Gunakan ID dari /riwayat.' };
  }

  if (matches.length > 1) {
    const candidates = matches.slice(0, 3).map((record) => toShortTransactionId(record.id)).join(', ');
    return { errorMessage: `ID tidak unik. Coba gunakan ID lebih panjang. Kandidat: ${candidates}` };
  }

  const resolvedId = matches[0].id;
  return { resolvedId, shortId: toShortTransactionId(resolvedId) };
}

function formatHistoryText(records, page, pageSize, totalCount) {
  if (!records || records.length === 0) {
    const header = '> *RIWAYAT TRANSAKSI TERAKHIR* 📜';
    const body = formatBulletList(['Belum ada transaksi tercatat.']);
    return `${header}\n\n${body}`;
  }

  const startIndex = (page - 1) * pageSize;
  const transactions = records.map((record, index) => {
    const typeEmoji = record.type === 'IN' ? '💸' : '📝';
    const typeText = record.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const date = new Date(record.created_at).toLocaleDateString('id-ID');

    const itemHeader = `*${startIndex + index + 1}. ${typeEmoji} ${typeText}*`;
    const itemBody = formatBulletList({
      ID: `${toShortTransactionId(record.id)}`,
      Jumlah: formatRupiah(record.amount),
      Desk: record.description,
      Tanggal: date
    });

    return `${itemHeader}\n${itemBody}`;
  });

  const totalPages = Math.max(1, Math.ceil((totalCount || records.length) / pageSize));
  const header = '> *RIWAYAT TRANSAKSI* 📜';
  const body = `\n\n${transactions.join('\n\n')}\n\n`;
  const footer = `\nHalaman ${page}/${totalPages} • Menampilkan ${records.length} dari ${totalCount || records.length} transaksi. \nGunakan \`/hapus <id8>\` untuk menghapus atau \`/edit <id8> <jumlah> <deskripsi>\` untuk mengedit.`;

  return `${header}\n\n${body}${footer}`;
}

async function getHistoryPage(userId, page = 1, pageSize = 5) {
  try {
    const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 5;
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
      .from('finance')
      .select('id, amount, type, description, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error querying paginated finance history:', error);
      const header = '> *ERROR RIWAYAT* ❌';
      const body = formatBulletList([`Gagal mengambil riwayat: ${error.message}`]);
      return {
        text: `${header}\n\n${body}`,
        page: safePage,
        totalPages: 1,
        totalCount: 0,
        hasPrev: false,
        hasNext: false
      };
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const normalizedPage = Math.min(safePage, totalPages);

    if (normalizedPage !== safePage) {
      return await getHistoryPage(userId, normalizedPage, safePageSize);
    }

    const text = formatHistoryText(data || [], normalizedPage, safePageSize, totalCount);

    return {
      text,
      page: normalizedPage,
      totalPages,
      totalCount,
      hasPrev: normalizedPage > 1,
      hasNext: normalizedPage < totalPages
    };
  } catch (error) {
    console.error('Unexpected error in getHistoryPage:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return {
      text: `${header}\n\n${body}`,
      page: 1,
      totalPages: 1,
      totalCount: 0,
      hasPrev: false,
      hasNext: false
    };
  }
}

// Get transaction history
async function getHistory(userId, limit = 5) {
  try {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;
    const paged = await getHistoryPage(userId, 1, safeLimit);
    return paged.text;
  } catch (error) {
    console.error('Unexpected error in getHistory:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Delete a transaction
async function deleteTransaction(userId, transactionId) {
  try {
    // Validate and resolve transactionId (short/full)
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      const header = '> *ERROR FORMAT* ❌';
      const body = formatBulletList(['ID transaksi tidak valid.']);
      return `${header}\n\n${body}`;
    }

    const { resolvedId, shortId, errorMessage } = await resolveTransactionId(userId, transactionId);
    if (errorMessage) {
      const header = '> *TRANSAKSI TIDAK DITEMUKAN* 🔍';
      const body = formatBulletList([errorMessage]);
      return `${header}\n\n${body}`;
    }

    // Delete transaction where id matches and belongs to user
    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', resolvedId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction:', error);
      const header = '> *ERROR HAPUS* ❌';
      const body = formatBulletList([`Gagal menghapus transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    const header = '> *TRANSAKSI DIHAPUS* ✅';
    const body = formatBulletList([
      `ID: \`${shortId}\``,
      'Status: Berhasil dihapus'
    ]);
    const footer = `\nTransaksi telah dihapus dari catatan keuangan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in deleteTransaction:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Edit a transaction
async function editTransaction(userId, transactionId, newAmount, newDescription) {
  try {
    // Validate transactionId
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      const header = '> *ERROR FORMAT* ❌';
      const body = formatBulletList(['ID transaksi tidak valid.']);
      return `${header}\n\n${body}`;
    }

    // Validate amount
    if (isNaN(newAmount) || newAmount <= 0) {
      const header = '> *ERROR INPUT* ❌';
      const body = formatBulletList(['Jumlah baru harus angka positif.']);
      return `${header}\n\n${body}`;
    }

    const { resolvedId, shortId, errorMessage } = await resolveTransactionId(userId, transactionId);
    if (errorMessage) {
      const header = '> *TRANSAKSI TIDAK DITEMUKAN* 🔍';
      const body = formatBulletList([errorMessage]);
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
      .eq('id', resolvedId)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error editing transaction:', error);
      const header = '> *ERROR EDIT* ❌';
      const body = formatBulletList([`Gagal mengedit transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    if (!data || data.length === 0) {
      const header = '> *TRANSAKSI TIDAK DITEMUKAN* 🔍';
      const body = formatBulletList(['Transaksi tidak ditemukan atau tidak dapat diakses.']);
      return `${header}\n\n${body}`;
    }

    const updated = data[0];
    const typeText = updated.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const header = '> *TRANSAKSI DIEDIT* ✅';
    const body = formatBulletList([
      `ID: \`${shortId}\``,
      `Tipe: ${typeText}`,
      `Jumlah: ${formatRupiah(updated.amount)}`,
      `Deskripsi: ${updated.description}`
    ]);
    const footer = `\nTransaksi berhasil diperbarui. Gunakan \`/riwayat\` untuk melihat perubahan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in editTransaction:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
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
      const header = '> *ERROR QUERY SALDO* ❌';
      const body = formatBulletList([`Gagal mengambil data saldo: ${error.message}`]);
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
    const body = formatBulletList([
      `Saldo: ${formatRupiah(total)}`,
      `Status: ${total >= 0 ? 'Aman Bro!' : 'Hati-hati minus!'}`
    ]);
    const footer = `\nGunakan \`/catat <jumlah> <deskripsi>\` untuk mencatat pengeluaran atau \`/pemasukan <jumlah> <deskripsi>\` untuk mencatat pemasukan.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in checkSaldo:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

// Add a transaction
async function addTransaction(userId, amount, type, description, platform) {
  try {
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      const header = '> *ERROR INPUT* ❌';
      const body = formatBulletList(['Jumlah harus angka positif.']);
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
      const header = '> *ERROR TRANSAKSI* ❌';
      const body = formatBulletList([`Gagal mencatat transaksi: ${error.message}`]);
      return `${header}\n\n${body}`;
    }

    // Format success response according to Hybrid UI v3
    const typeText = type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN';
    const header = '> *TRANSAKSI BERHASIL* ✅';
    const body = formatBulletList([
      `Tipe: ${typeText}`,
      `Jumlah: ${formatRupiah(amount)}`,
      `Deskripsi: ${description}`,
      `Platform: ${platform}`
    ]);
    const footer = `\nTransaksi telah tercatat dengan baik. Gunakan \`/saldo\` untuk melihat saldo terkini.`;
    
    return `${header}\n\n${body}${footer}`;
  } catch (error) {
    console.error('Unexpected error in addTransaction:', error);
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
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
      const header = '> *ERROR QUERY DATA* ❌';
      const body = formatBulletList([`Gagal mengambil data laporan: ${error.message}`]);
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
    const body = formatBulletList({
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
    const header = '> *ERROR SISTEM* ❌';
    const body = formatBulletList([`Terjadi kesalahan tak terduga: ${error.message}`]);
    return `${header}\n\n${body}`;
  }
}

module.exports = {
  checkSaldo,
  addTransaction,
  getFinanceChart,
  getHistory,
  getHistoryPage,
  deleteTransaction,
  editTransaction
};
