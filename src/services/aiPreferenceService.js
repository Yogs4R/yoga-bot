const supabase = require('../lib/supabaseClient');

const DEFAULT_AI_MODEL_ALIAS = 'gpt-oss';

const AI_MODELS = {
  'gpt-oss': {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B',
    type: 'default',
    description: '117B MoE, kuat logika & serbaguna.',
    inputPrice: '$0.039/M',
    outputPrice: '$0.19/M',
    context: '131k',
    maxOut: '131k'
  },
  'elephant': {
    id: 'openrouter/elephant-alpha',
    name: 'Elephant Alpha',
    type: 'free',
    description: '100B params, efisien token.',
    inputPrice: '-',
    outputPrice: '-',
    context: '262k',
    maxOut: '32k'
  },
  'gemma4': {
    id: 'google/gemma-4-26b-a4b-it',
    name: 'Google Gemma 4 31B',
    type: 'premium',
    description: 'Multimodal (Teks/Gambar).',
    inputPrice: '$0.13/M',
    outputPrice: '$0.38/M',
    context: '262k',
    maxOut: '262k'
  }
};

function normalizePlatform(platform) {
  return String(platform || '').trim().toLowerCase();
}

function normalizeUserId(userId) {
  return String(userId || '').trim();
}

function getDefaultModelId() {
  return AI_MODELS[DEFAULT_AI_MODEL_ALIAS].id;
}

function getModelAliasList() {
  return Object.entries(AI_MODELS).map(([alias, model]) => ({ alias, ...model }));
}

function getModelById(modelId) {
  const normalizedModelId = String(modelId || '').trim();
  if (!normalizedModelId) {
    return null;
  }

  const entry = getModelAliasList().find((model) => model.id === normalizedModelId);
  return entry || null;
}

function buildWhatsAppModelInfoMessage() {
  const defaultModel = AI_MODELS['gpt-oss'];
  const freeModels = getModelAliasList().filter((model) => model.type === 'free');
  const premiumModels = getModelAliasList().filter((model) => model.type === 'premium');

  const renderModel = (index, model, options = {}) => {
    const parts = [
      `${index}️⃣ *${model.name}*`,
      `Ketik: /switch ${model.alias}`,
      `📝 ${model.description}`
    ];

    if (!options.freeOnly) {
      parts.push(`💰 Input: ${model.inputPrice} | Output: ${model.outputPrice}`);
    }

    parts.push(`📊 Context: ${model.context} | Max Out: ${model.maxOut}`);
    return parts.join('\n');
  };

  return [
    '> 🤖 DAFTAR MODEL AI YOGA BOT',
    'Ketik /switch <alias> untuk mengganti "otak" AI.',
    '',
    '*⭐ DEFAULT MODEL (Bawaan)*',
    renderModel(1, defaultModel),
    '',
    '*🟢 GRATIS (Training Models)*',
    '⚠️ Catatan: Chat mungkin dicatat untuk training.',
    ...freeModels.map((model, index) => renderModel(index + 2, model, { freeOnly: true })),
    '',
    '*🔵 PREMIUM (Berbayar)*',
    ...premiumModels.map((model, index) => renderModel(index + 3, model))
  ].join('\n');
}

function buildModelInfoMessage(platform = 'telegram') {
  const platformName = normalizePlatform(platform);
  const isWhatsApp = platformName === 'whatsapp';
  if (isWhatsApp) {
    return buildWhatsAppModelInfoMessage();
  }

  const header = '<b>MODEL AI OPENROUTER</b> 🤖';
  const freeModels = getModelAliasList().filter((model) => model.type === 'default' || model.type === 'free');
  const premiumModels = getModelAliasList().filter((model) => model.type === 'premium');

  const formatLine = (model, options = {}) => {
    const aliasText = `<code>${model.alias}</code>`;
    const nameText = `<b>${model.name}</b>`;
    const lines = [`${aliasText} - ${nameText}`, `📝 ${model.description}`];

    if (!options.freeOnly) {
      lines.push(`💰 Input: ${model.inputPrice} | Output: ${model.outputPrice}`);
    }

    lines.push(`📊 Context: ${model.context} | Max Out: ${model.maxOut}`);
    return lines.join('\n');
  };

  const body = [
    'Pilih model AI yang ingin dipakai dengan command <code>/switch</code>.',
    '',
    '<b>GRATIS</b>',
    ...freeModels.map((model) => formatLine(model, { freeOnly: model.type === 'free' })),
    '',
    '<b>PREMIUM</b>',
    ...premiumModels.map(formatLine),
    '',
    'Contoh: <code>/switch elephant</code>'
  ].join('\n');

  return `${header}\n\n${body}`;
}

async function getActiveModel(userId, platform) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedPlatform = normalizePlatform(platform);

  if (!normalizedUserId || !normalizedPlatform) {
    return getDefaultModelId();
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('active_model')
    .eq('user_id', normalizedUserId)
    .eq('platform', normalizedPlatform)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching AI preference for ${normalizedPlatform}/${normalizedUserId}:`, error);
    return getDefaultModelId();
  }

  const activeModel = String(data?.active_model || '').trim();
  return activeModel || getDefaultModelId();
}

async function setActiveModel(userId, platform, alias) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedPlatform = normalizePlatform(platform);
  const normalizedAlias = String(alias || '').trim().toLowerCase();
  const model = AI_MODELS[normalizedAlias];

  if (!normalizedUserId) {
    throw new Error('User ID tidak valid.');
  }

  if (!normalizedPlatform) {
    throw new Error('Platform tidak valid.');
  }

  if (!model) {
    throw new Error('Alias model tidak ditemukan.');
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert([
      {
        user_id: normalizedUserId,
        platform: normalizedPlatform,
        active_model: model.id
      }
    ], {
      onConflict: 'user_id,platform'
    });

  if (error) {
    console.error(`Error saving AI preference for ${normalizedPlatform}/${normalizedUserId}:`, error);
    throw new Error('Gagal menyimpan preferensi model AI.');
  }

  return model.id;
}

module.exports = {
  AI_MODELS,
  buildModelInfoMessage,
  getModelById,
  getActiveModel,
  setActiveModel
};