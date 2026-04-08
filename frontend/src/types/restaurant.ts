export type MealTime = 'MORNING' | 'LUNCH' | 'DINNER'

export const MEAL_TIME_LABELS: Record<MealTime, string> = {
    MORNING: 'Breakfast',
    LUNCH:   'Lunch',
    DINNER:  'Dinner',
}

export const MEAL_TIMES: MealTime[] = ['MORNING', 'LUNCH', 'DINNER']

export type SectionCategory =
    | 'STARTER'
    | 'FIRST_COURSE'
    | 'MAIN_COURSE'
    | 'SIDE_DISH'
    | 'DESSERT'
    | 'DRINK'
    | 'OTHER'

export const SECTION_CATEGORIES: SectionCategory[] = [
    'STARTER', 'FIRST_COURSE', 'MAIN_COURSE', 'SIDE_DISH', 'DESSERT', 'DRINK', 'OTHER',
]

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
    STARTER:      'Starters',
    FIRST_COURSE: 'First courses',
    MAIN_COURSE:  'Main courses',
    SIDE_DISH:    'Side dishes',
    DESSERT:      'Desserts',
    DRINK:        'Drinks',
    OTHER:        'Other',
}

export interface ItemDraft {
    name: string
    description: string
    price: string
    available: boolean
}

export interface MenuItemForm {
    name: string
    description: string
    price: string
}

export interface MenuSectionForm {
    name: string
    category: SectionCategory
    items: MenuItemForm[]
}

export interface RestaurantFormData {
    name: string
    description: string
    address: string
    city: string
    sections: MenuSectionForm[]
}

export interface RestaurantResponse {
    id: number
    name: string
    description: string
    address: string
    city: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    createdAt: string
    user: { id: string; email: string; firstName: string; lastName: string }
}

export interface ReviewUserDto {
    id: string
    firstName: string
    lastName: string
}

export interface ReviewResponse {
    id: number
    rating: number
    comment: string | null
    imageUrl: string | null
    createdAt: string
    user: ReviewUserDto
    trustCount: number
    untrustCount: number
    currentUserVote: 'TRUST' | 'UNTRUST' | null
    mealTime: MealTime | null
    itemName: string
    restaurantName: string
    anonymous: boolean
    publicReview: boolean
}

export interface MenuItemResponse {
    id: number
    name: string
    description: string
    price: number
    available: boolean
    imageUrl?: string | null
    averageRating?: number | null
    reviewCount?: number
    sourceReviewId?: number | null
    restaurantId?: number | null
}

export interface MenuSectionResponse {
    id: number
    name: string
    category: SectionCategory | null
    items: MenuItemResponse[]
}

export interface RestaurantWithMenu extends RestaurantResponse {
    sections: MenuSectionResponse[]
}