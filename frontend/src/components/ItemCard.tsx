import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import StarRating from '@/components/StarRating'
import type { MenuItemResponse } from '@/types/restaurant'

interface ItemCardProps {
    item: MenuItemResponse
    restaurantName: string
}

export default function ItemCard({ item, restaurantName }: ItemCardProps) {
    const navigate = useNavigate()

    return (
        <button
            className="text-left w-full focus:outline-none"
            onClick={() => navigate(`/item/${item.id}`, { state: { item, restaurantName } })}
        >
            <Card className={`transition-opacity hover:shadow-md cursor-pointer ${!item.available ? 'opacity-50' : ''}`}>
                {item.imageUrl && (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-36 object-cover rounded-t-xl"
                    />
                )}
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-medium leading-tight">{item.name}</CardTitle>
                        <span className="text-sm font-semibold shrink-0">€{item.price}</span>
                    </div>
                    <CardDescription className="text-xs">{restaurantName}</CardDescription>
                    {item.averageRating != null && item.reviewCount != null && item.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <StarRating value={item.averageRating} showValue />
                            <span className="text-xs text-muted-foreground">({item.reviewCount})</span>
                        </div>
                    )}
                </CardHeader>
            </Card>
        </button>
    )
}
