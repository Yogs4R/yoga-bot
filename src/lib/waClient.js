const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
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

    // Gunakan versi Baileys terbaru untuk menghindari error 405
    const { version } = await fetchLatestBaileysVersion();

    // Membuat socket connection dengan opsi tambahan
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        // Opsi untuk meningkatkan koneksi
        connectTimeoutMs: 30000,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 30000,
        // Browser info yang umum & stabil
        browser: Browsers.windows('Chrome'),
        // Versi Baileys terbaru
        version,
        // Tambahkan opsi untuk handle connection issues
        retryRequestDelayMs: 2000,
        maxRetries: 3,
        // Tambahkan options untuk QR
        qrTimeout: 60000,
        // Kurangi beban sinkronisasi
        syncFullHistory: false,
        markOnlineOnConnect: false
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
    let connectionTimeout;

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
            // Reset timeout ketika QR muncul
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
            }
            connectionTimeout = setTimeout(() => {
                if (!sock.user) {
                    console.log('QR code timeout. Coba ulang...');
                    rejectPromise(new Error('QR timeout'));
                }
            }, 120000);
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
                // Cek jika error 405
                if (lastDisconnect.error.output?.statusCode === 405) {
                    console.log('Error 405: Mungkin ada masalah dengan server atau koneksi internet.');
                    console.log('Coba: 1. Gunakan VPN 2. Pastikan internet stabil 3. Tunggu beberapa menit');
                }
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
            // Clear timeout
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
            }
        } else if (connection === 'open') {
            console.log('Berhasil terhubung ke WhatsApp!');
            qrDisplayed = false;
            // Clear timeout
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
            }
            // Resolve promise hanya ketika koneksi terbuka
            resolvePromise(sock);
        }
    });

    // Set timeout untuk connection awal
    connectionTimeout = setTimeout(() => {
        if (!sock.user && !qrDisplayed) {
            console.log('Waktu koneksi habis. Coba ulang...');
            rejectPromise(new Error('Connection timeout'));
        }
    }, 60000);

    return connectionPromise;
}

module.exports = { connectToWhatsApp };
