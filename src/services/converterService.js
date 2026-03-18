// Image converter service (compression, resizing, format conversion, rotation)
const sharp = require('sharp');
const path = require('path');
const { PDFDocument, degrees } = require('pdf-lib');
const fs = require('fs/promises');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const axios = require('axios');
const FormData = require('form-data');
const fsSync = require('fs');
const CloudConvert = require('cloudconvert');
const { checkAndIncrementQuota } = require('./quotaService');

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

async function checkQuotaSafely(serviceName, limit, isDaily = false) {
    try {
        return await checkAndIncrementQuota(serviceName, limit, isDaily);
    } catch (error) {
        console.warn(`Quota service unavailable for ${serviceName}, proceeding without quota enforcement:`, error.message);
        return true;
    }
}

// Process local image with specified action (compress, resize, convert format, rotate)
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

/**
 * Remove background from image using remove.bg API
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save output PNG
 * @returns {Promise<boolean>} - true if successful
 */
async function removeBackground(inputPath, outputPath) {
    try {
        // Check quota
        const hasQuota = await checkQuotaSafely('removebg', 50);
        if (!hasQuota) {
            throw new Error('❌ Kuota Remove BG habis (50/50 bulan ini)');
        }

        // Create FormData
        const form = new FormData();
        form.append('size', 'auto');
        form.append('image_file', fsSync.createReadStream(inputPath));

        // Send request to remove.bg
        const response = await axios.post(
            'https://api.remove.bg/v1.0/removebg',
            form,
            {
                headers: {
                    'X-API-Key': process.env.REMOVEBG_API_KEY,
                    ...form.getHeaders()
                },
                responseType: 'stream'
            }
        );

        // Pipe response to output file
        return new Promise((resolve, reject) => {
            const writeStream = fsSync.createWriteStream(outputPath);
            response.data.pipe(writeStream);

            writeStream.on('finish', () => {
                resolve(true);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });

            response.data.on('error', (error) => {
                reject(error);
            });
        });
    } catch (error) {
        console.error('Remove background error:', error.message);
        throw error;
    }
}

/**
 * Convert HTML/URL to image using hcti.io API
 * @param {string} url - URL to convert to image
 * @param {string} outputPath - Path to save output image
 * @returns {Promise<boolean>} - true if successful
 */
async function htmlToImage(url, outputPath) {
    try {
        // Check quota
        const hasQuota = await checkQuotaSafely('html2img', 50);
        if (!hasQuota) {
            throw new Error('❌ Kuota Web2Img habis (50/50 bulan ini)');
        }

        // Request image generation from hcti.io
        const response = await axios.post(
            'https://hcti.io/v1/image',
            { url: url },
            {
                auth: {
                    username: process.env.HCTI_USER_ID,
                    password: process.env.HCTI_API_KEY
                }
            }
        );

        // Extract image URL from response
        const imageUrl = response.data?.image_url;
        if (!imageUrl) {
            throw new Error('Failed to generate image from URL');
        }

        // Download image and save to file
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writeStream = fsSync.createWriteStream(outputPath);
            imageResponse.data.pipe(writeStream);

            writeStream.on('finish', () => {
                resolve(true);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });

            imageResponse.data.on('error', (error) => {
                reject(error);
            });
        });
    } catch (error) {
        console.error('HTML to image error:', error.message);
        throw error;
    }
}

// Parse page indexes from string (e.g., "1-3,5") and return array of zero-based indexes
function parsePageIndexes(pageString, totalPages) {
    const text = String(pageString || '').trim();
    if (!text) {
        throw new Error('Format halaman tidak valid. Contoh: 1-3,5');
    }

    const selected = new Set();
    const parts = text.split(',');

    for (const rawPart of parts) {
        const part = String(rawPart || '').trim();
        if (!part) {
            continue;
        }

        if (part.includes('-')) {
            const [startRaw, endRaw] = part.split('-').map((item) => String(item || '').trim());
            const startNum = parseInt(startRaw, 10);
            const endNum = parseInt(endRaw, 10);

            if (!Number.isInteger(startNum) || !Number.isInteger(endNum)) {
                continue;
            }

            const from = Math.max(1, Math.min(startNum, endNum));
            const to = Math.min(totalPages, Math.max(startNum, endNum));

            for (let page = from; page <= to; page += 1) {
                selected.add(page - 1);
            }
            continue;
        }

        const pageNum = parseInt(part, 10);
        if (!Number.isInteger(pageNum)) {
            continue;
        }

        if (pageNum >= 1 && pageNum <= totalPages) {
            selected.add(pageNum - 1);
        }
    }

    const indexes = Array.from(selected).sort((a, b) => a - b);
    if (indexes.length === 0) {
        throw new Error('Tidak ada halaman valid untuk diekstrak.');
    }

    return indexes;
}

