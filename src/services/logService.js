const supabase = require('../lib/supabaseClient');

async function logCommand(userId, platform, command) {
  try {
    const payload = {
      user_id: String(userId || '').trim(),
      platform: String(platform || '').toLowerCase().trim(),
      command: String(command || '').toLowerCase().trim()
    };

    if (!payload.user_id || !payload.platform || !payload.command) {
      return;
    }

    const { error } = await supabase.from('command_logs').insert(payload);
    if (error) {
      console.error('Failed to write command log:', error.message);
    }
  } catch (error) {
    console.error('Unexpected command log error:', error.message);
  }
}

module.exports = {
  logCommand
};