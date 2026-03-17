// Platform statistics service
const supabase = require('../lib/supabaseClient');

async function getPlatformStats() {
    try {
        const { data, error } = await supabase
            .from('platform_stats')
            .select('platform, stats')
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

function formatAcronymWord(word) {
    const value = String(word || '').trim();
    if (!value) return '-';

    const acronymMap = {
        sql: 'SQL',
        api: 'API',
        ui: 'UI',
        ux: 'UX',
        html: 'HTML',
        css: 'CSS',
        js: 'JS',
        ts: 'TS'
    };

    const mapped = acronymMap[value.toLowerCase()];
    if (mapped) return mapped;

    return formatStatsKey(value);
}

function formatStarsValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return '(Tidak ada data)';
    }

    const stars = Object.entries(value)
        .map(([skill, count]) => {
            const skillLabel = formatAcronymWord(skill);
            const starCount = Number(count);

            if (!Number.isFinite(starCount)) {
                return null;
            }

            return `${skillLabel} ${starCount} Stars`;
        })
        .filter(Boolean);

    return stars.length > 0 ? stars.join(', ') : '(Tidak ada data)';
}

function formatReadableDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const localized = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
    }).format(date);

    return `${localized} WIB`;
}

function formatStatsValue(key, value) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (key === 'stars') {
        return formatStarsValue(value);
    }

    if (key === 'last_fetched') {
        return formatReadableDateTime(value);
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '(Tidak ada data)';
    }

    if (typeof value === 'object') {
        const nestedParts = Object.entries(value).map(([nestedKey, nestedValue]) => {
            const nestedLabel = formatStatsKey(nestedKey);
            return `${nestedLabel}: ${nestedValue}`;
        });

        return nestedParts.length > 0 ? nestedParts.join(', ') : '(Tidak ada data)';
    }

    return String(value);
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
                const formattedValue = formatStatsValue(key, value);
                const bullet = isWhatsApp ? '- ' : '• ';

                if (key === 'stars') {
                    statsLines.push(`${bullet}${formattedValue}`);
                    continue;
                }

                statsLines.push(`${bullet}${formattedKey}: ${formattedValue}`);
            }
        } else {
            const noBullet = isWhatsApp ? '- ' : '• ';
            statsLines.push(`${noBullet}(Tidak ada data)`);
        }

        sections.push([platformHeader, ...statsLines].join('\n'));
    }

    const body = sections.join('\n\n');
    const footer = ['—'.repeat(19), `Total Platform: ${statsData.length}`].join('\n');

    return `${header}\n\n${body}\n\n${footer}`;
}

module.exports = {
    getPlatformStats,
    formatStatsMessage
};
