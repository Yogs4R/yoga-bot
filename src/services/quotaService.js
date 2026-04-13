const supabaseClient = require('../lib/supabaseClient');

function isNewPeriod(updatedAt, isDaily) {
  const now = new Date();
  const previous = new Date(updatedAt);

  if (Number.isNaN(previous.getTime())) {
    return true;
  }

  if (isDaily) {
    return (
      now.getUTCFullYear() !== previous.getUTCFullYear()
      || now.getUTCMonth() !== previous.getUTCMonth()
      || now.getUTCDate() !== previous.getUTCDate()
    );
  }

  return (
    now.getUTCFullYear() !== previous.getUTCFullYear()
    || now.getUTCMonth() !== previous.getUTCMonth()
  );
}

/**
 * Check and increment API quota for a service
 * @param {string} serviceName - Service identifier (e.g., 'removebg', 'html2img')
 * @param {number} limit - Monthly quota limit (default 50)
 * @param {boolean} isDaily - If true, reset usage when day changes
 * @returns {Promise<boolean>} - true if quota available, false if exhausted
 */
async function checkAndIncrementQuota(serviceName, limit = 50, isDaily = false) {
  try {
    const effectiveLimit = Number(limit);
    if (!Number.isFinite(effectiveLimit) || effectiveLimit <= 0) {
      return true;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const { data, error } = await supabaseClient
      .from('api_quotas')
      .select('service, usage, limit, updated_at')
      .eq('service', serviceName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error(`Error fetching quota for ${serviceName}:`, error);
      throw new Error(`Failed to check quota for ${serviceName}`);
    }

    if (!data) {
      const { error: insertError } = await supabaseClient
        .from('api_quotas')
        .insert([
          {
            service: serviceName,
            usage: 1,
            limit: effectiveLimit,
            updated_at: nowIso
          }
        ]);

      if (insertError) {
        console.error(`Error creating quota entry for ${serviceName}:`, insertError);
        throw new Error(`Failed to create quota for ${serviceName}`);
      }

      return true;
    }

    const configuredLimit = effectiveLimit;
    const usage = Number(data.usage || 0);

    if (isNewPeriod(data.updated_at, isDaily)) {
      const { error: resetError } = await supabaseClient
        .from('api_quotas')
        .update({
          usage: 1,
          limit: configuredLimit,
          updated_at: nowIso
        })
        .eq('service', serviceName);

      if (resetError) {
        console.error(`Error resetting quota for ${serviceName}:`, resetError);
        throw new Error(`Failed to reset quota for ${serviceName}`);
      }

      return true;
    }

    if (usage >= configuredLimit) {
      return false;
    }

    const { error: updateError } = await supabaseClient
      .from('api_quotas')
      .update({
        usage: usage + 1,
        limit: configuredLimit,
        updated_at: nowIso
      })
      .eq('service', serviceName);

    if (updateError) {
      console.error(`Error updating quota for ${serviceName}:`, updateError);
      throw new Error(`Failed to update quota for ${serviceName}`);
    }

    return true;
  } catch (error) {
    console.error('Quota check error:', error);
    throw error;
  }
}

async function getQuotaStatus(serviceName, limit, isDaily = false) {
  const effectiveLimit = Number(limit);

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseClient
      .from('api_quotas')
      .select('service, usage, limit, updated_at')
      .eq('service', serviceName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching quota status for ${serviceName}:`, error);
      throw new Error(`Failed to read quota status for ${serviceName}`);
    }

    if (!data) {
      return {
        usage: 0,
        limit: Number.isFinite(effectiveLimit) ? effectiveLimit : limit
      };
    }

    const configuredLimit = Number.isFinite(effectiveLimit) ? effectiveLimit : Number(data.limit || limit);

    if (isNewPeriod(data.updated_at, isDaily)) {
      const { error: resetError } = await supabaseClient
        .from('api_quotas')
        .update({
          usage: 0,
          limit: configuredLimit,
          updated_at: nowIso
        })
        .eq('service', serviceName);

      if (resetError) {
        console.error(`Error resetting quota status for ${serviceName}:`, resetError);
        throw new Error(`Failed to reset quota status for ${serviceName}`);
      }

      return {
        usage: 0,
        limit: configuredLimit
      };
    }

    return {
      usage: Number(data.usage || 0),
      limit: configuredLimit
    };
  } catch (error) {
    console.error('Quota status error:', error);
    throw error;
  }
}

module.exports = {
  checkAndIncrementQuota,
  getQuotaStatus
};
