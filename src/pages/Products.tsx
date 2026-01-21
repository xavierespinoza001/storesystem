import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../services/api";
import { Product, Category } from "../types";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useTranslation } from "react-i18next";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  price: z.number().min(0),
  categoryId: z.string().min(1, "Category is required"),
  minStock: z.number().min(0),
});

type ProductFormData = z.infer<typeof productSchema>;

export const Products = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const canEdit = user?.role === "admin";

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const fetchData = async () => {
    try {
      const [pData, cData] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll()
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, data);
      } else {
        await api.products.create({ ...data, stock: 0, status: "active" });
      }
      setIsModalOpen(false);
      reset();
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setValue("sku", product.sku);
    setValue("name", product.name);
    setValue("description", product.description);
    setValue("price", product.price);
    setValue("categoryId", product.categoryId);
    setValue("minStock", product.minStock);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await api.products.delete(id);
      fetchData();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('products.title')}</h1>
        {canEdit && (
            <Button onClick={() => { setEditingProduct(null); reset(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t('products.addProduct')}
            </Button>
        )}
      </div>

      <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2">
        <Search className="mr-2 h-4 w-4 text-slate-400" />
        <input 
            type="text" 
            placeholder={t('common.search')} 
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                <th className="px-6 py-3 font-medium">{t('products.name')}</th>
                <th className="px-6 py-3 font-medium">{t('products.sku')}</th>
                <th className="px-6 py-3 font-medium">{t('products.category')}</th>
                <th className="px-6 py-3 font-medium">{t('products.price')}</th>
                <th className="px-6 py-3 font-medium">{t('products.stock')}</th>
                <th className="px-6 py-3 font-medium">{t('common.status')}</th>
                {canEdit && <th className="px-6 py-3 font-medium text-right">{t('common.actions')}</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={canEdit ? 7 : 6} className="p-6 text-center">{t('common.loading')}</td></tr>
                ) : (
                    filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{product.sku}</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                {product.categoryName}
                            </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4">
                            <span className={product.stock <= product.minStock ? "text-red-600 font-bold" : "text-slate-600"}>
                                {product.stock}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex h-2 w-2 rounded-full ${product.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        </td>
                        {canEdit && (
                            <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800">
                                <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            </td>
                        )}
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('products.sku')} {...register("sku")} error={errors.sku?.message} />
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('products.category')}</label>
                <select 
                    {...register("categoryId")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">{t('products.selectCategory')}</option>
                    {categories.filter(c => c.status === 'active').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>
          </div>
          <Input label={t('products.name')} {...register("name")} error={errors.name?.message} />
          <Input label={t('products.description')} {...register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input 
                label={t('products.price')} 
                type="number" 
                step="0.01" 
                {...register("price", { valueAsNumber: true })} 
                error={errors.price?.message} 
            />
            <Input 
                label={t('products.minStock')} 
                type="number" 
                {...register("minStock", { valueAsNumber: true })} 
                error={errors.minStock?.message} 
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editingProduct ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
