import api from './client';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types';

export async function getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories/');
    return data;
}

export async function createCategory(payload: CategoryCreate): Promise<Category> {
    const { data } = await api.post<Category>('/categories/', payload);
    return data;
}

export async function updateCategory(id: number, payload: CategoryUpdate): Promise<Category> {
    const { data } = await api.patch<Category>(`/categories/${id}`, payload);
    return data;
}

export async function deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
}
