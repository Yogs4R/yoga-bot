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
        printQRInTerminal: true,
        // Opsi untuk meningkatkan koneksi
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000,
        // Browser info
        browser: ["Ubuntu", "Chrome", "20.0.04"]
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

    // Menangani event connection.update
    sock.ev.on('connection.update', (update) => {
        console.log('Log Update:', JSON.stringify(update, null, 2));
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        // Tampilkan QR code jika tersedia
        if (qr) {
            console.log('Scan QR code berikut untuk menghubungkan:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'connecting') {
            console.log('Sedang menghubungkan...');
            if (isNewLogin) {
                console.log('Login baru diperlukan. Silakan scan QR code.');
            }
        } else if (connection === 'close') {
            console.error('Alasan Error:', lastDisconnect?.error);
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('Koneksi terputus. Mencoba menghubungkan kembali dalam 5 detik...');
                // Reject promise untuk memicu reconnect di index.js
                rejectPromise(new Error('Connection closed, need to reconnect'));
            } else {
                console.log('Koneksi ditutup karena logout. Silakan scan QR code lagi.');
                rejectPromise(new Error('Logged out'));
            }
        } else if (connection === 'open') {
            console.log('Berhasil terhubung ke WhatsApp!');
            // Resolve promise hanya ketika koneksi terbuka
            resolvePromise(sock);
        }
    });

    // Set timeout untuk connection
    setTimeout(() => {
        if (!sock.user) {
            rejectPromise(new Error('Connection timeout'));
        }
    }, 60000);

    return connectionPromise;
}

module.exports = { connectToWhatsApp };
