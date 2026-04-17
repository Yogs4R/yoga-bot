const jimp = require('jimp');
const jimpFonts = require('jimp/fonts');

const Jimp = jimp.Jimp || jimp;
const H_ALIGN = jimp.HorizontalAlign || {};
const V_ALIGN = jimp.VerticalAlign || {};
const MIME_PNG = jimp.MIME_PNG || 'image/png';

function normalizeText(text, commandLabel) {
  const value = String(text || '').trim();
  if (!value) {
    throw new Error(`Teks tidak boleh kosong untuk ${commandLabel}.`);
  }

  return value;
}

async function createImage(width, height, colorHex) {
  try {
    return await new Jimp(width, height, colorHex);
  } catch (_error) {
    return await new Jimp({ width, height, background: colorHex });
  }
}

async function getPngBuffer(image) {
  if (typeof image.getBufferAsync === 'function') {
    return await image.getBufferAsync(MIME_PNG);
  }

  return await image.getBuffer(MIME_PNG);
}

async function generateBratImage(text) {
  const safeText = normalizeText(text, '/brat');
  const bratText = safeText.toLowerCase();
  const cleanText = bratText.replace(/[\u1000-\uFFFF]+/g, '').trim();
  const image = await createImage(512, 512, 0xFFFFFFFF);
  const font = await jimp.loadFont(Jimp.FONT_SANS_64_BLACK || jimpFonts.SANS_64_BLACK);

  image.print({
    font: font,
    x: 0,
    y: 0,
    text: {
      text: cleanText,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    },
    maxWidth: 512,
    maxHeight: 512
  });

  return await getPngBuffer(image);
}

module.exports = {
  generateBratImage
};
