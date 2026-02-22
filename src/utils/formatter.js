// Utility for formatting data (dates, numbers, strings, etc.)

// Format currency in Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

// Generate box template for data (only the body part)
function generateBoxTemplate(lines) {
  // Ensure lines is an array of strings
  const formattedLines = lines.map(line => line.trim());
  // Join with newline and wrap in triple backticks
  return `\`\`\`\n${formattedLines.join('\n')}\n\`\`\``;
}

module.exports = {
  formatRupiah,
  generateBoxTemplate
};
