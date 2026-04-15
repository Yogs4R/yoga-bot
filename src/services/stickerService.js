const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const webpmux = require('node-webpmux');

function safeUnlinkSync(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_error) {
    // Ignore cleanup errors for temp files.
  }
}

function createExif(pack, author) {
  const metadata = {
    'sticker-pack-id': 'com.yogabot.sticker',
    'sticker-pack-name': String(pack || 'Yoga Bot'),
    'sticker-pack-publisher': String(author || 'Fuenzer Studio'),
    emojis: ['']
  };

  const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf-8');
  const exifBase = Buffer.from('49492A00080000000100415707000000000016000000', 'hex');
  exifBase.writeUInt32LE(jsonBuffer.length, 14);

  return Buffer.concat([exifBase, jsonBuffer]);
}

function isFfmpegMissingError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('ffmpeg') && (message.includes('not found') || message.includes('enoent') || message.includes('spawn'));
}

async function createSticker(buffer, type = 'image') {
  const isVideo = type === true || String(type || '').toLowerCase() === 'video';
  const tempDir = '/tmp';
  const randomId = crypto.randomBytes(6).toString('hex');
  const inputPath = path.join(tempDir, `in_${randomId}.tmp`);
  const outputPath = path.join(tempDir, `out_${randomId}.webp`);

  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(inputPath, buffer);

  try {
    await new Promise((resolve, reject) => {
      const outputOptions = [
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min(320,ih):force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse"
      ];

      if (isVideo) {
        outputOptions.push(
          '-loop', '0',
          '-ss', '00:00:00.0',
          '-t', '00:00:05.0',
          '-preset', 'default',
          '-an',
          '-vsync', '0'
        );
      }

      ffmpeg(inputPath)
        .outputOptions(outputOptions)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    const img = new webpmux.Image();
    await img.load(outputPath);
    img.exif = createExif('Yoga Bot', 'Fuenzer Studio');

    return await img.save(null);
  } finally {
    safeUnlinkSync(inputPath);
    safeUnlinkSync(outputPath);
  }
}

module.exports = {
  createSticker,
  createExif,
  isFfmpegMissingError
};
