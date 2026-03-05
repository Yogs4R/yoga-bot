// AI client (OpenRouter via OpenAI SDK)
const OpenAI = require('openai');

// Inisialisasi OpenRouter API
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    console.error('ERROR: OPENROUTER_API_KEY tidak ditemukan di environment variables.');
    console.error('Pastikan Anda telah membuat file .env dengan OPENROUTER_API_KEY=your_key_here');
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey
});

// Konfigurasi model - menggunakan model yang tersedia di tier gratis
const modelName = "meta-llama/llama-3.3-70b-instruct:free";
const RPM_LIMIT = parseInt(process.env.OPENROUTER_RPM_LIMIT || process.env.GEMINI_RPM_LIMIT || '15', 10);
const requestTimestamps = [];

const systemInstruction = `Kamu adalah Yoga Bot, asisten virtual pribadi milik Ridwan Yoga Suryantara (seorang developer Fuenzer Studio & mahasiswa Sistem Informasi). Kamu ramah, pintar coding, dan asyik diajak ngobrol. Jawab dengan bahasa Indonesia yang luwes dan gunakan emoji secukupnya.
  ATURAN PENTING:
  1. Jika pengguna mengirim pesan yang tidak jelas, ketikan acak (seperti 'ajsdas', 'sjadna'), atau hanya huruf tunggal ('P', 'y'), JANGAN memberikan jawaban panjang. Cukup balas singkat: "Maaf, aku kurang paham maksud ketikanmu. 😅 Ketik /info untuk melihat daftar kemampuanku ya!"
  2. Jika pengguna baru menyapa (seperti "Halo", "Hai") atau bertanya tentang apa yang bisa kamu lakukan, selalu akhiri jawabanmu dengan menawarkan mereka untuk mengetik command "/info".`;

const generationConfig = {
  temperature: 0.7,
  top_p: 0.8,
  max_tokens: 1024,
};

/**
 * Fungsi untuk membersihkan dan memformat Markdown AI agar sesuai dengan standar WhatsApp
 * @param {string} text - Teks mentah dari AI
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
 * Fungsi untuk berinteraksi dengan AI
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
  const usage = response?.usage || {};

  const promptTokenCount = usage.prompt_tokens || 0;
  const candidatesTokenCount = usage.completion_tokens || 0;
  const totalTokenCount = usage.total_tokens || (promptTokenCount + candidatesTokenCount);

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
      throw new Error('API key OpenRouter tidak ditemukan. Periksa file .env Anda.');
    }
    
    // Log untuk debugging
    console.log(`Mengirim permintaan ke OpenRouter API dengan model: ${modelName}`);
    
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: String(message || '') }
      ],
      ...generationConfig
    });

    const content = response?.choices?.[0]?.message?.content;
    const rawText = Array.isArray(content)
      ? content.map((part) => part?.text || '').join('\n').trim()
      : String(content || '').trim();
    
    // Periksa jika ada teks
    if (!rawText) {
      throw new Error('Tidak ada teks dalam respons dari OpenRouter API');
    }
    
    // Ambil teks mentah lalu format untuk WhatsApp
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
    const statusCode = error?.status || error?.response?.status;
    const errorMessage = String(error?.message || 'Unknown error');
    const lowerErrorMessage = errorMessage.toLowerCase();

    console.error('Error saat memanggil OpenRouter API:', statusCode || '-', errorMessage);
    
    // Pesan Error
    if (statusCode === 429 || lowerErrorMessage.includes('rate limit')) {
      throw new Error('429 Rate Limit dari OpenRouter. Batas request tercapai, coba lagi sebentar.');
    } else if (statusCode === 401 || lowerErrorMessage.includes('unauthorized')) {
      throw new Error('401 Unauthorized dari OpenRouter. Periksa OPENROUTER_API_KEY Anda.');
    } else if (statusCode === 403 || lowerErrorMessage.includes('forbidden')) {
      throw new Error('403 Forbidden dari OpenRouter. API key valid tetapi akses model ditolak.');
    } else if (statusCode === 404 || lowerErrorMessage.includes('model not found')) {
      throw new Error(`Model ${modelName} tidak ditemukan di OpenRouter.`);
    } else if (statusCode >= 500 && statusCode <= 599) {
      throw new Error(`Server OpenRouter sedang gangguan (${statusCode}). Coba lagi nanti.`);
    } else if (lowerErrorMessage.includes('api key')) {
      throw new Error('API key OpenRouter tidak valid atau belum diatur.');
    } else {
      throw error;
    }
  }
}

async function askAi(message) {
  return askGemini(message);
}

async function askAiDetailed(message) {
  return askGeminiDetailed(message);
}

module.exports = { askGemini, askGeminiDetailed, askAi, askAiDetailed, modelName };
