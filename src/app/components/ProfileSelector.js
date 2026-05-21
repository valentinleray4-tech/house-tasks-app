'use client'

import { useState, useEffect } from 'react'

export default function ProfileSelector({ profiles, children, onUserChange }) {
    const [activeUser, setActiveUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Au chargement, on regarde si le téléphone se rappelle de qui on est
    useEffect(() => {
        const savedUserId = localStorage.getItem('house_user_id')
        if (savedUserId) {
            setActiveUser(savedUserId)
            onUserChange(savedUserId)
        }
        setLoading(false)
    }, [onUserChange])

    // Fonction quand on clique sur son prénom
    const handleSelectProfile = (userId) => {
        localStorage.setItem('house_user_id', userId)
        setActiveUser(userId)
        onUserChange(userId)
    }

    // Fonction pour se déconnecter (optionnelle, utilisable dans les réglages)
    const handleLogout = () => {
        localStorage.removeItem('house_user_id')
        setActiveUser(null)
        onUserChange(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Si aucun utilisateur n'est enregistré, on affiche l'écran de sélection
    if (!activeUser) {
        return (
            <div className="flex justify-center bg-gray-100 min-h-screen">
                <div className="flex flex-col justify-center items-center bg-white w-full max-w-md min-h-screen p-6 shadow-xl space-y-8">
                    <div className="text-center space-y-2">
                        <span className="text-5xl">🏠</span>
                        <h1 className="text-2xl font-bold text-gray-800">Qui êtes-vous ?</h1>
                        <p className="text-sm text-gray-400">Sélectionnez votre profil pour accéder aux tâches</p>
                    </div>

                    <div className="w-full space-y-4">
                        {profiles?.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => handleSelectProfile(profile.id)}
                                className="w-full bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-semibold py-4 px-6 rounded-2xl shadow-sm text-base transition-all flex items-center justify-between"
                            >
                                <span>{profile.name === 'Valentin' ? '🙋‍♂️' : '🙋‍♀️'} {profile.name}</span>
                                <span className="text-gray-300">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Si on est connecté, on affiche normalement l'application (le contenu enfant)
    return (
        <>
            {children}
        </>
    )
}