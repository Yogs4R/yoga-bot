const cron = require('node-cron');
const supabase = require('../lib/supabaseClient');

function startReminderCron(getWaSocket, telegramBot = null) {
    cron.schedule('* * * * *', async () => {
        try {
            const now = Date.now();
            const { data: reminders, error } = await supabase
                .from('reminders')
                .select('*')
                .lte('trigger_time', now);

            if (error) {
                console.error('[CRON] Error fetching reminders:', error);
                return;
            }

            for (const row of reminders) {
                const messageText = `⏰ *FUENZER REMINDER*\n\nPesan: ${row.message}`;

                // Try send to WA or Telegram depending on ID format
                // In Fuenzer Bot, WA IDs typically contain "@s.whatsapp.net" or are numeric ending in such
                // Telegram IDs are numeric without domain
                try {
                    const sock = typeof getWaSocket === 'function' ? getWaSocket() : getWaSocket;
                    
                    if (row.user_id.includes('@s.whatsapp.net')) {
                        if (sock) await sock.sendMessage(row.user_id, { text: messageText });
                    } else if (telegramBot) {
                        try {
                            const TeleMarkup = require('telegraf').Markup;
                            await telegramBot.telegram.sendMessage(row.user_id, `⏰ <b>FUENZER REMINDER</b>\n\nPesan: ${row.message}`, { parse_mode: 'HTML' });
                        } catch (e) { console.error('Tele err:', e) }
                    }
                } catch (sendError) {
                    console.error(`[CRON] Failed to send reminder to ${row.user_id}:`, sendError);
                }

                // Update or Delete based on is_loop
                if (row.is_loop && row.loop_interval) {
                    const nextTrigger = Date.now() + row.loop_interval;
                    await supabase
                        .from('reminders')
                        .update({ trigger_time: nextTrigger })
                        .match({ id: row.id });
                } else {
                    await supabase
                        .from('reminders')
                        .delete()
                        .match({ id: row.id });
                }
            }
        } catch (err) {
            console.error('[CRON] General error in reminder processing:', err);
        }
    });

    console.log('[CRON] Reminder job started.');
}

module.exports = { startReminderCron };
