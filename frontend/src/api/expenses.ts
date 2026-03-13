import api from './client';
import type { ExpenseCreate, ExpenseUpdate, Expense, ExpenseFilters, ExpenseListResponse } from '@/types';

export async function getExpenses(filters: ExpenseFilters): Promise<ExpenseListResponse> {
    const params: Record<string, string | number> = {};

    if (filters.cursor) params.cursor = filters.cursor;
    if (filters.limit) params.limit = filters.limit;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.amount_from) params.amount_from = filters.amount_from;
    if (filters.amount_to) params.amount_to = filters.amount_to;
    if (filters.search) params.search = filters.search;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;

    const { data } = await api.get<ExpenseListResponse>('/expenses/', { params });
    return data;
}

export async function getExpense(id: number): Promise<Expense> {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return data;
}

export async function createExpense(payload: ExpenseCreate): Promise<Expense> {
    const { data } = await api.post<Expense>('/expenses/', payload);
    return data;
}

export async function updateExpense(id: number, payload: ExpenseUpdate): Promise<Expense> {
    const { data } = await api.patch<Expense>(`/expenses/${id}`, payload);
    return data;
}

export async function deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
}
