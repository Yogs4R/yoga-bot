// Gemini AI client
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Konfigurasi model
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Kamu adalah Yoga Bot, asisten virtual pribadi milik Ridwan Yoga Suryantara (seorang developer Fuenzer Studio & mahasiswa Sistem Informasi). Kamu ramah, pintar coding, dan asyik diajak ngobrol. Jawab dengan bahasa Indonesia yang luwes."
});

/**
 * Fungsi untuk berinteraksi dengan Gemini AI
 * @param {string} message - Pesan dari pengguna
 * @returns {Promise<string>} - Jawaban dari AI
 */
async function askGemini(message) {
  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error saat memanggil Gemini AI:', error);
    throw error;
  }
}

module.exports = { askGemini };
