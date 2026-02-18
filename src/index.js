// Main entry point
const settings = require('./config/settings');
const { connectToWhatsApp } = require('./lib/waClient');

console.log(`Starting ${settings.app.name} v${settings.app.version} in ${settings.app.env} mode`);

// Variabel untuk menyimpan instance WhatsApp
let waSocket = null;

// Fungsi untuk memulai WhatsApp bot
async function startWhatsAppBot() {
    try {
        console.log('Menghubungkan ke WhatsApp...');
        waSocket = await connectToWhatsApp();
        
        console.log('Bot berhasil terhubung!');
        
    } catch (error) {
        console.error('Gagal memulai WhatsApp bot:', error);
        process.exit(1);
    }
}

// Fungsi untuk menghentikan WhatsApp bot
function stopWhatsAppBot() {
    if (waSocket) {
        console.log('Menghentikan WhatsApp bot...');
        waSocket = null;
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
