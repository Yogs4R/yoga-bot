const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { DisconnectReason } = require('@whiskeysockets/baileys');
const { Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    return new Promise((resolve, reject) => {
        // Membuat folder auth/whatsapp jika belum ada
        const authFolder = path.join(__dirname, '..', '..', 'auth', 'whatsapp');
        if (!fs.existsSync(authFolder)) {
            fs.mkdirSync(authFolder, { recursive: true });
        }

        // Menggunakan multi file auth state
        useMultiFileAuthState(authFolder).then(({ state, saveCreds }) => {
            // Membuat socket connection
            const sock = makeWASocket({
                logger: pino({ level: 'info' }),
                auth: state
            });

            // Menyimpan kredensial ketika diperbarui
            sock.ev.on('creds.update', saveCreds);

            // Menangani event connection.update
            sock.ev.on('connection.update', (update) => {
                console.log('Log Update:', update);
                const { connection, lastDisconnect, qr } = update;
                
                // Tampilkan QR code jika tersedia
                if (qr) {
                    console.log('Scan QR code berikut untuk menghubungkan:');
                    qrcode.generate(qr, { small: true });
                }
                
                if (connection === 'close') {
                    console.error('Alasan Error:', lastDisconnect?.error);
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    if (shouldReconnect) {
                        console.log('Koneksi terputus. Mencoba menghubungkan kembali...');
                        // Coba ulang koneksi
                        connectToWhatsApp().then(newSock => {
                            resolve(newSock);
                        }).catch(reject);
                    } else {
                        console.log('Koneksi ditutup karena logout. Silakan scan QR code lagi.');
                        reject(new Error('Logged out'));
                    }
                } else if (connection === 'open') {
                    console.log('Berhasil terhubung ke WhatsApp!');
                    // Resolve promise hanya ketika koneksi terbuka
                    resolve(sock);
                }
            });
        }).catch(reject);
    });
}

module.exports = { connectToWhatsApp };
