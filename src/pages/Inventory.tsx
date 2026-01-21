import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../services/api";
import { Product, Movement } from "../types";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import { useTranslation } from "react-i18next";

const movementSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

export const Inventory = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<"in" | "out">("in");

  const canRegister = user?.role === "admin" || user?.role === "sales";

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
  });

  const fetchData = async () => {
    const [pData, mData] = await Promise.all([
      api.products.getAll(),
      api.inventory.getMovements(),
    ]);
    setProducts(pData);
    setMovements(mData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type: "in" | "out") => {
    setMovementType(type);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = async (data: MovementFormData) => {
    if (!user) return;
    
    const product = products.find(p => p.id === data.productId);
    
    try {
      await api.inventory.registerMovement({
        ...data,
        type: movementType,
        productName: product?.name || "Unknown",
      }, user);
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('inventory.title')}</h1>
        {canRegister && (
            <div className="flex gap-3">
            <Button onClick={() => openModal("in")} className="bg-green-600 hover:bg-green-700">
                <ArrowDownLeft className="mr-2 h-4 w-4" /> {t('inventory.stockIn')}
            </Button>
            <Button onClick={() => openModal("out")} className="bg-red-600 hover:bg-red-700">
                <ArrowUpRight className="mr-2 h-4 w-4" /> {t('inventory.stockOut')}
            </Button>
            </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center text-lg font-semibold text-slate-900">
                <History className="mr-2 h-5 w-5 text-slate-500" />
                {t('inventory.history')}
            </h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                <th className="px-6 py-3 font-medium">{t('inventory.date')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.product')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.type')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.quantity')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.user')}</th>
                <th className="px-6 py-3 font-medium">{t('inventory.reason')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600">
                        {new Date(m.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{m.productName}</td>
                    <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        m.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {m.type === 'in' ? t('inventory.entry') : t('inventory.exit')}
                    </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{m.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{m.userName}</td>
                    <td className="px-6 py-4 text-slate-500 italic">{m.reason || "-"}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={movementType === 'in' ? t('inventory.registerEntry') : t('inventory.registerExit')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('inventory.product')}</label>
                <select 
                    {...register("productId")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">{t('inventory.selectProduct')}</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>
                    ))}
                </select>
                {errors.productId && <p className="mt-1 text-xs text-red-500">{errors.productId.message}</p>}
            </div>

            <Input 
                label={t('inventory.quantity')} 
                type="number" 
                {...register("quantity", { valueAsNumber: true })}
                error={errors.quantity?.message}
            />

            <Input 
                label={t('inventory.reason')} 
                placeholder={t('inventory.reasonPlaceholder')}
                {...register("reason")}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" variant={movementType === 'in' ? 'primary' : 'danger'}>
                    {movementType === 'in' ? t('inventory.stockIn') : t('inventory.stockOut')}
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
};
