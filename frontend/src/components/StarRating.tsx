import { useState } from 'react'

interface StarRatingProps {
    value: number
    interactive?: false
    size?: 'sm' | 'md'
}

interface InteractiveStarRatingProps {
    value: number
    interactive: true
    onChange: (rating: number) => void
    size?: 'sm' | 'md'
}

type Props = StarRatingProps | InteractiveStarRatingProps

function StarIcon({ fill, size }: { fill: 'full' | 'half' | 'empty'; size: string }) {
    if (fill === 'full') return <span className={`${size} text-yellow-400`}>★</span>
    if (fill === 'empty') return <span className={`${size} text-muted-foreground/30`}>★</span>
    return (
        <span className={`${size} relative inline-block`}>
            <span className="text-muted-foreground/30">★</span>
            <span
                className="absolute top-0 left-0 block overflow-hidden whitespace-nowrap text-yellow-400"
                style={{ width: '50%' }}
            >★</span>
        </span>
    )
}

function getFill(n: number, val: number): 'full' | 'half' | 'empty' {
    if (val >= n) return 'full'
    if (val >= n - 0.5) return 'half'
    return 'empty'
}

export default function StarRating(props: Props) {
    const { value, size = 'sm' } = props
    const [hovered, setHovered] = useState(0)

    const starSize = size === 'sm' ? 'text-sm' : 'text-lg'

    if (!props.interactive) {
        return (
            <span className={`inline-flex items-center gap-0.5 ${starSize}`}>
                {[1, 2, 3, 4, 5].map(n => (
                    <StarIcon key={n} fill={getFill(n, value)} size={starSize} />
                ))}
                {value > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">{value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}</span>
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
                    className="relative transition-colors"
                    onMouseMove={e => {
                        const { left, width } = e.currentTarget.getBoundingClientRect()
                        setHovered(e.clientX < left + width / 2 ? n - 0.5 : n)
                    }}
                    onMouseLeave={() => setHovered(0)}
                    onClick={e => {
                        const { left, width } = e.currentTarget.getBoundingClientRect()
                        props.onChange(e.clientX < left + width / 2 ? n - 0.5 : n)
                    }}
                >
                    <StarIcon fill={getFill(n, active)} size={starSize} />
                </button>
            ))}
            {active > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">{active % 1 === 0 ? active.toFixed(0) : active.toFixed(1)}</span>
            )}
        </span>
    )
}
