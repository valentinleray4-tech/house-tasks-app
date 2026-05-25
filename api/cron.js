// api/cron.js
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

webpush.setVapidDetails(
    'mailto:ton-email@exemple.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
    // Correction pour la vérification du header
    const authHeader = req.headers.authorization || req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: 'Non autorisé' });
    }

    // Heure actuelle au format HH:00:00
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0') + ":00:00";

    // Récupérer les abonnés actifs pour cette heure précise
    const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('reminder_time', currentHour)
        .eq('is_enabled', true);

    if (subs && subs.length > 0) {
        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, JSON.stringify({
                    title: "🏠 Rappel Tâches",
                    body: "Il est temps de vérifier les tâches de la maison !"
                }));
            } catch (err) {
                console.error("Erreur envoi:", err);
            }
        }
    }

    res.status(200).json({ status: "Vérification effectuée", hour: currentHour, count: subs?.length || 0 });
}