const supabase = require('../lib/supabaseClient');

async function getUniqueUsers(platform) {
  const platformName = String(platform || '').toLowerCase().trim();

  const [commandResult, aiResult] = await Promise.all([
    supabase
      .from('command_logs')
      .select('user_id')
      .eq('platform', platformName),
    supabase
      .from('ai_logs')
      .select('user_id')
      .eq('platform', platformName)
  ]);

  if (commandResult.error) {
    throw commandResult.error;
  }

  if (aiResult.error) {
    throw aiResult.error;
  }

  const mergedRows = [
    ...(commandResult.data || []),
    ...(aiResult.data || [])
  ];

  const uniqueUsers = [...new Set(
    mergedRows
      .map((item) => String(item?.user_id || '').trim())
      .filter(Boolean)
  )];

  return uniqueUsers;
}

module.exports = {
  getUniqueUsers
};
