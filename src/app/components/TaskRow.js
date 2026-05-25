'use client'

import { useState, useTransition } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskRow({ task, lastLog, completeTaskAction }) {
    const [isPending, startTransition] = useTransition()

    // 🧠 On sépare le point de départ de la distance parcourue
    const [startX, setStartX] = useState(0)
    const [swipeX, setSwipeX] = useState(0)

    // Calcul de la date formatée
    const formattedDate = lastLog?.done_at
        ? new Date(lastLog.done_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : null

    // Logique de couleur
    let colorHex = "#10b981"
    if (lastLog?.done_at) {
        const diffDays = Math.abs(new Date() - new Date(lastLog.done_at)) / (1000 * 60 * 60 * 24)
        const ratio = diffDays / task.frequency_days
        colorHex = ratio >= 1 ? "#f43f5e" : ratio >= 0.75 ? "#f59e0b" : "#10b981"
    } else { colorHex = "#f43f5e" }

    async function deleteTask() {
        if (!confirm("Supprimer cette tâche définitivement ?")) return;
        await supabase.from('tasks').delete().eq('id', task.id);
        window.location.reload();
    }

    // Gestion du swipe corrigée
    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX)
        setSwipeX(0) // On réinitialise la distance au départ
    }

    const handleTouchMove = (e) => {
        const currentX = e.touches[0].clientX
        const diffX = currentX - startX
        if (diffX > 0) {
            setSwipeX(diffX) // Stocke uniquement la distance du glissement vers la droite
        }
    }

    const handleTouchEnd = () => {
        // Se valide uniquement si le mouvement réel a dépassé 100 pixels
        if (swipeX > 100) {
            startTransition(async () => await completeTaskAction(task.id))
        }
        // Réinitialisation des états
        setStartX(0)
        setSwipeX(0)
    }

    return (
        <div className="flex items-center gap-2">
            {/* Carte avec Swipe pour valider */}
            <div
                className="relative flex-1 bg-white border border-gray-100 p-3 rounded-xl shadow-sm overflow-hidden transition-transform duration-75"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                // Optionnel : ce style translate permet de voir visuellement la carte glisser sous le doigt !
                style={{ transform: swipeX > 0 ? `translateX(${Math.min(swipeX, 150)}px)` : 'none' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
                    <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{task.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{task.description || 'Pas de description'}</p>

                        {/* 🌟 ICI : On réaffiche le "Fait par" et la date */}
                        {lastLog && (
                            <p className="text-[9px] text-gray-500 mt-1 truncate">
                                ✅ Fait par : <strong className="text-gray-700">{lastLog.profiles?.name}</strong>
                                <span className="text-gray-400 ml-1">({formattedDate})</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bouton Poubelle Fixe */}
            <button
                onClick={deleteTask}
                className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
            >
                🗑️
            </button>
        </div>
    )
}