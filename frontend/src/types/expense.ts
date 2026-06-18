import { Category } from './category';

export interface Expense {
    id: number;
    amount: string;
    description: string | null;
    expense_date: string;
    category_id: number | null;
    category: Pick<Category, 'id' | 'name'> | null;
    created_at: string;
    updated_at?: string;
}

export interface ExpenseCreate {
    amount: number;
    description?: string | null;
    expense_date?: string;
    category_id?: number | null;
}

export interface ExpenseUpdate {
    amount?: number | null;
    description?: string | null;
    expense_date?: string | null;
    category_id?: number | null;
}

export type ExpenseSortField = 'expense_date' | 'amount' | 'category_id';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseFilters {
    category_id?: number;
    date_from?: string;
    date_to?: string;
    amount_from?: number;
    amount_to?: number;
    search?: string;
    cursor?: string;
    limit?: number;
    sort_by?: ExpenseSortField;
    sort_order?: SortOrder;
}

export interface ExpenseListResponse {
    data: Expense[];
    next_cursor: string | null;
    has_more: boolean;
}
