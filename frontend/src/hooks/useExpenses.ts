import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenses';
import type { ExpenseFilters, ExpenseCreate, ExpenseUpdate, ExpenseListResponse } from '@/types';

export function useExpenses(filters: Omit<ExpenseFilters, 'cursor'>) {
    return useInfiniteQuery<ExpenseListResponse>({
        queryKey: ['expenses', filters],
        queryFn: ({ pageParam }) =>
            getExpenses({ ...filters, cursor: pageParam as number | undefined }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ExpenseCreate) => createExpense(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ExpenseUpdate }) =>
            updateExpense(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
}
