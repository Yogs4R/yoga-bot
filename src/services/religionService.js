// Religion service (sholat schedule)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getSholat(kota) {
    try {
        // Step 1: Cari ID kota
        const searchResponse = await fetch(
            `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`
        );
        
        if (!searchResponse.ok) {
            return `> *ERROR KONEKSI* ❌\n\nGagal mencari kota. Status: ${searchResponse.status}`;
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.data || searchData.data.length === 0) {
            return `> *KOTA TIDAK DITEMUKAN* ❌\n\nKota "${kota}" tidak ditemukan dalam database jadwal sholat.\nPastikan penulisan nama kota benar.`;
        }
        
        const cityId = searchData.data[0].id;
        const cityName = searchData.data[0].lokasi;
        
        // Step 2: Dapatkan jadwal untuk hari ini
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const scheduleResponse = await fetch(
            `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`
        );
        
        if (!scheduleResponse.ok) {
            return `> *ERROR JADWAL* ❌\n\nGagal mengambil jadwal sholat. Status: ${scheduleResponse.status}`;
        }
        
        const scheduleData = await scheduleResponse.json();
        
        if (!scheduleData.data || !scheduleData.data.jadwal) {
            return '> *DATA TIDAK VALID* ❌\n\nData jadwal sholat tidak valid. Silakan coba lagi nanti.';
        }
        
        const jadwal = scheduleData.data.jadwal;
        const header = `> *JADWAL SHOLAT* 🕌\n\nKota: ${cityName}\nTanggal: ${jadwal.tanggal}`;
        
        const body = [
            `Imsak    : ${jadwal.imsak}`,
            `Subuh    : ${jadwal.subuh}`,
            `Dzuhur   : ${jadwal.dzuhur}`,
            `Ashar    : ${jadwal.ashar}`,
            `Maghrib  : ${jadwal.maghrib}`,
            `Isya     : ${jadwal.isya}`
        ].join('\n');
        
        const box = '┌──────────────────────────────┐\n' +
                    body.split('\n').map(line => `│ ${line}`).join('\n') + '\n' +
                    '└──────────────────────────────┘';
        
        return `${header}\n\n${box}`;
    } catch (error) {
        console.error('Error fetching prayer schedule:', error);
        return '> *ERROR SISTEM* ❌\n\nTerjadi kesalahan saat mengambil jadwal sholat. Silakan coba lagi nanti.';
    }
}

async function handleReligionCommand(command, args, userId, platform) {
    if (command !== '/sholat') {
        return 'Perintah tidak dikenali.';
    }
    
    if (args.length === 0) {
        return '> *FORMAT SALAH* ❌\n\nGunakan format: /sholat <nama_kota>\nContoh: /sholat Jakarta';
    }
    
    const kota = args.join(' ');
    return await getSholat(kota);
}

module.exports = {
    getSholat,
    handleReligionCommand
};
