const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { DisconnectReason } = require('@whiskeysockets/baileys');
const { Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    // Membuat folder auth/whatsapp jika belum ada
    const authFolder = path.join(__dirname, '..', '..', 'auth', 'whatsapp');
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }

    // Menggunakan multi file auth state
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    // Membuat socket connection dengan opsi tambahan
    const sock = makeWASocket({
        logger: pino({ level: 'info' }),
        auth: state,
        // Opsi untuk meningkatkan koneksi
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000,
        // Browser info yang lebih umum
        browser: ["Windows", "Chrome", "10.0"],
        // Tambahkan versi Baileys
        version: [2, 2413, 1]
    });

    // Menyimpan kredensial ketika diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Variable untuk menyimpan promise resolver
    let resolvePromise;
    let rejectPromise;
    
    const connectionPromise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    // Flag untuk menandai apakah QR sudah ditampilkan
    let qrDisplayed = false;

    // Menangani event connection.update
    sock.ev.on('connection.update', (update) => {
        console.log('Log Update:', JSON.stringify(update, null, 2));
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        // Tampilkan QR code jika tersedia
        if (qr && !qrDisplayed) {
            console.log('\n=== QR CODE UNTUK WHATSAPP ===');
            qrcode.generate(qr, { small: true });
            console.log('=== SCAN QR CODE DI ATAS ===\n');
            qrDisplayed = true;
        }
        
        if (connection === 'connecting') {
            console.log('Sedang menghubungkan ke WhatsApp...');
            if (isNewLogin && !qrDisplayed) {
                console.log('Login baru diperlukan. Silakan tunggu QR code...');
            }
        } else if (connection === 'close') {
            console.error('Koneksi ditutup.');
            if (lastDisconnect?.error) {
                console.error('Alasan Error:', lastDisconnect.error.message || lastDisconnect.error);
            }
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('Koneksi terputus. Akan mencoba kembali...');
                // Reject promise untuk memicu reconnect di index.js
                rejectPromise(new Error('Connection closed, need to reconnect'));
            } else {
                console.log('Koneksi ditutup karena logout. Silakan scan QR code lagi.');
                rejectPromise(new Error('Logged out'));
            }
        } else if (connection === 'open') {
            console.log('Berhasil terhubung ke WhatsApp!');
            qrDisplayed = false;
            // Resolve promise hanya ketika koneksi terbuka
            resolvePromise(sock);
        }
    });

    // Set timeout untuk connection
    setTimeout(() => {
        if (!sock.user && !qrDisplayed) {
            console.log('Waktu koneksi habis. Coba ulang...');
            rejectPromise(new Error('Connection timeout'));
        }
    }, 120000); // 2 menit timeout

    return connectionPromise;
}

module.exports = { connectToWhatsApp };
