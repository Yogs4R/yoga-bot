// Image converter command handler
const { processLocalImage } = require('../../services/converterService');

async function handleImgCommand(args, inputPath, outputPath, platform = 'telegram') {
    try {
        const action = String(args[0] || '').toLowerCase().trim();
        const param = String(args[1] || '').toLowerCase().trim();

        if (!action) {
            const header = platform === 'telegram'
                ? '<b>❌ ERROR CONVERTER</b>'
                : '> *❌ ERROR CONVERTER*';
            const body = 'Format: /img <action> [parameter]\n\nContoh:\n• /img compress\n• /img resize 500x500\n• /img to png\n• /img rotate 90';
            return `${header}\n\n${body}`;
        }

        const validActions = ['compress', 'resize', 'to', 'rotate'];
        if (!validActions.includes(action)) {
            const header = platform === 'telegram'
                ? '<b>❌ ACTION TIDAK DIKENAL</b>'
                : '> *❌ ACTION TIDAK DIKENAL*';
            const body = `Action "${action}" tidak tersedia.\n\nAction tersedia:\n• compress - Kompres gambar\n• resize - Ubah ukuran\n• to - Konversi format\n• rotate - Putar gambar`;
            return `${header}\n\n${body}`;
        }

        if (action === 'resize' && !param) {
            const header = platform === 'telegram'
                ? '<b>❌ PARAMETER DIPERLUKAN</b>'
                : '> *❌ PARAMETER DIPERLUKAN*';
            const body = 'Resize memerlukan parameter ukuran.\n\nContoh: /img resize 500x500';
            return `${header}\n\n${body}`;
        }

        if (action === 'to' && !param) {
            const header = platform === 'telegram'
                ? '<b>❌ PARAMETER DIPERLUKAN</b>'
                : '> *❌ PARAMETER DIPERLUKAN*';
            const body = 'Konversi memerlukan format tujuan.\n\nContoh: /img to png';
            return `${header}\n\n${body}`;
        }

        await processLocalImage(inputPath, outputPath, { action, param });

        const actionNames = {
            compress: 'Kompresi',
            resize: 'Resize',
            to: 'Konversi',
            rotate: 'Rotasi'
        };

        const actionName = actionNames[action] || action;
        const actionDesc = action === 'resize'
            ? `${actionName} (${param})`
            : action === 'to'
                ? `${actionName} ke ${param.toUpperCase()}`
                : action === 'rotate'
                    ? `${actionName} ${param}°`
                    : actionName;

        const header = platform === 'telegram'
            ? '<b>✅ BERHASIL</b>'
            : '> *✅ BERHASIL*';
        const body = `Gambar berhasil diproses!\n\n📝 Aksi: ${actionDesc}`;
        return `${header}\n\n${body}`;
    } catch (error) {
        console.error('Error in handleImgCommand:', error);

        const errorMsg = String(error?.message || 'Unknown error');
        const header = platform === 'telegram'
            ? '<b>❌ ERROR CONVERTER</b>'
            : '> *❌ ERROR CONVERTER*';
        const body = `Gagal memproses gambar.\n\nError: ${errorMsg}`;
        return `${header}\n\n${body}`;
    }
}

module.exports = {
    handleImgCommand
};
