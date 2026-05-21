'use client'

import { useState, useTransition } from 'react'
import { supabase } from '../lib/supabase'

export default function TaskRow({ task, lastLog, completeTaskAction }) {
    const [isPending, startTransition] = useTransition()
    const [currentX, setCurrentX] = useState(0)

    // Logique de couleur (identique)
    let colorHex = "#10b981"
    if (lastLog?.done_at) {
        const diffDays = Math.abs(new Date() - new Date(lastLog.done_at)) / (1000 * 60 * 60 * 24)
        const ratio = diffDays / task.frequency_days
        colorHex = ratio >= 1 ? "#f43f5e" : ratio >= 0.75 ? "#f59e0b" : "#10b981"
    } else { colorHex = "#f43f5e" }

    // Suppression via bouton
    async function deleteTask() {
        if (!confirm("Supprimer cette tâche définitivement ?")) return;
        await supabase.from('tasks').delete().eq('id', task.id);
        window.location.reload(); 
    }

    // Gestion simplifiée du Swipe uniquement pour VALIDER
    const handleTouchStart = (e) => setCurrentX(e.touches[0].clientX)
    const handleTouchMove = (e) => {
        const moveX = e.touches[0].clientX - currentX
        if (moveX > 0) setCurrentX(moveX) 
    }
    const handleTouchEnd = () => {
        if (currentX > 100) { // Si on a assez swipé vers la droite
            startTransition(async () => await completeTaskAction(task.id))
        }
        setCurrentX(0)
    }

    return (
        <div className="flex items-center gap-2">
            {/* 1. La Carte avec Swipe pour Valider */}
            <div 
                className="relative flex-1 bg-white border border-gray-100 p-4 rounded-xl shadow-sm overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }} />
                    <div>
                        <p className="font-bold text-sm text-gray-800">{task.title}</p>
                        <p className="text-[10px] text-gray-400">{task.description}</p>
                    </div>
                </div>
            </div>

            {/* 2. Le Bouton Poubelle FIXE à côté */}
            <button 
                onClick={deleteTask}
                className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"
            >
                🗑️
            </button>
        </div>
    )
}
