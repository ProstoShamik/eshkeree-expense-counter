import { useState } from 'react';
import { getApiErrorMessage } from '@/api/errors';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useUpdateExpense } from '@/hooks/useExpenses';
import type { Expense, Category } from '@/types';

interface Props {
    selectedExpense: Expense | null;
    onCategoryAssigned: () => void;
}

export default function CategoriesPanel({ selectedExpense, onCategoryAssigned }: Props) {
    const { data: categories, isLoading } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();
    const updateExpenseMutation = useUpdateExpense();

    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        setError('');
        try {
            await createMutation.mutateAsync({ name: trimmed });
            setNewName('');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Не удалось создать категорию'));
        }
    };

    const handleStartEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const handleSaveEdit = async () => {
        if (editingId === null) return;
        const trimmed = editName.trim();
        if (!trimmed) return;
        setError('');
        try {
            await updateMutation.mutateAsync({ id: editingId, payload: { name: trimmed } });
            setEditingId(null);
            setEditName('');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Не удалось сохранить категорию'));
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleDelete = async (cat: Category) => {
        if (!window.confirm(`Удалить категорию "${cat.name}"? Расходы останутся без категории.`)) return;
        setError('');
        try {
            await deleteMutation.mutateAsync(cat.id);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Не удалось удалить категорию'));
        }
    };

    const handleAssignCategory = async (categoryId: number | null) => {
        if (!selectedExpense) return;
        setError('');
        try {
            await updateExpenseMutation.mutateAsync({
                id: selectedExpense.id,
                payload: { category_id: categoryId },
            });
            onCategoryAssigned();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Не удалось назначить категорию'));
        }
    };

    const isGlobal = (cat: Category) => cat.user_id === null;
    const activeCategoryId = selectedExpense?.category_id ?? null;

    return (
        <div className="flex h-full flex-col rounded-2xl border border-dark-600 bg-dark-800">
            <div className="border-b border-dark-600 px-4 py-3">
                <h2 className="text-sm font-semibold text-dark-100">Категории</h2>
                {selectedExpense && (
                    <p className="mt-1 text-xs text-accent-400">
                        Выбран расход #{selectedExpense.id} — нажмите категорию для назначения
                    </p>
                )}
                {error && (
                    <p className="mt-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs text-danger-400">
                        {error}
                    </p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-dark-500 border-t-accent-500" />
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {/* "No category" option */}
                        {selectedExpense && (
                            <button
                                onClick={() => handleAssignCategory(null)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${activeCategoryId === null
                                        ? 'bg-accent-500/15 text-accent-300'
                                        : 'text-dark-300 hover:bg-dark-600 hover:text-dark-100'
                                    }`}
                            >
                                <span className="h-2 w-2 rounded-full bg-dark-400" />
                                Без категории
                            </button>
                        )}

                        {categories?.map((cat) => {
                            const isActive = activeCategoryId === cat.id;
                            const global = isGlobal(cat);

                            if (editingId === cat.id) {
                                return (
                                    <div key={cat.id} className="flex items-center gap-1 rounded-lg bg-dark-700 p-1.5">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            autoFocus
                                            className="min-w-0 flex-1 rounded-lg border border-dark-500 bg-dark-700 px-2 py-1 text-sm text-dark-100 outline-none focus:border-accent-500"
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            className="rounded-md p-1 text-success-500 hover:bg-dark-600"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="rounded-md p-1 text-dark-300 hover:bg-dark-600"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={cat.id}
                                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${isActive
                                            ? 'bg-accent-500/15 text-accent-300'
                                            : 'text-dark-200 hover:bg-dark-600'
                                        } ${selectedExpense ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                        if (selectedExpense) handleAssignCategory(cat.id);
                                    }}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${isActive ? 'bg-accent-400' : 'bg-dark-400'
                                            }`}
                                    />
                                    <span className="flex-1 truncate text-sm">{cat.name}</span>

                                    {global && (
                                        <span className="text-[10px] uppercase tracking-wider text-dark-400">
                                            общая
                                        </span>
                                    )}

                                    {!global && (
                                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEdit(cat);
                                                }}
                                                className="rounded-md p-1 text-dark-300 hover:bg-dark-500 hover:text-dark-100"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(cat);
                                                }}
                                                className="rounded-md p-1 text-dark-300 hover:bg-danger-500/20 hover:text-danger-500"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add category form */}
            <div className="border-t border-dark-600 p-3">
                <div className="flex gap-2">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                        placeholder="Новая категория"
                        className="min-w-0 flex-1 rounded-xl border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-dark-100 outline-none placeholder:text-dark-400 focus:border-accent-500"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newName.trim() || createMutation.isPending}
                        className="rounded-xl bg-accent-500 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-accent-400 disabled:opacity-40"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
