import { useState, useMemo, useCallback, useEffect } from 'react';
import { getApiErrorMessage } from '@/api/errors';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import type { Expense, ExpenseFilters, ExpenseSortField, SortOrder } from '@/types';
import ExpenseForm from '@/components/ExpenseForm';
import CategoriesPanel from '@/components/CategoriesPanel';

type SortConfig = {
    field: ExpenseSortField;
    order: SortOrder;
};

export default function DashboardPage() {
    // Filters
    const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountFrom, setAmountFrom] = useState('');
    const [amountTo, setAmountTo] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortConfig>({ field: 'expense_date', order: 'desc' });

    // UI state
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    const filters: Omit<ExpenseFilters, 'cursor'> = useMemo(
        () => ({
            category_id: categoryFilter,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            amount_from: amountFrom ? Number(amountFrom) : undefined,
            amount_to: amountTo ? Number(amountTo) : undefined,
            search: search || undefined,
            sort_by: sort.field,
            sort_order: sort.order,
        }),
        [categoryFilter, dateFrom, dateTo, amountFrom, amountTo, search, sort],
    );

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useExpenses(filters);
    const deleteMutation = useDeleteExpense();
    const { data: categories } = useCategories();

    const expenses = useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data],
    );

    const loadedTotal = useMemo(
        () => expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
        [expenses],
    );

    const handleSort = (field: ExpenseSortField) => {
        setSort((prev) =>
            prev.field === field
                ? { field, order: prev.order === 'asc' ? 'desc' : 'asc' }
                : { field, order: 'desc' },
        );
    };

    const handleRowClick = useCallback((expense: Expense) => {
        setSelectedExpense((prev) => (prev?.id === expense.id ? null : expense));
    }, []);

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить этот расход?')) return;
        setActionError('');
        try {
            if (selectedExpense?.id === id) setSelectedExpense(null);
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'Не удалось удалить расход'));
        }
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
    };

    const handleAdd = () => {
        setEditingExpense(null);
        setIsFormOpen(true);
    };

    const handleCategoryAssigned = () => {
        setSelectedExpense(null);
    };

    const clearFilters = () => {
        setCategoryFilter(undefined);
        setDateFrom('');
        setDateTo('');
        setAmountFrom('');
        setAmountTo('');
        setSearchInput('');
        setSearch('');
    };

    const hasActiveFilters = categoryFilter || dateFrom || dateTo || amountFrom || amountTo || searchInput;

    const SortIcon = ({ field }: { field: ExpenseSortField }) => {
        if (sort.field !== field) return <span className="ml-1 text-dark-400">↕</span>;
        return <span className="ml-1 text-accent-400">{sort.order === 'asc' ? '↑' : '↓'}</span>;
    };

    const inputClass =
        'rounded-xl border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30';

    const formatAmount = (val: string | number) => {
        return Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getCategoryName = (expense: Expense) => {
        if (expense.category) return expense.category.name;
        if (expense.category_id && categories) {
            const cat = categories.find((c) => c.id === expense.category_id);
            return cat?.name ?? '—';
        }
        return '—';
    };

    return (
        <div className="flex min-h-[calc(100vh-5.5rem)] flex-col gap-5 xl:h-[calc(100vh-5.5rem)] xl:flex-row">
            {/* Main content */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Header */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-dark-100">Расходы</h1>
                        <p className="mt-1 text-sm text-dark-300">
                            Загружено: {expenses.length} · сумма: {formatAmount(loadedTotal)}
                        </p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-400 hover:shadow-lg hover:shadow-accent-500/20"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Добавить расход
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-4 rounded-2xl border border-dark-600 bg-dark-800 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[180px] flex-1">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Поиск</label>
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="По описанию..."
                                className={inputClass + ' w-full'}
                            />
                        </div>
                        <div className="w-[160px]">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Категория</label>
                            <select
                                value={categoryFilter ?? ''}
                                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                                className={inputClass + ' w-full'}
                            >
                                <option value="">Все</option>
                                {categories?.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-[140px]">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Дата от</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass + ' w-full'} />
                        </div>
                        <div className="w-[140px]">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Дата до</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass + ' w-full'} />
                        </div>
                        <div className="w-[110px]">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Сумма от</label>
                            <input type="number" value={amountFrom} onChange={(e) => setAmountFrom(e.target.value)} placeholder="0" className={inputClass + ' w-full'} />
                        </div>
                        <div className="w-[110px]">
                            <label className="mb-1 block text-xs font-medium text-dark-300">Сумма до</label>
                            <input type="number" value={amountTo} onChange={(e) => setAmountTo(e.target.value)} placeholder="∞" className={inputClass + ' w-full'} />
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="rounded-xl border border-dark-500 px-3 py-2 text-sm text-dark-300 transition hover:bg-dark-600 hover:text-dark-100"
                            >
                                Сбросить
                            </button>
                        )}
                    </div>
                </div>

                {actionError && (
                    <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
                        {actionError}
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto rounded-2xl border border-dark-600 bg-dark-800">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-3 border-dark-500 border-t-accent-500" />
                        </div>
                    ) : isError ? (
                        <div className="flex h-48 items-center justify-center text-sm text-danger-400">
                            Ошибка загрузки данных
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 text-dark-300">
                            <svg className="h-10 w-10 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            <p className="text-sm">Расходов пока нет</p>
                        </div>
                    ) : (
                        <table className="min-w-[760px] w-full text-sm">
                            <thead>
                                <tr className="border-b border-dark-600 text-left">
                                    <th
                                        className="cursor-pointer px-4 py-3 font-medium text-dark-300 transition-colors hover:text-dark-100 select-none"
                                        onClick={() => handleSort('expense_date')}
                                    >
                                        Дата <SortIcon field="expense_date" />
                                    </th>
                                    <th className="px-4 py-3 font-medium text-dark-300">Описание</th>
                                    <th
                                        className="cursor-pointer px-4 py-3 font-medium text-dark-300 transition-colors hover:text-dark-100 select-none"
                                        onClick={() => handleSort('category_id')}
                                    >
                                        Категория <SortIcon field="category_id" />
                                    </th>
                                    <th
                                        className="cursor-pointer px-4 py-3 text-right font-medium text-dark-300 transition-colors hover:text-dark-100 select-none"
                                        onClick={() => handleSort('amount')}
                                    >
                                        Сумма <SortIcon field="amount" />
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-dark-300">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp) => {
                                    const isSelected = selectedExpense?.id === exp.id;
                                    return (
                                        <tr
                                            key={exp.id}
                                            onClick={() => handleRowClick(exp)}
                                            className={`cursor-pointer border-b border-dark-700 transition-colors ${isSelected
                                                    ? 'bg-accent-500/10'
                                                    : 'hover:bg-dark-700/50'
                                                }`}
                                        >
                                            <td className="px-4 py-3 text-dark-200">
                                                {new Date(exp.expense_date).toLocaleDateString('ru-RU')}
                                            </td>
                                            <td className="max-w-[220px] truncate px-4 py-3 text-dark-100">
                                                {exp.description || <span className="text-dark-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-medium ${exp.category_id
                                                        ? 'bg-accent-500/15 text-accent-300'
                                                        : 'bg-dark-600 text-dark-300'
                                                    }`}>
                                                    {getCategoryName(exp)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-dark-100">
                                                {formatAmount(exp.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(exp);
                                                        }}
                                                        className="rounded-lg p-1.5 text-dark-300 transition-colors hover:bg-dark-500 hover:text-dark-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(exp.id);
                                                        }}
                                                        className="rounded-lg p-1.5 text-dark-300 transition-colors hover:bg-danger-500/20 hover:text-danger-500"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* Load more */}
                    {hasNextPage && (
                        <div className="flex justify-center border-t border-dark-600 py-4">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="rounded-xl bg-dark-600 px-6 py-2 text-sm font-medium text-dark-200 transition-colors hover:bg-dark-500 hover:text-dark-100 disabled:opacity-50"
                            >
                                {isFetchingNextPage ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark-400 border-t-dark-100" />
                                        Загрузка...
                                    </span>
                                ) : (
                                    'Загрузить ещё'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Categories panel */}
            <div className="min-h-[320px] flex-shrink-0 xl:w-[280px]">
                <CategoriesPanel
                    selectedExpense={selectedExpense}
                    onCategoryAssigned={handleCategoryAssigned}
                />
            </div>

            {/* Expense form modal */}
            <ExpenseForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                expense={editingExpense}
            />
        </div>
    );
}
