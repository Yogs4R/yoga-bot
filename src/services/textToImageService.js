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

async function renderCenteredText({ text, backgroundColor, fontPath }) {
  const image = await createImage(512, 512, backgroundColor);
  const font = await jimp.loadFont(fontPath);

  if (typeof image.print === 'function') {
    image.print({
      font,
      x: 0,
      y: 0,
      text,
      maxWidth: 512,
      maxHeight: 512,
      alignmentX: H_ALIGN.CENTER,
      alignmentY: V_ALIGN.MIDDLE
    });
  }

  return await getPngBuffer(image);
}

async function generateBratImage(text) {
  const safeText = normalizeText(text, '/brat');
  return await renderCenteredText({
    text: safeText,
    backgroundColor: '#FFFFFF',
    fontPath: jimpFonts.SANS_64_BLACK
  });
}

async function generateTtsImage(text) {
  const safeText = normalizeText(text, '/tts');
  return await renderCenteredText({
    text: safeText,
    backgroundColor: '#000000',
    fontPath: jimpFonts.SANS_64_WHITE
  });
}

module.exports = {
  generateBratImage,
  generateTtsImage
};
