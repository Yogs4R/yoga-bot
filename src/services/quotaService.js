const supabaseClient = require('../lib/supabaseClient');

/**
 * Check and increment API quota for a service
 * @param {string} serviceName - Service identifier (e.g., 'removebg', 'html2img')
 * @param {number} limit - Monthly quota limit (default 50)
 * @param {boolean} isDaily - If true, reset usage when day changes
 * @returns {Promise<boolean>} - true if quota available, false if exhausted
 */
async function checkAndIncrementQuota(serviceName, limit = 50, isDaily = false) {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayDate = nowIso.slice(0, 10);

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
      // Create new quota entry if doesn't exist
      const { error: insertError } = await supabaseClient
        .from('api_quotas')
        .insert([
          {
            service: serviceName,
            usage: 1,
            limit: limit,
            updated_at: nowIso
          }
        ]);

      if (insertError) {
        console.error(`Error creating quota entry for ${serviceName}:`, insertError);
        throw new Error(`Failed to create quota for ${serviceName}`);
      }

      return true;
    }

    let usage = Number(data.usage || 0);
    const effectiveLimit = Number(data.limit || limit);

    if (isDaily) {
      const updatedAtDate = data.updated_at ? new Date(data.updated_at) : null;
      const updatedDate = updatedAtDate && !Number.isNaN(updatedAtDate.getTime())
        ? updatedAtDate.toISOString().slice(0, 10)
        : '';

      if (updatedDate !== todayDate) {
        usage = 0;
      }
    }

    // Check if quota exhausted
    if (usage >= effectiveLimit) {
      return false;
    }

    // Increment usage
    const { error: updateError } = await supabaseClient
      .from('api_quotas')
      .update({
        usage: usage + 1,
        limit: effectiveLimit,
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

module.exports = {
  checkAndIncrementQuota
};
