const { Sticker, StickerTypes } = require('wa-sticker-formatter');

function isFfmpegMissingError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('ffmpeg') && (message.includes('not found') || message.includes('enoent') || message.includes('spawn'));
}

async function createSticker(buffer, type = 'image') {
  const normalizedType = String(type || 'image').toLowerCase() === 'video' ? 'video' : 'image';

  const sticker = new Sticker(buffer, {
    pack: 'Yoga Bot Pack',
    author: 'Fuenzer Studio',
    type: StickerTypes.FULL,
    quality: 50,
    animated: normalizedType === 'video'
  });

  return await sticker.toBuffer();
}

module.exports = {
  createSticker,
  isFfmpegMissingError
};