// Rotate PDF pages by specified angle
async function rotatePdf(inputPath, outputPath, angle) {
    const angleValue = parseInt(angle, 10);
    if (!Number.isInteger(angleValue)) {
        throw new Error('Sudut rotasi tidak valid. Contoh: 90');
    }

    const buffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
        const currentAngle = page.getRotation().angle || 0;
        page.setRotation(degrees(currentAngle + angleValue));
    }

    const outputBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, outputBytes);
    return true;
}

// Extract specified pages from PDF and save as new PDF
async function extractPdf(inputPath, outputPath, pageString) {
    const buffer = await fs.readFile(inputPath);
    const sourcePdf = await PDFDocument.load(buffer);
    const totalPages = sourcePdf.getPageCount();
    const pageIndexes = parsePageIndexes(pageString, totalPages);

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndexes);

    for (const page of copiedPages) {
        newPdf.addPage(page);
    }

    const outputBytes = await newPdf.save();
    await fs.writeFile(outputPath, outputBytes);
    return true;
}

// Merge multiple PDFs into a single output PDF
async function mergePdfs(inputPathsArray, outputPath) {
    if (!Array.isArray(inputPathsArray) || inputPathsArray.length === 0) {
        throw new Error('Daftar file PDF untuk merge tidak valid.');
    }

    const mergedPdf = await PDFDocument.create();

    for (const inputPath of inputPathsArray) {
        const pdf = await PDFDocument.load(await fs.readFile(inputPath));
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        for (const page of copiedPages) {
            mergedPdf.addPage(page);
        }
    }

    await fs.writeFile(outputPath, await mergedPdf.save());
    return true;
}

// Run a CloudConvert job with specified input, output, and task configuration
async function runCloudConvertJob(inputPath, outputPath, taskConfig) {
    const hasQuota = await checkQuotaSafely('cloudconvert', 10, true);
    if (!hasQuota) {
        throw new Error('❌ Kuota CloudConvert harian habis (10/10 hari ini).');
    }

    const processTaskConfig = {
        input: 'import-1',
        ...taskConfig
    };

    const job = await cloudConvert.jobs.create({
        tasks: {
            'import-1': {
                operation: 'import/upload'
            },
            'task-2': processTaskConfig,
            'export-1': {
                operation: 'export/url',
                input: 'task-2'
            }
        }
    });

    const importTask = job.tasks.find((task) => task.name === 'import-1');
    if (!importTask) {
        throw new Error('Gagal menyiapkan task upload CloudConvert.');
    }

    await cloudConvert.tasks.upload(
        importTask,
        fsSync.createReadStream(inputPath),
        path.basename(inputPath)
    );

    const completedJob = await cloudConvert.jobs.wait(job.id);
    const exportTask = completedJob.tasks.find((task) => task.name === 'export-1' && task.status === 'finished');
    const downloadUrl = exportTask?.result?.files?.[0]?.url;

    if (!downloadUrl) {
        throw new Error('Gagal mengambil URL hasil dari CloudConvert.');
    }

    const response = await axios.get(downloadUrl, { responseType: 'stream' });

    await new Promise((resolve, reject) => {
        const writer = fsSync.createWriteStream(outputPath);
        response.data.pipe(writer);

        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('error', reject);
    });

    return true;
}

// Convert file to PDF using CloudConvert
async function convertToPdf(inputPath, outputPath, inputFormat) {
    return runCloudConvertJob(inputPath, outputPath, {
        operation: 'convert',
        input_format: String(inputFormat || '').toLowerCase(),
        output_format: 'pdf'
    });
}

// Convert PDF to specified format using CloudConvert
async function convertFromPdf(inputPath, outputPath, outputFormat) {
    return runCloudConvertJob(inputPath, outputPath, {
        operation: 'convert',
        input_format: 'pdf',
        output_format: String(outputFormat || '').toLowerCase()
    });
}

// Compress PDF using CloudConvert optimization
async function compressPdf(inputPath, outputPath) {
    return runCloudConvertJob(inputPath, outputPath, {
        operation: 'optimize',
        input: 'import-1'
    });
}

module.exports = {
    processLocalImage,
    removeBackground,
    htmlToImage,
    rotatePdf,
    extractPdf,
    mergePdfs,
    runCloudConvertJob,
    convertToPdf,
    convertFromPdf,
    compressPdf,
    MAX_FILE_SIZE
};
