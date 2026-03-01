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
const modelName = "gemini-2.5-flash-lite"; 
const RPM_LIMIT = parseInt(process.env.GEMINI_RPM_LIMIT || '15', 10);
const requestTimestamps = [];

const model = genAI.getGenerativeModel({ 
  model: modelName,
  systemInstruction: `Kamu adalah Yoga Bot, asisten virtual pribadi milik Ridwan Yoga Suryantara (seorang developer Fuenzer Studio & mahasiswa Sistem Informasi). Kamu ramah, pintar coding, dan asyik diajak ngobrol. Jawab dengan bahasa Indonesia yang luwes dan gunakan emoji secukupnya.
  ATURAN PENTING:
  1. Jika pengguna mengirim pesan yang tidak jelas, ketikan acak (seperti 'ajsdas', 'sjadna'), atau hanya huruf tunggal ('P', 'y'), JANGAN memberikan jawaban panjang. Cukup balas singkat: "Maaf, aku kurang paham maksud ketikanmu. 😅 Ketik /info untuk melihat daftar kemampuanku ya!"
  2. Jika pengguna baru menyapa (seperti "Halo", "Hai") atau bertanya tentang apa yang bisa kamu lakukan, selalu akhiri jawabanmu dengan menawarkan mereka untuk mengetik command "/info".`,
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

/**
 * Fungsi untuk membersihkan dan memformat Markdown Gemini agar sesuai dengan standar WhatsApp
 * @param {string} text - Teks mentah dari Gemini
 * @returns {string} - Teks yang sudah diformat untuk WA
 */
function formatForWhatsApp(text) {
  if (!text) return text;
  
  let formattedText = text;
  
  // Ubah Bold: **teks** menjadi *teks*
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '*$1*');
  
  // Ubah Header Markdown: ### Judul menjadi *Judul*
  formattedText = formattedText.replace(/^#+\s*(.*)$/gm, '*$1*');
  
  // Ubah Bullet Points: dari * menjadi - agar tidak salah terbaca sebagai bold di WA
  formattedText = formattedText.replace(/^\s*\*\s+/gm, '- ');

  return formattedText;
}

/**
 * Fungsi untuk berinteraksi dengan Gemini AI
 * @param {string} message - Pesan dari pengguna
 * @returns {Promise<string>} - Jawaban dari AI
 */
async function askGemini(message) {
  const detailed = await askGeminiDetailed(message);
  return detailed.text;
}

function trackRequestAndGetRpmStatus() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  requestTimestamps.push(now);

  const used = requestTimestamps.length;
  const remaining = Math.max(RPM_LIMIT - used, 0);
  const status = remaining > 0 ? 'AMAN' : 'BATAS RPM';

  return {
    used,
    limit: RPM_LIMIT,
    remaining,
    status,
    label: `${used}/${RPM_LIMIT} (${status})`
  };
}

function extractUsageMetadata(response) {
  const usage = response?.usageMetadata || {};

  const promptTokenCount = usage.promptTokenCount || usage.inputTokenCount || 0;
  const candidatesTokenCount = usage.candidatesTokenCount || usage.outputTokenCount || 0;
  const totalTokenCount = usage.totalTokenCount || (promptTokenCount + candidatesTokenCount);

  return {
    promptTokenCount,
    candidatesTokenCount,
    totalTokenCount
  };
}

async function askGeminiDetailed(message) {
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
    
    // Ambil teks mentah lalu format untuk WhatsApp
    const rawText = response.text();
    const finalMessageWA = formatForWhatsApp(rawText);
    const usage = extractUsageMetadata(response);
    const rpm = trackRequestAndGetRpmStatus();
    
    return {
      text: finalMessageWA,
      model: modelName,
      usage,
      rpm
    };

  } catch (error) {
    console.error('Error saat memanggil Gemini AI:', error.message);
    
    // Pesan Error
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

module.exports = { askGemini, askGeminiDetailed, modelName };