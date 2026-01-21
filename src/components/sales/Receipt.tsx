import React from "react";
import { Sale } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useTranslation } from "react-i18next";

interface ReceiptProps {
  sale: Sale;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-8 text-slate-900 max-w-sm mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:w-full print:max-w-none">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider">StockMaster</h2>
        <p className="text-xs text-slate-500">Inventory & POS System</p>
        <p className="text-xs text-slate-500">123 Store Street, City</p>
        <div className="mt-4 border-b border-slate-900 pb-2">
            <h3 className="text-lg font-bold uppercase">{sale.documentType === 'invoice' ? t('pos.invoice') : t('pos.receipt')}</h3>
            <p className="text-sm">#{sale.id}</p>
        </div>
      </div>

      <div className="mb-4 text-xs space-y-1">
        <div className="flex justify-between">
            <span className="text-slate-500">{t('sales.date')}:</span>
            <span>{new Date(sale.date).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-slate-500">{t('sales.seller')}:</span>
            <span>{sale.userName}</span>
        </div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
            <tr className="border-b border-slate-300">
                <th className="text-left py-1">{t('pos.item')}</th>
                <th className="text-right py-1">{t('pos.qty')}</th>
                <th className="text-right py-1">{t('pos.price')}</th>
                <th className="text-right py-1">{t('pos.subtotal')}</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
            {sale.items.map((item, idx) => (
                <tr key={idx}>
                    <td className="py-1">{item.productName}</td>
                    <td className="text-right py-1">{item.quantity}</td>
                    <td className="text-right py-1">{formatCurrency(item.price)}</td>
                    <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
                </tr>
            ))}
        </tbody>
      </table>

      <div className="border-t border-slate-900 pt-2">
        <div className="flex justify-between text-lg font-bold">
            <span>{t('pos.total')}</span>
            <span>{formatCurrency(sale.total)}</span>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Thank you for your purchase!</p>
      </div>
    </div>
  );
};
