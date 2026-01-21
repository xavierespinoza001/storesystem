import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../services/api";
import { Category } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { status: "active" }
  });

  const fetchCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory.id, data);
      } else {
        await api.categories.create(data);
      }
      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("description", category.description);
    setValue("status", category.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await api.categories.delete(id);
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('categories.title')}</h1>
        <Button onClick={() => { setEditingCategory(null); reset(); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> {t('categories.addCategory')}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">{t('categories.name')}</th>
              <th className="px-6 py-3 font-medium">{t('categories.description')}</th>
              <th className="px-6 py-3 font-medium">{t('common.status')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
                <tr><td colSpan={4} className="p-6 text-center">{t('common.loading')}</td></tr>
            ) : (
                categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{category.name}</td>
                    <td className="px-6 py-4 text-slate-600">{category.description || "-"}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                            {t(`common.${category.status}`)}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t('categories.editCategory') : t('categories.addCategory')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('categories.name')} {...register("name")} error={errors.name?.message} />
          <Input label={t('categories.description')} {...register("description")} />
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('common.status')}</label>
            <select 
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editingCategory ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
