// Utility for formatting data (dates, numbers, strings, etc.)

// Format currency in Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

// Build a clean bullet list for chat output
function formatBulletList(inputData) {
  const rows = Array.isArray(inputData)
    ? inputData
    : Object.entries(inputData || {}).map(([key, value]) => `${key}: ${value}`);

  const cleanRows = rows
    .map((row) => String(row || '').trim())
    .filter(Boolean);

  if (cleanRows.length === 0) {
    return '- -';
  }

  return cleanRows.map((row) => `- ${row}`).join('\n');
}

module.exports = {
  formatRupiah,
  formatBulletList
};
