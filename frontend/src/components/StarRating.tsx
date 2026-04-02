import { useState } from 'react'

interface StarRatingProps {
    value: number
    interactive?: false
    showValue?: boolean
    size?: 'sm' | 'md'
}

interface InteractiveStarRatingProps {
    value: number
    interactive: true
    onChange: (rating: number) => void
    size?: 'sm' | 'md'
}

type Props = StarRatingProps | InteractiveStarRatingProps

export default function StarRating(props: Props) {
    const { value, size = 'sm' } = props
    const [hovered, setHovered] = useState(0)

    const starSize = size === 'sm' ? 'text-sm' : 'text-lg'

    if (!props.interactive) {
        return (
            <span className={`inline-flex items-center gap-0.5 ${starSize}`}>
                {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={n <= Math.round(value) ? 'text-yellow-400' : 'text-muted-foreground/30'}>
                        ★
                    </span>
                ))}
                {props.showValue && value > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
                )}
            </span>
        )
    }

    const active = hovered || value

    return (
        <span className={`inline-flex items-center gap-0.5 ${starSize}`}>
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    className={`transition-colors ${n <= active ? 'text-yellow-400' : 'text-muted-foreground/30'} hover:text-yellow-400`}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => props.onChange(n)}
                >
                    ★
                </button>
            ))}
        </span>
    )
}
