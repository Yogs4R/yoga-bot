const ms = require('ms');
const supabase = require('../lib/supabaseClient');

const generateId = () => Math.random().toString(36).substring(2, 7).toUpperCase();

async function addReminder(userId, timeStr, message, isLoop = false) {
    const delay = ms(timeStr);
    if (!delay) {
        throw new Error('Format waktu tidak valid (contoh: 1m, 2h, 1d)');
    }

    const triggerTime = Date.now() + delay;
    const id = generateId();

    const { data, error } = await supabase
        .from('reminders')
        .insert([
            {
                id,
                user_id: userId,
                message,
                trigger_time: triggerTime,
                is_loop: isLoop,
                loop_interval: isLoop ? delay : null
            }
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function listReminders(userId) {
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('trigger_time', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function deleteReminder(userId, id) {
    const { error } = await supabase
        .from('reminders')
        .delete()
        .match({ id, user_id: userId });

    if (error) throw error;
    return true;
}

async function updateReminder(userId, id, timeStr, message) {
    // Ambil data lama
    const { data: oldData, error: fetchError } = await supabase
        .from('reminders')
        .select('*')
        .match({ id, user_id: userId })
        .single();

    if (fetchError || !oldData) {
        throw new Error('Pengingat tidak ditemukan.');
    }

    const delay = ms(timeStr);
    if (!delay) {
        throw new Error('Format waktu tidak valid (contoh: 1m, 2h, 1d)');
    }

    const triggerTime = Date.now() + delay;
    const updates = {
        message,
        trigger_time: triggerTime,
    };

    if (oldData.is_loop) {
        updates.loop_interval = delay;
    }

    const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .match({ id, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
}

module.exports = {
    addReminder,
    listReminders,
    deleteReminder,
    updateReminder
};
