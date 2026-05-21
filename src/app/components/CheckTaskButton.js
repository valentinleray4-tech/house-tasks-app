'use client'

import { useTransition } from 'react'

export default function CheckTaskButton({ taskId, isDone, completeTaskAction }) {
    const [isPending, startTransition] = useTransition()

    return (
        <button
            disabled={isPending}
            onClick={(e) => {
                e.stopPropagation()
                startTransition(async () => {
                    await completeTaskAction(taskId)
                })
            }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 shadow-sm ${isPending
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-100'
                        : 'border-gray-300 bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'
                }`}
        >
            {isDone && !isPending && (
                <svg className="w-4 h-4 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
            {isPending && (
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
        </button>
    )
}