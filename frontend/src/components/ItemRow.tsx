import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MenuItemResponse } from '@/types/restaurant'

function Stars({ rating }: { rating: number }) {
    const rounded = Math.round(rating)
    return (
        <span className="text-yellow-400 text-xs leading-none">
            {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
        </span>
    )
}

const ItemRow = memo(function ItemRow({ item }: { item: MenuItemResponse }) {
    const navigate = useNavigate()

    return (
        <div
            className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 rounded px-1 -mx-1 transition-colors"
            onClick={() => navigate(`/owner/item/${item.id}`, { state: { item } })}
        >
            <div className="flex-1 min-w-0">
                <span className={`text-sm ${!item.available ? 'text-muted-foreground line-through' : ''}`}>
                    {item.name}
                </span>
                {item.description && (
                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{item.description}</span>
                )}
                {item.averageRating != null && (
                    <span className="inline-flex items-center gap-1 ml-2">
                        <Stars rating={item.averageRating} />
                        <span className="text-xs text-muted-foreground">
                            {item.averageRating.toFixed(1)}
                            {item.reviewCount != null && ` (${item.reviewCount})`}
                        </span>
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-sm text-muted-foreground">€{item.price}</span>
                <span className="text-muted-foreground text-xs">▸</span>
            </div>
        </div>
    )
})

export default ItemRow
