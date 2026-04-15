const sharp = require('sharp');

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateBratImage(text) {
  const safeText = escapeXml(String(text || '').trim());
  if (!safeText) {
    throw new Error('Teks tidak boleh kosong untuk /brat.');
  }

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FFFFFF" />
  <text
    x="50%"
    y="50%"
    fill="#000000"
    font-family="Arial, Helvetica, sans-serif"
    font-size="46"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="middle"
  >${safeText}</text>
</svg>`;

  return await sharp(Buffer.from(svgString)).png().toBuffer();
}

async function generateTtsImage(text) {
  const safeText = escapeXml(String(text || '').trim());
  if (!safeText) {
    throw new Error('Teks tidak boleh kosong untuk /tts.');
  }

  const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2C3E50" />
  <text
    x="50%"
    y="50%"
    fill="#FFFFFF"
    font-family="Arial, Helvetica, sans-serif"
    font-size="46"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="middle"
  >${safeText}</text>
</svg>`;

  return await sharp(Buffer.from(svgString)).png().toBuffer();
}

module.exports = {
  generateBratImage,
  generateTtsImage
};
