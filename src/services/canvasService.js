const { createCanvas } = require('canvas');

const CANVAS_SIZE = 512;
const CANVAS_PADDING = 40;
const MIN_FONT_SIZE = 28;
const MAX_FONT_SIZE = 96;

function normalizeText(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function splitLongWord(ctx, word, maxWidth) {
  const chars = Array.from(String(word || ''));
  const parts = [];
  let current = '';

  for (const ch of chars) {
    const candidate = current + ch;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      parts.push(current);
      current = ch;
      continue;
    }

    current = candidate;
  }

  if (current) {
    parts.push(current);
  }

  return parts.length > 0 ? parts : [''];
}

function wrapText(ctx, text, maxWidth) {
  const words = normalizeText(text).split(' ').filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = '';
    }

    if (ctx.measureText(word).width <= maxWidth) {
      currentLine = word;
      continue;
    }

    const chunks = splitLongWord(ctx, word, maxWidth);
    const lastChunk = chunks.pop();
    lines.push(...chunks);
    currentLine = lastChunk || '';
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

function fitWrappedText(ctx, text, fontFamily, weight = 'bold') {
  const maxWidth = CANVAS_SIZE - (CANVAS_PADDING * 2);
  const maxHeight = CANVAS_SIZE - (CANVAS_PADDING * 2);

  for (let fontSize = MAX_FONT_SIZE; fontSize >= MIN_FONT_SIZE; fontSize -= 2) {
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = Math.round(fontSize * 1.15);
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= maxHeight) {
      return { fontSize, lines, lineHeight };
    }
  }

  const fallbackSize = MIN_FONT_SIZE;
  ctx.font = `${weight} ${fallbackSize}px ${fontFamily}`;
  return {
    fontSize: fallbackSize,
    lines: wrapText(ctx, text, maxWidth),
    lineHeight: Math.round(fallbackSize * 1.15)
  };
}

function drawCenteredLines(ctx, lines, lineHeight) {
  const totalHeight = lines.length * lineHeight;
  let y = (CANVAS_SIZE / 2) - (totalHeight / 2) + (lineHeight / 2);

  for (const line of lines) {
    ctx.fillText(line, CANVAS_SIZE / 2, y);
    y += lineHeight;
  }
}

async function generateBratImage(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    throw new Error('Teks tidak boleh kosong untuk /brat.');
  }

  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const { fontSize, lines, lineHeight } = fitWrappedText(ctx, normalized, 'Arial, Helvetica, sans-serif', 'bold');

  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 2;

  drawCenteredLines(ctx, lines, lineHeight);

  return canvas.toBuffer('image/png');
}

async function generateTtsImage(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    throw new Error('Teks tidak boleh kosong untuk /tts.');
  }

  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#9cc9ff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const { fontSize, lines, lineHeight } = fitWrappedText(ctx, normalized, 'Arial, Helvetica, sans-serif', 'bold');

  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.1));
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#ffffff';

  const totalHeight = lines.length * lineHeight;
  let y = (CANVAS_SIZE / 2) - (totalHeight / 2) + (lineHeight / 2);

  for (const line of lines) {
    ctx.strokeText(line, CANVAS_SIZE / 2, y);
    ctx.fillText(line, CANVAS_SIZE / 2, y);
    y += lineHeight;
  }

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateBratImage,
  generateTtsImage
};
