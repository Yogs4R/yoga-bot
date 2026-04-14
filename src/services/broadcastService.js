const supabase = require('../lib/supabaseClient');

async function getUniqueUsers(platform) {
  const platformName = String(platform || '').toLowerCase().trim();

  const { data, error } = await supabase
    .from('command_logs')
    .select('user_id')
    .eq('platform', platformName);

  if (error) {
    throw error;
  }

  const uniqueUsers = [...new Set(
    (data || [])
      .map((item) => String(item?.user_id || '').trim())
      .filter(Boolean)
  )];

  return uniqueUsers;
}

module.exports = {
  getUniqueUsers
};
