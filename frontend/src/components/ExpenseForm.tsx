import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import type { Expense } from '@/types';
import Modal from './Modal';

const expenseSchema = z.object({
    amount: z.coerce.number().positive('Сумма должна быть больше 0'),
    description: z.string().max(500).optional().or(z.literal('')),
    expense_date: z.string().min(1, 'Укажите дату'),
    category_id: z.coerce.number().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    expense?: Expense | null;
}

export default function ExpenseForm({ isOpen, onClose, expense }: Props) {
    const createMutation = useCreateExpense();
    const updateMutation = useUpdateExpense();
    const { data: categories } = useCategories();
    const isEdit = !!expense;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        values: expense
            ? {
                amount: Number(expense.amount),
                description: expense.description ?? '',
                expense_date: expense.expense_date,
                category_id: expense.category_id ?? undefined,
            }
            : {
                amount: 0,
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                category_id: undefined,
            },
    });

    const onSubmit = async (data: ExpenseFormData) => {
        const payload = {
            amount: data.amount,
            description: data.description || null,
            expense_date: data.expense_date,
            category_id: data.category_id || null,
        };

        if (isEdit && expense) {
            await updateMutation.mutateAsync({ id: expense.id, payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
        reset();
        onClose();
    };

    const inputClass =
        'w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-2.5 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Редактировать расход' : 'Новый расход'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-200">Сумма</label>
                    <input
                        {...register('amount')}
                        type="number"
                        step="0.01"
                        className={inputClass}
                        placeholder="0.00"
                    />
                    {errors.amount && <p className="mt-1 text-xs text-danger-500">{errors.amount.message}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-200">Описание</label>
                    <input
                        {...register('description')}
                        type="text"
                        className={inputClass}
                        placeholder="Описание расхода"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-200">Дата</label>
                    <input {...register('expense_date')} type="date" className={inputClass} />
                    {errors.expense_date && (
                        <p className="mt-1 text-xs text-danger-500">{errors.expense_date.message}</p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-200">Категория</label>
                    <select {...register('category_id')} className={inputClass}>
                        <option value="">Без категории</option>
                        {categories?.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-dark-500 px-4 py-2.5 text-sm font-medium text-dark-200 transition-colors hover:bg-dark-600"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-400 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
