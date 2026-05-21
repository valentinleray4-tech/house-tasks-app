'use client'

import { useState, useTransition } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskRow({ task, lastLog, completeTaskAction }) {
    const [isPending, startTransition] = useTransition()
    const [startX, setStartX] = useState(0)
    const [currentX, setCurrentX] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)

    // --- GESTION DU SWIPE (Remise en place) ---
    const handleTouchStart = (e) => {
        if (isPending) return
        setStartX(e.touches[0].clientX)
        setIsSwiping(true)
    }

    const handleTouchMove = (e) => {
        if (!isSwiping) return
        const moveX = e.touches[0].clientX - startX
        if (moveX > 0) setCurrentX(moveX) // Swipe vers la droite pour valider
        else if (moveX < -50) setCurrentX(moveX) // Swipe vers la gauche pour découvrir le bouton supprimer
    }

    const handleTouchEnd = () => {
        setIsSwiping(false)
        if (currentX > 140) {
            startTransition(async () => {
                await completeTaskAction(task.id)
                setCurrentX(0)
            })
        } else {
            setCurrentX(0)
        }
    }

    // ... ton code de couleur et ton JSX restent identiques
    // Logique de couleur... (ton code actuel est parfait)
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

    // ... (garde tes fonctions handleTouchStart/Move/End inchangées)

    return (
        <div className="relative overflow-hidden rounded-xl bg-red-500 h-[76px] shadow-sm flex items-center justify-end pr-4">
            {/* Bouton Poubelle caché derrière */}
            <button onClick={deleteTask} className="text-white font-bold px-4">
                🗑️ Supprimer
            </button>

            {/* Carte principale */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="absolute inset-0 bg-white border border-gray-100 p-3 flex items-center justify-between transition-transform duration-200"
                style={{ transform: `translateX(${currentX}px)` }}
            >
                {/* Contenu de la tâche (ton code actuel) */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorHex }} />
                    <div>
                        <p className="font-bold text-sm text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.description}</p>
                    </div>
                </div>
                {/* ... le reste de ton JSX ... */}
            </div>
        </div>
    )
}
