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

    // Membuat socket connection
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Desktop')
    });

    // Menyimpan kredensial ketika diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Menangani event connection.update
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Tampilkan QR code jika tersedia
        if (qr) {
            console.log('Scan QR code berikut untuk menghubungkan:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('Koneksi terputus. Mencoba menghubungkan kembali...');
                connectToWhatsApp();
            } else {
                console.log('Koneksi ditutup karena logout. Silakan scan QR code lagi.');
            }
        } else if (connection === 'open') {
            console.log('Berhasil terhubung ke WhatsApp!');
        }
    });

    return sock;
}

module.exports = { connectToWhatsApp };
