// Main entry point
require('dotenv').config(); // Load environment variables from .env file

// Log untuk memastikan environment variable terbaca (opsional)
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Peringatan: GEMINI_API_KEY tidak ditemukan di environment variables.');
    console.warn('   Buat file .env di root dengan: GEMINI_API_KEY=your_key_here');
    console.warn('   Dapatkan API key dari: https://aistudio.google.com/apikey');
} else {
    console.log('✅ GEMINI_API_KEY ditemukan.');
    // Jangan tampilkan key sebenarnya untuk keamanan
    console.log('   Panjang key:', process.env.GEMINI_API_KEY.length, 'karakter');
}

const settings = require('./config/settings');
const { connectToWhatsApp } = require('./lib/waClient');
const WhatsAppHandler = require('./handlers/waHandler');

console.log(`Starting ${settings.app.name} v${settings.app.version} in ${settings.app.env} mode`);

// Variabel untuk menyimpan instance WhatsApp
let waSocket = null;
let waHandler = null;

// Fungsi untuk memulai WhatsApp bot
async function startWhatsAppBot() {
    try {
        console.log('Menghubungkan ke WhatsApp...');
        waSocket = await connectToWhatsApp();
        
        // Inisialisasi WhatsApp handler hanya setelah koneksi benar-benar terbuka
        waHandler = new WhatsAppHandler(waSocket);
        console.log('WhatsApp handler berhasil diinisialisasi');
        
        console.log('Bot berhasil terhubung dan siap menerima pesan!');
        
        // Tambahkan event listener untuk menangani error koneksi
        waSocket.ev.on('connection.update', (update) => {
            if (update.connection === 'close') {
                console.log('Koneksi terputus dari dalam handler. Mencoba ulang...');
                // Restart bot
                setTimeout(() => {
                    startWhatsAppBot();
                }, 10000);
            }
        });
        
    } catch (error) {
        console.error('Gagal memulai WhatsApp bot:', error.message);
        // Coba ulang setelah waktu yang bervariasi
        const retryDelay = Math.floor(Math.random() * 10000) + 10000; // 10-20 detik
        console.log(`Mencoba menghubungkan kembali dalam ${retryDelay/1000} detik...`);
        setTimeout(() => {
            startWhatsAppBot();
        }, retryDelay);
    }
}

// Fungsi untuk menghentikan WhatsApp bot
function stopWhatsAppBot() {
    if (waSocket) {
        console.log('Menghentikan WhatsApp bot...');
        waSocket = null;
        waHandler = null;
    }
}

// Fungsi utama
async function main() {
    // TODO: Initialize other clients, services, handlers, and jobs
    
    // Start WhatsApp bot
    await startWhatsAppBot();
    
    // TODO: Start Telegram bot
    
    // TODO: Start scheduled jobs
    
    console.log('Semua layanan berjalan!');
}

// Menjalankan aplikasi
main();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nMenerima SIGINT. Melakukan shutdown...');
    stopWhatsAppBot();
    // TODO: Stop other services
    console.log('Shutdown selesai.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nMenerima SIGTERM. Melakukan shutdown...');
    stopWhatsAppBot();
    // TODO: Stop other services
    console.log('Shutdown selesai.');
    process.exit(0);
});
