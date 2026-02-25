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
const generateBoxTemplate = (inputData) => {
  const dataObject = Array.isArray(inputData)
    ? inputData.reduce((accumulator, value, index) => {
      accumulator[String(index + 1)] = value;
      return accumulator;
      }, {})
    : (inputData || {});

  const keys = Object.keys(dataObject);

  if (keys.length === 0) {
    return '```\n└ - : -\n```';
  }

  // Open triple backticks for code block
  let result = `\`\`\`\n`;

  // Find the maximum key length for padding
  const maxLength = Math.max(...keys.map(k => k.length));

  keys.forEach((key, index) => {
    const isFirst = index === 0;
    const isLast = index === keys.length - 1;

    // Determine the prefix based on position (first, middle, last)
    let prefix = '├';
    if (isFirst) prefix = '┌';
    if (isLast) prefix = '└';

    const paddedKey = key.padEnd(maxLength, ' ');
    result += `${prefix} ${paddedKey} : ${dataObject[key]}\n`;
  });

  // Close triple backticks
  result += `\`\`\``;
  return result;
};

module.exports = {
  formatRupiah,
  generateBoxTemplate
};
