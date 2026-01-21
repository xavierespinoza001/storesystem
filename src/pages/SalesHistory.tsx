import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Sale } from "../types";
import { Button } from "../components/ui/Button";
import { Receipt } from "../components/sales/Receipt";
import { Eye, Printer } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useTranslation } from "react-i18next";

export const SalesHistory = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await api.sales.getAll();
        setSales(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">{t('sales.title')}</h1>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">{t('sales.id')}</th>
              <th className="px-6 py-3 font-medium">{t('sales.date')}</th>
              <th className="px-6 py-3 font-medium">{t('sales.seller')}</th>
              <th className="px-6 py-3 font-medium">{t('sales.document')}</th>
              <th className="px-6 py-3 font-medium">{t('sales.total')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
                <tr><td colSpan={6} className="p-6 text-center">{t('common.loading')}</td></tr>
            ) : (
                sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-600">#{sale.id}</td>
                    <td className="px-6 py-4 text-slate-900">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">{sale.userName}</td>
                    <td className="px-6 py-4 capitalize">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sale.documentType === 'invoice' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {sale.documentType === 'invoice' ? t('pos.invoice') : t('pos.receipt')}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedSale(sale)}>
                            <Eye className="mr-2 h-4 w-4" /> {t('sales.viewReceipt')}
                        </Button>
                    </td>
                </tr>
                ))
            )}
            {!loading && sales.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">{t('dashboard.noMovements')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt View Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:max-w-none print:w-full">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden">
                    <h3 className="font-semibold text-slate-900">{t('sales.viewReceipt')}</h3>
                    <button onClick={() => setSelectedSale(null)} className="text-slate-500 hover:text-slate-700">
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                
                <div className="p-6 print:p-0">
                    <Receipt sale={selectedSale} />
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 print:hidden">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedSale(null)}>
                        {t('common.close')}
                    </Button>
                    <Button className="flex-1" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> {t('common.print')}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
