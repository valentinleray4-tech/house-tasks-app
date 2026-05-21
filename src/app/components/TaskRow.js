'use client'

import { useState, useTransition } from 'react'

export default function TaskRow({ task, lastLog, completeTaskAction }) {
    const [isPending, startTransition] = useTransition()
    const [startX, setStartX] = useState(0)
    const [currentX, setCurrentX] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)

    // --- CALCUL DE L'ÉTAT DU RETARD (VERT / ORANGE / ROUGE) ---
    // On passe par des codes couleur HEX bruts pour contourner le problème de compilation Tailwind
    let colorHex = "#10b981" // Vert émeraude par défaut
    let statusText = "À jour"
    let shouldPulse = false

    if (lastLog && lastLog.done_at) {
        const lastDoneDate = new Date(lastLog.done_at)
        const today = new Date()
        const diffTime = Math.abs(today - lastDoneDate)
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        const ratio = diffDays / task.frequency_days

        if (ratio >= 1) {
            colorHex = "#f43f5e" // Rose / Rouge en retard
            statusText = "En retard"
            shouldPulse = true
        } else if (ratio >= 0.75) {
            colorHex = "#f59e0b" // Ambre / Orange bientôt
            statusText = "Bientôt à refaire"
        } else {
            colorHex = "#10b981" // Vert OK
            statusText = "À jour"
        }
    } else {
        // Si la tâche n'a jamais été faite
        colorHex = "#f43f5e"
        statusText = "Jamais fait"
    }

    // --- GESTION DU SWIPE ---
    const handleTouchStart = (e) => {
        if (isPending) return
        setStartX(e.touches[0].clientX)
        setIsSwiping(true)
    }

    const handleTouchMove = (e) => {
        if (!isSwiping) return
        const moveX = e.touches[0].clientX - startX
        if (moveX > 0) setCurrentX(moveX)
    }

    const handleTouchEnd = () => {
        setIsSwiping(false)
        if (currentX > 140) {
            setCurrentX(300)
            startTransition(async () => {
                await completeTaskAction(task.id)
                setCurrentX(0)
            })
        } else {
            setCurrentX(0)
        }
    }

    // --- FORMATTAGE DE LA DATE ---
    const formattedDate = lastLog?.done_at
        ? new Date(lastLog.done_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null

    return (
        <div className="relative overflow-hidden rounded-xl bg-gray-100 h-[76px] select-none shadow-sm">

            {/* Fond vert au swipe */}
            <div
                className="absolute inset-0 bg-emerald-600 flex items-center pl-4 text-white font-bold text-sm transition-opacity"
                style={{ opacity: currentX > 20 ? 1 : 0 }}
            >
                <span>✅ Glisser pour valider...</span>
            </div>

            {/* Carte principale */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`absolute inset-0 bg-white border border-gray-100 p-3 flex items-center justify-between min-h-full ${isSwiping ? '' : 'transition-transform duration-200'
                    } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
                style={{ transform: `translateX(${currentX}px)` }}
            >
                <div className="flex items-center space-x-3 flex-1 min-w-0">

                    {/* 🌟 LA BALISE MÉTÉO SÉCURISÉE AVEC INLINE STYLE */}
                    <div
                        className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-all duration-300 ${shouldPulse ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: colorHex }}
                        title={statusText}
                    />

                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400 font-normal truncate">
                            {task.description || 'Pas de description'}
                        </p>

                        {lastLog && (
                            <p className="text-[10px] text-gray-500 font-normal mt-0.5 flex items-center space-x-1 truncate">
                                <span>✅ Fait par : <strong className="font-semibold text-gray-700">{lastLog.profiles?.name}</strong></span>
                                <span className="text-gray-400 text-[9px]">({formattedDate})</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Droite : Points & Fréquence */}
                <div className="text-right flex flex-col items-end justify-center shrink-0 ml-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-0.5">
                        +{task.points} pts
                    </span>
                    <span className="text-[10px] text-gray-400">
                        Chaque {task.frequency_days}j
                    </span>
                </div>

            </div>
        </div>
    )
}