"use client"

interface HealthScoreProps {
    score: number
}

export function HealthScore({ score }: HealthScoreProps) {
    const getColor = (score: number) => {
        if (score >= 80) return "text-green-400"
        if (score >= 60) return "text-yellow-400"
        return "text-red-400"
    }

    const getBackgroundColor = (score: number) => {
        if (score >= 80) return "bg-green-900/20"
        if (score >= 60) return "bg-yellow-900/20"
        return "bg-red-900/20"
    }

    return (
        <div className={`p-3 rounded-lg ${getBackgroundColor(score)}`}>
            <p className="text-xs text-muted-foreground mb-2">Puntuación de Salud</p>
            <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
                <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}
