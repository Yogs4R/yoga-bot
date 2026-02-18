// Main entry point
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
        
        // Inisialisasi WhatsApp handler dengan client
        waHandler = new WhatsAppHandler(waSocket);
        console.log('WhatsApp bot siap!');
        
        // Di sini kita bisa menambahkan event listener untuk pesan
        // Misalnya: waSocket.ev.on('messages.upsert', ...)
        // Atau biarkan handler mengaturnya
        
    } catch (error) {
        console.error('Gagal memulai WhatsApp bot:', error);
        process.exit(1);
    }
}

// Fungsi untuk menghentikan WhatsApp bot
function stopWhatsAppBot() {
    if (waSocket) {
        console.log('Menghentikan WhatsApp bot...');
        // Baileys tidak memiliki metode close() eksplisit, 
        // tapi kita bisa menghapus referensi
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
