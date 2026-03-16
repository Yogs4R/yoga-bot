// Platform statistics service
const supabase = require('../lib/supabaseClient');

async function getPlatformStats() {
    try {
        const { data, error } = await supabase
            .from('platform_stats')
            .select('platform, stats, updated_at')
            .order('platform', { ascending: true });

        if (error) {
            console.error('Error fetching platform stats from Supabase:', error);
            return {
                success: false,
                error: error.message
            };
        }

        if (!Array.isArray(data) || data.length === 0) {
            return {
                success: false,
                error: 'No platform statistics found'
            };
        }

        return {
            success: true,
            data
        };
    } catch (err) {
        console.error('Unexpected error in getPlatformStats:', err);
        return {
            success: false,
            error: err.message || 'Failed to fetch platform statistics'
        };
    }
}

function capitalizeWord(word) {
    return String(word || '').charAt(0).toUpperCase() + String(word).slice(1).toLowerCase();
}

function formatStatsKey(key) {
    return String(key || '')
        .split('_')
        .map(capitalizeWord)
        .join(' ');
}

function formatStatsMessage(statsData = [], platform = 'telegram') {
    const isWhatsApp = String(platform || '').toLowerCase() === 'whatsapp';

    if (!Array.isArray(statsData) || statsData.length === 0) {
        const emptyHeader = isWhatsApp ? '> *STATISTIK PLATFORM BELUM TERSEDIA* ⚠️' : '<b>STATISTIK PLATFORM BELUM TERSEDIA</b> ⚠️';
        const emptyBody = 'Belum ada data statistik platform di sistem.\nCobalah lagi nanti.';
        return `${emptyHeader}\n\n${emptyBody}`;
    }

    const header = isWhatsApp
        ? '> *📊 STATISTIK PLATFORM KREATOR*'
        : '<b>📊 STATISTIK PLATFORM KREATOR</b>';

    const sections = [];

    for (const item of statsData) {
        const platformName = formatStatsKey(item.platform);
        const platformHeader = isWhatsApp ? `*${platformName}*` : `<b>${platformName}</b>`;

        const statsObj = item.stats || {};
        const statsLines = [];

        if (typeof statsObj === 'object' && Object.keys(statsObj).length > 0) {
            for (const [key, value] of Object.entries(statsObj)) {
                const formattedKey = formatStatsKey(key);
                const bullet = isWhatsApp ? '- ' : '• ';
                statsLines.push(`${bullet}${formattedKey}: ${value}`);
            }
        } else {
            const noBullet = isWhatsApp ? '- ' : '• ';
            statsLines.push(`${noBullet}(Tidak ada data)`);
        }

        const lastUpdated = item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '(Tidak diketahui)';
        const updateInfo = isWhatsApp
            ? `_Terakhir diupdate: ${lastUpdated}_`
            : `Terakhir diupdate: ${lastUpdated}`;

        sections.push([platformHeader, ...statsLines, '', updateInfo].join('\n'));
    }

    const body = sections.join('\n\n');
    const footer = ['—'.repeat(19), `Total Platform: ${statsData.length}`].join('\n');

    return `${header}\n\n${body}\n\n${footer}`;
}

module.exports = {
    getPlatformStats,
    formatStatsMessage
};
