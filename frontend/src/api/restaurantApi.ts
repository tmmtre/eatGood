import api from './axios'
import type { MealTime, MenuItemResponse, MenuSectionResponse, RestaurantResponse, RestaurantWithMenu, ReviewResponse, SectionCategory } from '../types/restaurant'

export const getRestaurant = async (id: number): Promise<RestaurantResponse> => {
    const res = await api.get<RestaurantResponse>(`/restaurants/${id}`)
    return res.data
}

export const createRestaurant = async (
    userId: string,
    data: { name: string; description: string; address: string; city: string }
): Promise<RestaurantResponse> => {
    const res = await api.post<RestaurantResponse>(`/restaurants/user/${userId}`, data)
    return res.data
}

export const getPendingRestaurants = async (): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>('/restaurants/admin/pending')
    return res.data
}

export const getAllRestaurants = async (): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>('/restaurants/admin/all')
    return res.data
}

export const approveRestaurant = async (id: number): Promise<RestaurantResponse> => {
    const res = await api.put<RestaurantResponse>(`/restaurants/admin/${id}/approve`)
    return res.data
}

export const rejectRestaurant = async (id: number): Promise<RestaurantResponse> => {
    const res = await api.put<RestaurantResponse>(`/restaurants/admin/${id}/reject`)
    return res.data
}

export const getMyRestaurants = async (userId: string): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>(`/restaurants/user/${userId}`)
    return res.data
}

export const getAllApprovedRestaurantsWithMenu = async (): Promise<RestaurantWithMenu[]> => {
    const { data: restaurants } = await api.get<RestaurantResponse[]>('/restaurants/approved')

    return await Promise.all(
        restaurants.map(async restaurant => {
            try {
                const {data: sections} = await api.get<MenuSectionResponse[]>(
                    `/sections/restaurant/${restaurant.id}`
                )
                return {...restaurant, sections}
            } catch {
                return {...restaurant, sections: []}
            }
        })
    )
}

export const getMenuItem = async (id: number): Promise<MenuItemResponse> => {
    const res = await api.get<MenuItemResponse>(`/items/${id}`)
    return res.data
}

export const getSectionsByRestaurant = async (restaurantId: number): Promise<MenuSectionResponse[]> => {
    const res = await api.get<MenuSectionResponse[]>(`/sections/restaurant/${restaurantId}`)
    return res.data
}

export const createMenuSection = async (restaurantId: number, name: string, category: SectionCategory): Promise<MenuSectionResponse> => {
    const res = await api.post<MenuSectionResponse>(`/sections/restaurant/${restaurantId}`, { name, category })
    return res.data
}

export const updateMenuSection = async (id: number, name: string, category: SectionCategory): Promise<MenuSectionResponse> => {
    const res = await api.put<MenuSectionResponse>(`/sections/${id}`, { name, category })
    return res.data
}

export const deleteMenuSection = async (id: number): Promise<void> => {
    await api.delete(`/sections/${id}`)
}

const buildItemFormData = (
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): FormData => {
    const formData = new FormData()
    formData.append('item', new Blob([JSON.stringify(item)], { type: 'application/json' }))
    if (image) formData.append('image', image)
    return formData
}

export const createMenuItem = async (
    sectionId: number,
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): Promise<void> => {
    await api.post(`/items/section/${sectionId}`, buildItemFormData(item, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const updateMenuItem = async (
    id: number,
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): Promise<void> => {
    await api.put(`/items/${id}`, buildItemFormData(item, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const deleteMenuItem = async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`)
}

export const setItemImageFromReview = async (itemId: number, reviewId: number): Promise<MenuItemResponse> => {
    const res = await api.put<MenuItemResponse>(`/items/${itemId}/image-from-review/${reviewId}`)
    return res.data
}

export const getReviewsByItem = async (menuItemId: number): Promise<ReviewResponse[]> => {
    const res = await api.get<ReviewResponse[]>(`/reviews/item/${menuItemId}`)
    return res.data
}

export const createReview = async (
    menuItemId: number,
    data: { rating: number; comment: string; mealTime: MealTime | null; anonymous: boolean; publicReview?: boolean },
    image?: File
): Promise<ReviewResponse> => {
    const formData = new FormData()
    formData.append('review', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (image) formData.append('image', image)
    const res = await api.post<ReviewResponse>(`/reviews/item/${menuItemId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
}

export const getMyReviews = async (): Promise<ReviewResponse[]> => {
    const res = await api.get<ReviewResponse[]>('/reviews/my')
    return res.data
}

export const deleteReview = async (reviewId: number): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`)
}

export const publishReview = async (reviewId: number): Promise<ReviewResponse> => {
    const res = await api.put<ReviewResponse>(`/reviews/${reviewId}/publish`)
    return res.data
}

export const voteReview = async (reviewId: number, trusted: boolean): Promise<ReviewResponse> => {
    const res = await api.post<ReviewResponse>(`/reviews/${reviewId}/vote`, null, { params: { trusted } })
    return res.data
}
