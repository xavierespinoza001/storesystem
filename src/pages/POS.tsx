import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Product, SaleItem, Sale } from "../types";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Search, ShoppingCart, Trash2, Plus, Minus, Printer } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { Receipt } from "../components/sales/Receipt";

export const POS = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'receipt' | 'invoice'>('receipt');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.getAll();
        setProducts(data.filter(p => p.status === 'active'));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [lastSale]); // Refresh products after a sale

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cap at stock
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        subtotal: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > product.stock) return item;
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
        const sale = await api.sales.create(cart, documentType, user);
        setLastSale(sale);
        setIsCheckoutOpen(false);
        setCart([]);
        setIsReceiptOpen(true);
    } catch (error) {
        alert("Error processing sale");
        console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input 
                type="text" 
                placeholder={t('common.search')} 
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
            />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start pr-2">
            {loading ? <div className="col-span-full text-center">{t('common.loading')}</div> : 
             filteredProducts.map(product => (
                <button 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        product.stock > 0 
                        ? "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md" 
                        : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                    }`}
                >
                    <div className="w-full flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-900 line-clamp-1">{product.name}</span>
                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{product.stock}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">{product.description}</p>
                    <div className="mt-auto font-bold text-blue-600">{formatCurrency(product.price)}</div>
                </button>
            ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" /> {t('pos.cart')}
            </h2>
            <span className="text-sm font-medium text-slate-500">{cart.length} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                    <p>{t('pos.emptyCart')}</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded-md hover:bg-slate-100 text-slate-600">
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded-md hover:bg-slate-100 text-slate-600">
                                <Plus className="h-3 w-3" />
                            </button>
                            <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded-md hover:bg-red-50 text-red-500 ml-1">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                <span>{t('pos.total')}</span>
                <span>{formatCurrency(cartTotal)}</span>
            </div>
            <Button 
                className="w-full" 
                size="lg" 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
            >
                {t('pos.checkout')}
            </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={t('pos.confirmSale')}
      >
        <div className="space-y-6">
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('pos.documentType')}</label>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setDocumentType('receipt')}
                        className={`p-3 rounded-lg border text-center transition-all ${
                            documentType === 'receipt' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {t('pos.receipt')}
                    </button>
                    <button 
                        onClick={() => setDocumentType('invoice')}
                        className={`p-3 rounded-lg border text-center transition-all ${
                            documentType === 'invoice' ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {t('pos.invoice')}
                    </button>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{t('pos.item')}s</span>
                    <span className="font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                    <span>{t('pos.total')}</span>
                    <span>{formatCurrency(cartTotal)}</span>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleCheckout} className="w-32">{t('pos.confirmSale')}</Button>
            </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {isReceiptOpen && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:max-w-none print:w-full">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 print:hidden">
                    <h3 className="font-semibold text-slate-900">{t('pos.saleSuccess')}</h3>
                    <button onClick={() => setIsReceiptOpen(false)} className="text-slate-500 hover:text-slate-700">
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                
                <div className="p-6 print:p-0">
                    <Receipt sale={lastSale} />
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 print:hidden">
                    <Button variant="outline" className="flex-1" onClick={() => setIsReceiptOpen(false)}>
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
