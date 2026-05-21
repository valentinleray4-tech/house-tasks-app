'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import TaskModal from './components/TaskModal'
import TaskRow from './components/TaskRow'
import ProfileSelector from './components/ProfileSelector'
// Fonction utilitaire pour convertir la clé VAPID pour le navigateur
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
export default function Home() {
    const [tasks, setTasks] = useState([])
    const [logs, setLogs] = useState([])
    const [profiles, setProfiles] = useState([])
    const [currentUserId, setCurrentUserId] = useState(null)
    const [refreshKey, setRefreshKey] = useState(0)

    // Onglet actif ('tasks', 'leaderboard' ou 'profile')
    const [currentTab, setCurrentTab] = useState('tasks')

    // Variables d'état locales pour stocker temporairement les choix graphiques du profil connecté
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true)
    const [reminderTime, setReminderTime] = useState('08:00')

    // 🌟 FONCTION DE SAUVEGARDE DE L'ABONNEMENT DANS SUPABASE
    async function savePushSubscription(swRegistration, profileId) {
        try {
            // 🚨 REMPLACE ICI AVEC TA VRAIE CLÉ PUBLIQUE OBTENUE À L'ÉTAPE 1
            const publicKey = 'BBDV_P8dIl6ZK3yF2E7diaJoGp0KUHnvS7MUZ1l7_rQtVbTgzb37A3vK7H8qW3nkrread0cRQGPJR0h0d_4G60Igit';
            const convertedKey = urlBase64ToUint8Array(publicKey);

            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey // 🌟 Utilise la clé convertie ici
            });

            const subJson = subscription.toJSON();

            // Enregistrer ou mettre à jour dans la table Supabase
            await supabase
                .from('push_subscriptions')
                .upsert({
                    profile_id: profileId,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys?.p256dh,
                    auth: subJson.keys?.auth
                }, { onConflict: 'endpoint' });

            console.log("Abonnement push sauvegardé avec succès pour le profil :", profileId);
        } catch (err) {
            console.error("Impossible d'abonner le téléphone aux notifications :", err);
        }
    }
    // 🌟 ENREGISTREMENT DU SERVICE WORKER & DECLENCHEMENT DE L'ABONNEMENT
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(function (swReg) {
                    console.log('Service Worker mobile enregistré avec succès !', swReg);

                    if (Notification.permission === 'granted' && currentUserId) {
                        savePushSubscription(swReg, currentUserId);
                    } else if (Notification.permission === 'default') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted' && currentUserId) {
                                savePushSubscription(swReg, currentUserId);
                            }
                        });
                    }
                })
                .catch(function (error) {
                    console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
                });
        }
    }, [currentUserId])

    // 1. Charger toutes les données depuis Supabase + charger les préférences de l'utilisateur connecté
    useEffect(() => {
        async function fetchData() {
            const { data: tasksData } = await supabase.from('tasks').select('*').order('title', { ascending: true })
            const { data: logsData } = await supabase.from('task_logs').select('*, profiles(name)').order('done_at', { ascending: false })
            const { data: profilesData } = await supabase.from('profiles').select('*')

            if (tasksData) setTasks(tasksData)
            if (logsData) setLogs(logsData)
            if (profilesData) setProfiles(profilesData)

            // Récupérer la configuration de notification de l'utilisateur actif
            if (currentUserId) {
                const { data: subData } = await supabase
                    .from('push_subscriptions')
                    .select('is_enabled, reminder_time')
                    .eq('profile_id', currentUserId)
                    .maybeSingle()

                if (subData) {
                    setIsNotificationEnabled(subData.is_enabled)
                    // Formatage '08:00:00' -> '08:00' pour le champ HTML select
                    setReminderTime(subData.reminder_time ? subData.reminder_time.substring(0, 5) : '08:00')
                }
            }
        }
        fetchData()
    }, [refreshKey, currentUserId])

    const activeProfile = profiles.find(p => p.id === currentUserId)
    const currentUser = activeProfile ? activeProfile.name : "Invité"

    // 2. CALCULS DES POINTS POUR LE CLASSEMENT
    const leaderboard = profiles.map(profile => {
        const userLogs = logs.filter(log => log.done_by === profile.id)
        const points = userLogs.reduce((sum, log) => {
            const matchingTask = tasks.find(t => t.id === log.task_id)
            return sum + (matchingTask?.points || 0)
        }, 0)

        return {
            ...profile,
            points,
            tasksCount: userLogs.length
        }
    }).sort((a, b) => b.points - a.points)

    const myPoints = leaderboard.find(p => p.id === currentUserId)?.points || 0
    const totalTasksCount = tasks.length
    const completedLogsCount = logs.length

    // Actions Supabase
    async function addTaskAction(formData) {
        const title = formData.get('title')
        const description = formData.get('description')
        const pointsStr = formData.get('points')
        const frequencyStr = formData.get('frequency_days')

        if (!title) return

        const { error } = await supabase
            .from('tasks')
            .insert([
                {
                    title: title,
                    description: description || null,
                    points: parseInt(pointsStr, 10) || 10,
                    frequency_days: parseInt(frequencyStr, 10) || 7
                }
            ])

        if (!error) setRefreshKey(old => old + 1)
    }

    async function completeTaskAction(taskId) {
        if (!currentUserId) return

        const { error } = await supabase
            .from('task_logs')
            .insert([
                {
                    task_id: taskId,
                    done_by: currentUserId,
                    done_at: new Date().toISOString()
                }
            ])

        if (!error) setRefreshKey(old => old + 1)
    }

    return (
        <ProfileSelector profiles={profiles} onUserChange={setCurrentUserId}>
            <div className="flex justify-center bg-gray-100 min-h-screen">
                <div className="flex flex-col justify-between bg-white w-full max-w-md min-h-screen shadow-xl">

                    {/* EN-TÊTE DYNAMIQUE */}
                    <header className="bg-indigo-600 p-4 text-white rounded-b-2xl shadow-md shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold">🏠 Tâches de la Maison</h1>
                                <p className="text-indigo-200 text-xs">Tableau de bord de : <span className="font-bold underline">{currentUser}</span></p>
                            </div>
                            <div className="bg-indigo-500 px-3 py-1 rounded-full text-sm font-semibold">
                                🏆 {myPoints} pts
                            </div>
                        </div>
                    </header>

                    {/* CONTENU CENTRAL */}
                    <main className="flex-1 p-4 space-y-4 overflow-y-auto">

                        {/* Onglet 1 : LISTE DES TÂCHES */}
                        {currentTab === 'tasks' && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                                        <span className="block text-2xl">⏳</span>
                                        <span className="block text-xs text-gray-500 font-medium mt-1">Configuration</span>
                                        <span className="text-base font-bold text-amber-700">{totalTasksCount} tâches</span>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                                        <span className="block text-2xl">✅</span>
                                        <span className="block text-xs text-gray-500 font-medium mt-1">Total exécuté</span>
                                        <span className="text-base font-bold text-green-700">{completedLogsCount} fois</span>
                                    </div>
                                </div>

                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Les tâches de la maison</h2>

                                <div className="space-y-3">
                                    {tasks.map((task) => {
                                        const taskLogs = logs.filter(l => l.task_id === task.id)
                                        const sortedLogs = [...taskLogs].sort((a, b) => {
                                            const timeA = a.done_at ? new Date(a.done_at).getTime() : 0
                                            const timeB = b.done_at ? new Date(b.done_at).getTime() : 0
                                            return timeB - timeA
                                        })
                                        const lastLog = sortedLogs[0] || null

                                        return (
                                            <TaskRow
                                                key={task.id}
                                                task={task}
                                                lastLog={lastLog}
                                                completeTaskAction={completeTaskAction}
                                            />
                                        )
                                    })}
                                </div>

                                <TaskModal addTaskAction={addTaskAction} />
                            </>
                        )}

                        {/* Onglet 2 : CLASSEMENT */}
                        {currentTab === 'leaderboard' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Classement général</h2>

                                <div className="space-y-3">
                                    {leaderboard.map((user, index) => {
                                        const isFirst = index === 0
                                        return (
                                            <div
                                                key={user.id}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFirst
                                                    ? 'bg-amber-50/60 border-amber-200 ring-2 ring-amber-100'
                                                    : 'bg-gray-50 border-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-2xl w-8 text-center">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-base">{user.name}</p>
                                                        <p className="text-xs text-gray-400">{user.tasksCount} corvées réalisées</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-base font-black px-3 py-1 rounded-xl ${isFirst ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {user.points} pts
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* FIL D'ACTUALITÉ */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dernières activités</h3>
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 divide-y divide-gray-200/60 max-h-64 overflow-y-auto">
                                        {logs.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">Aucune activité enregistrée pour le moment.</p>
                                        ) : (
                                            logs.map((log) => {
                                                const matchingTask = tasks.find(t => t.id === log.task_id)
                                                const formattedDate = new Date(log.done_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })

                                                return (
                                                    <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                                                        <div className="min-w-0 pr-2">
                                                            <p className="text-gray-700 font-medium truncate">
                                                                <span className="font-bold text-indigo-600">{log.profiles?.name}</span> a fait <span className="font-semibold text-gray-800">"{matchingTask?.title || 'Une corvée'}"</span>
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">{formattedDate}</p>
                                                        </div>
                                                        <span className="font-bold text-emerald-600 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                            +{matchingTask?.points || 0}
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ⚙️ Onglet 3 : NOUVEAU PARAMÈTRES DU PROFIL */}
                        {currentTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Mon Profil & Rappels</h2>

                                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">👤</span>
                                        <div>
                                            <p className="font-bold text-gray-800 text-base">{currentUser}</p>
                                            <p className="text-[10px] text-gray-400 font-mono select-all">ID: {currentUserId}</p>
                                        </div>
                                    </div>

                                    <hr className="border-gray-200" />

                                    {/* Réglage des notifications */}
                                    <div className="space-y-4">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="pr-2">
                                                <p className="text-sm font-semibold text-gray-700">Rappel automatique du jour</p>
                                                <p className="text-[11px] text-gray-400">Recevoir le récapitulatif des tâches en retard</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isNotificationEnabled}
                                                onChange={async (e) => {
                                                    setIsNotificationEnabled(e.target.checked)
                                                    await supabase
                                                        .from('push_subscriptions')
                                                        .update({ is_enabled: e.target.checked })
                                                        .eq('profile_id', currentUserId);
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                        </label>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs font-medium text-gray-600">Heure du rappel :</span>
                                            <select
                                                value={reminderTime}
                                                onChange={async (e) => {
                                                    setReminderTime(e.target.value)
                                                    await supabase
                                                        .from('push_subscriptions')
                                                        .update({ reminder_time: e.target.value + ':00' })
                                                        .eq('profile_id', currentUserId);
                                                }}
                                                className="text-xs bg-white border border-gray-200 rounded-lg p-1.5 font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="07:00">Le matin (07:00)</option>
                                                <option value="08:00">Le matin (08:00)</option>
                                                <option value="12:00">Le midi (12:00)</option>
                                                <option value="13:00">Le midi (13:00)</option>
                                                <option value="19:00">Le soir (19:00)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { localStorage.removeItem('house_user_id'); window.location.reload(); }}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-xl text-xs transition-colors border border-red-100"
                                >
                                    Changer de profil / Déconnexion
                                </button>
                            </div>
                        )}

                    </main>

                    {/* NAVIGATION BASSE INTERACTIVE */}
                    <nav className="border-t border-gray-100 p-3 bg-white grid grid-cols-3 text-center text-xs font-medium text-gray-400 shrink-0">
                        <button
                            onClick={() => setCurrentTab('tasks')}
                            className={`flex flex-col items-center space-y-1 transition-colors ${currentTab === 'tasks' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600'}`}
                        >
                            <span className="text-xl">📋</span>
                            <span>Tâches</span>
                        </button>

                        <button
                            onClick={() => setCurrentTab('leaderboard')}
                            className={`flex flex-col items-center space-y-1 transition-colors ${currentTab === 'leaderboard' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600'}`}
                        >
                            <span className="text-xl">📊</span>
                            <span>Classement</span>
                        </button>

                        <button
                            onClick={() => setCurrentTab('profile')}
                            className={`flex flex-col items-center space-y-1 transition-colors ${currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600'}`}
                        >
                            <span className="text-xl">⚙️</span>
                            <span>Profil</span>
                        </button>
                    </nav>

                </div>
            </div>
        </ProfileSelector>
    )
}