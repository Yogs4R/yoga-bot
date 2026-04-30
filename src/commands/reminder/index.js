const { addReminder, listReminders, deleteReminder, updateReminder } = require('../../services/reminderService');

async function handleReminderCommand(args, userId, platform = 'whatsapp') {
    if (args.length === 0) {
        return "Penggunaan Reminder:\n/remind add [waktu] [pesan]\n/remind loop [waktu] [pesan]\n/remind list\n/remind hapus [id]\n/remind edit [id] [waktu] [pesan]\n\nContoh waktu: 1m (1 menit), 1h (1 jam), 1d (1 hari)";
    }

    const subCommand = args[0].toLowerCase();

    try {
        if (subCommand === 'add' || subCommand === 'loop') {
            if (args.length < 3) return "Format tidak lengkap! Gunakan: /remind add/loop [waktu] [pesan]";
            const timeStr = args[1];
            const message = args.slice(2).join(' ');
            const isLoop = subCommand === 'loop';

            const data = await addReminder(userId, timeStr, message, isLoop);
            
            if (isLoop) {
                return `🔁 Pengingat berulang (setiap ${timeStr}) disetel dengan ID: ${data.id}`;
            } else {
                return `✅ Pengingat sekali jalan disetel dengan ID: ${data.id}`;
            }
        }

        if (subCommand === 'list') {
            const reminders = await listReminders(userId);
            if (reminders.length === 0) return "Tidak ada pengingat yang tersimpan.";

            let text = "Daftar Pengingat Anda:\n\n";
            reminders.forEach((r, idx) => {
                const date = new Date(r.trigger_time).toLocaleString('id-ID');
                const icon = r.is_loop ? '🔁' : '⏰';
                text += `${idx + 1}. [${r.id}] ${icon} ${date}\n   Pesan: ${r.message}\n`;
            });
            return text;
        }

        if (subCommand === 'hapus') {
            if (args.length < 2) return "Sertakan ID! Contoh: /remind hapus A1B2C";
            const reqId = args[1];
            await deleteReminder(userId, reqId);
            return `✅ Pengingat dengan ID ${reqId} berhasil dihapus.`;
        }

        if (subCommand === 'edit') {
            if (args.length < 4) return "Format tidak lengkap! Gunakan: /remind edit [id] [waktu] [pesan]";
            const reqId = args[1];
            const timeStr = args[2];
            const message = args.slice(3).join(' ');

            await updateReminder(userId, reqId, timeStr, message);
            return `✅ Pengingat ${reqId} berhasil diupdate.`;
        }

        return "Sub-perintah tidak dikenali.";
    } catch (error) {
        return `❌ Gagal: ${error.message}`;
    }
}

module.exports = { handleReminderCommand };
