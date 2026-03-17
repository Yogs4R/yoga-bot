// Image converter service (compression, resizing, format conversion, rotation)
const sharp = require('sharp');
const fs = require('fs/promises');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function processLocalImage(inputPath, outputPath, options = {}) {
    try {
        let transform = sharp(inputPath);
        const action = options.action || 'compress';
        const param = options.param || '';

        switch (action) {
            case 'compress': {
                const metadata = await transform.metadata();
                const format = (metadata.format || 'png').toLowerCase();

                if (format === 'jpeg' || format === 'jpg') {
                    transform = transform.jpeg({ quality: 60 });
                } else if (format === 'webp') {
                    transform = transform.webp({ quality: 60 });
                } else if (format === 'png') {
                    transform = transform.png({ compressionLevel: 9, palette: true });
                } else {
                    transform = transform.png({ compressionLevel: 9, palette: true });
                }
                break;
            }

            case 'resize': {
                const [wStr, hStr] = String(param || '').split('x');
                const w = parseInt(wStr, 10) || 500;
                const h = parseInt(hStr, 10) || 500;

                if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
                    throw new Error('Invalid resize dimensions');
                }

                transform = transform.resize(w, h, { fit: 'inside' });
                break;
            }

            case 'to': {
                const targetFormat = String(param || 'png').toLowerCase().trim();

                if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                    transform = transform.jpeg({ quality: 80 });
                } else if (targetFormat === 'png') {
                    transform = transform.png();
                } else if (targetFormat === 'webp') {
                    transform = transform.webp({ quality: 80 });
                } else {
                    throw new Error(`Unsupported format: ${targetFormat}`);
                }
                break;
            }

            case 'rotate': {
                const angle = parseInt(param || 90, 10) || 90;

                if (!Number.isFinite(angle)) {
                    throw new Error('Invalid rotation angle');
                }

                transform = transform.rotate(angle);
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        await transform.toFile(outputPath);
        return true;
    } catch (error) {
        console.error(`Image processing error (${options.action}):`, error);
        throw error;
    }
}

module.exports = {
    processLocalImage,
    MAX_FILE_SIZE
};
