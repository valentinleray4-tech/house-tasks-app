'use client'

import { useState } from 'react'

export default function TaskModal({ addTaskAction }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="px-4 pb-4">
            {/* 🌟 LE BOUTON REFAIT À NEUF (Style Maquette Originale) */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md text-sm transition-colors flex items-center justify-center space-x-2"
            >
                <span>➕</span>
                <span>Ajouter une tâche</span>
            </button>

            {/* 🌟 LA VRAIE FENÊTRE SURGISSANTE (MODALE) */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">

                        {/* En-tête de la modale */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
                                <span>✨</span> <span>Nouvelle Corvée</span>
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-medium transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulaire complet */}
                        <form action={async (formData) => {
                            await addTaskAction(formData);
                            setIsOpen(false); // Ferme automatiquement la fenêtre après l'ajout
                        }} className="space-y-3">

                            {/* Champ Titre */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Titre de la tâche *</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Ex: Nettoyer les vitres..."
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>

                            {/* Champ Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description / Consignes</label>
                                <textarea
                                    name="description"
                                    placeholder="Ex: Utiliser le chiffon microfibre..."
                                    rows="2"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Champ Points */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Points</label>
                                    {/* 🌟 On met defaultValue="10" ici sur le select, et on vire le "selected" de l'option */}
                                    <select
                                        name="points"
                                        defaultValue="10"
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 h-[38px]"
                                    >
                                        <option value="5">5 pts (Facile)</option>
                                        <option value="10">10 pts (Moyen)</option>
                                        <option value="15">15 pts (Intense)</option>
                                        <option value="20">20 pts (Héroïque)</option>
                                    </select>
                                </div>

                                {/* Champ Fréquence */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tous les (jours)</label>
                                    <input
                                        type="number"
                                        name="frequency_days"
                                        defaultValue="7"
                                        min="1"
                                        required
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 h-[38px]"
                                    />
                                </div>
                            </div>

                            {/* Boutons d'action inférieurs */}
                            <div className="flex space-x-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-sm transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors shadow-sm"
                                >
                                    Enregistrer
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}