import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Product, Movement, Sale, Category } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, ShoppingBag, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { format, isSameDay, subDays, startOfWeek, isSameWeek, subWeeks, startOfDay, endOfDay } from "date-fns";

type TimeRange = 'today' | 'week' | 'month';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Metrics State
  const [stats, setStats] = useState({
    totalValue: 0,
    lowStock: 0,
    salesToday: 0,
    salesTodayCount: 0,
    salesWeek: 0,
    salesWeekCount: 0,
    salesYesterday: 0,
    salesLastWeek: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, cData, mData, sData] = await Promise.all([
          api.products.getAll(),
          api.categories.getAll(),
          api.inventory.getMovements(),
          api.sales.getAll()
        ]);

        setProducts(pData);
        setCategories(cData);
        setMovements(mData);
        setSales(sData);

        // Calculate Metrics
        const now = new Date();
        const today = startOfDay(now);
        const yesterday = subDays(today, 1);
        const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const lastWeekStart = subWeeks(thisWeekStart, 1);
        const lastWeekEnd = subDays(thisWeekStart, 1);

        // Sales Today
        const salesTodayList = sData.filter(s => isSameDay(new Date(s.date), now));
        const salesTodayTotal = salesTodayList.reduce((acc, s) => acc + s.total, 0);
        
        // Sales Yesterday
        const salesYesterdayList = sData.filter(s => isSameDay(new Date(s.date), yesterday));
        const salesYesterdayTotal = salesYesterdayList.reduce((acc, s) => acc + s.total, 0);

        // Sales This Week
        const salesWeekList = sData.filter(s => new Date(s.date) >= thisWeekStart);
        const salesWeekTotal = salesWeekList.reduce((acc, s) => acc + s.total, 0);

        // Sales Last Week
        const salesLastWeekList = sData.filter(s => {
            const d = new Date(s.date);
            return d >= lastWeekStart && d <= lastWeekEnd;
        });
        const salesLastWeekTotal = salesLastWeekList.reduce((acc, s) => acc + s.total, 0);

        setStats({
            totalValue: pData.reduce((acc, p) => acc + (p.price * p.stock), 0),
            lowStock: pData.filter(p => p.stock <= p.minStock).length,
            salesToday: salesTodayTotal,
            salesTodayCount: salesTodayList.length,
            salesYesterday: salesYesterdayTotal,
            salesWeek: salesWeekTotal,
            salesWeekCount: salesWeekList.length,
            salesLastWeek: salesLastWeekTotal
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Chart Data Preparation ---

  const getSalesChartData = () => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const daySales = sales.filter(s => isSameDay(new Date(s.date), date));
        data.push({
            name: format(date, 'EEE'), // Mon, Tue...
            fullDate: format(date, 'MMM dd'),
            sales: daySales.reduce((acc, s) => acc + s.total, 0),
            count: daySales.length
        });
    }
    return data;
  };

  const getCategoryChartData = () => {
    return categories.map(cat => {
        const catProducts = products.filter(p => p.categoryId === cat.id);
        const stockValue = catProducts.reduce((acc, p) => acc + (p.stock * p.price), 0);
        // Estimate sales by category (mock logic as sales items store product ID)
        // In real app, we'd join tables. Here we iterate sales items.
        let salesValue = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const prod = products.find(p => p.id === item.productId);
                if (prod && prod.categoryId === cat.id) {
                    salesValue += item.subtotal;
                }
            });
        });

        return {
            name: cat.name,
            Stock: stockValue,
            Sales: salesValue
        };
    });
  };

  // --- Unified Activity Feed ---
  // Merge Sales and Movements (excluding movements that are part of sales to avoid noise, or showing them differently)
  // For this view, let's show Sales as one entity and "Manual" movements as another.
  const getActivityFeed = () => {
    const activity = [
        ...sales.map(s => ({ type: 'sale', date: new Date(s.date), data: s })),
        ...movements.filter(m => !m.reason?.startsWith('Sale #')).map(m => ({ type: 'movement', date: new Date(m.date), data: m }))
    ];
    return activity.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const todayTrend = calculateTrend(stats.salesToday, stats.salesYesterday);
  const weekTrend = calculateTrend(stats.salesWeek, stats.salesLastWeek);

  if (loading) return <div className="p-8 flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeRange === range 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {t(`dashboard.filters.${range}`)}
                </button>
            ))}
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sales Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.salesToday')}</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.salesToday)}</div>
            <div className="flex items-center text-xs mt-1">
                <span className={`flex items-center font-medium ${todayTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {todayTrend >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                    {Math.abs(todayTrend).toFixed(1)}%
                </span>
                <span className="text-slate-500 ml-1">{t('dashboard.vsYesterday')}</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">{stats.salesTodayCount} {t('dashboard.transactions')}</div>
          </CardContent>
        </Card>

        {/* Sales Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.salesWeek')}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.salesWeek)}</div>
            <div className="flex items-center text-xs mt-1">
                <span className={`flex items-center font-medium ${weekTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weekTrend >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                    {Math.abs(weekTrend).toFixed(1)}%
                </span>
                <span className="text-slate-500 ml-1">{t('dashboard.vsLastWeek')}</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">{stats.salesWeekCount} {t('dashboard.transactions')}</div>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.totalValue')}</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-slate-500 mt-1">{products.length} {t('dashboard.totalProducts')}</div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t('dashboard.lowStock')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
            <div className="text-xs text-slate-500 mt-1">{t('dashboard.lowStock')} Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.salesTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getSalesChartData()}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.topCategories')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCategoryChartData()} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="Stock" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-0">
                {getActivityFeed().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-4">
                            {/* Icon Box */}
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                item.type === 'sale' ? 'bg-blue-100 text-blue-600' : 
                                (item.data as Movement).type === 'in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                                {item.type === 'sale' ? <ShoppingBag className="h-5 w-5" /> : 
                                 (item.data as Movement).type === 'in' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            
                            {/* Details */}
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {item.type === 'sale' 
                                        ? `${t('pos.saleSuccess')} #${(item.data as Sale).id}` 
                                        : (item.data as Movement).productName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {format(item.date, 'MMM dd, HH:mm')} • {(item.data as any).userName}
                                </p>
                            </div>
                        </div>

                        {/* Amount / Quantity */}
                        <div className="text-right">
                            {item.type === 'sale' ? (
                                <>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency((item.data as Sale).total)}</p>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                                        {(item.data as Sale).documentType === 'invoice' ? t('pos.invoice') : t('pos.receipt')}
                                    </span>
                                </>
                            ) : (
                                <span className={`text-sm font-bold ${(item.data as Movement).type === 'in' ? 'text-green-600' : 'text-orange-600'}`}>
                                    {(item.data as Movement).type === 'in' ? '+' : '-'}{(item.data as Movement).quantity}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
