// Gemini AI client
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY tidak ditemukan di environment variables.');
    console.error('Pastikan Anda telah membuat file .env dengan GEMINI_API_KEY=your_key_here');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Konfigurasi model - menggunakan model yang tersedia di tier gratis
// Coba gemini-1.5-flash atau gemini-1.5-flash-8b
const modelName = "gemini-1.5-flash-8b"; // Model yang lebih ringan untuk tier gratis
// Alternatif: "gemini-1.5-flash"

const model = genAI.getGenerativeModel({ 
  model: modelName,
  systemInstruction: "Kamu adalah Yoga Bot, asisten virtual pribadi milik Ridwan Yoga Suryantara (seorang developer Fuenzer Studio & mahasiswa Sistem Informasi). Kamu ramah, pintar coding, dan asyik diajak ngobrol. Jawab dengan bahasa Indonesia yang luwes.",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

/**
 * Fungsi untuk berinteraksi dengan Gemini AI
 * @param {string} message - Pesan dari pengguna
 * @returns {Promise<string>} - Jawaban dari AI
 */
async function askGemini(message) {
  try {
    // Validasi API key
    if (!apiKey) {
      throw new Error('API key Gemini tidak ditemukan. Periksa file .env Anda.');
    }
    
    // Log untuk debugging
    console.log(`Mengirim permintaan ke Gemini AI dengan model: ${modelName}`);
    
    const result = await model.generateContent(message);
    const response = await result.response;
    
    // Periksa jika ada teks
    if (!response.text) {
      throw new Error('Tidak ada teks dalam respons dari Gemini AI');
    }
    
    return response.text();
  } catch (error) {
    console.error('Error saat memanggil Gemini AI:', error.message);
    
    // Berikan pesan error yang lebih informatif
    if (error.message.includes('429') || error.message.includes('quota')) {
      throw new Error('Kuota Gemini AI telah habis. Silakan periksa billing di Google Cloud Console atau tunggu hingga reset.');
    } else if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
      throw new Error('Akses ditolak. Periksa API key dan pastikan billing diaktifkan untuk project Google Cloud Anda.');
    } else if (error.message.includes('model not found')) {
      throw new Error(`Model ${modelName} tidak ditemukan. Coba ganti model di konfigurasi.`);
    } else {
      throw error;
    }
  }
}

module.exports = { askGemini };
