import React, { useState, useMemo, useEffect } from 'react';
import { Bell, QrCode, Plus, Clipboard, AlertTriangle, ChevronDown, Check, X, ShieldAlert, CheckCircle2, Package, TrendingUp, Cpu, BarChart3, Layers, Search, Filter, Info } from 'lucide-react';
import { InventoryItem, ServiceRecord, ServiceStatus, ServiceItemUsed } from '../types';
import { 
  SALES_FORECAST_TOTAL, 
  SALES_FORECAST_UNITS, 
  SALES_FORECAST_PARTS, 
  SALES_FORECAST_ACCESSORIES,
  getItemMonthlyForecast, 
  MONTH_NAMES, 
  CATEGORY_OPTIONS, 
  ITEM_OPTIONS 
} from '../data';
import { generateQrDataUrl, createFallbackQrSvg } from '../utils/qrHelper';

interface DashboardViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  reports: ServiceRecord[];
  setReports: React.Dispatch<React.SetStateAction<ServiceRecord[]>>;
  onNavigateToTab: (tab: 'inventory' | 'scan') => void;
  onShowToast: (msg: string) => void;
}

export default function DashboardView({
  inventory,
  setInventory,
  reports,
  setReports,
  onNavigateToTab,
  onShowToast
}: DashboardViewProps) {
  // Stats calculations
  const totalItemsCount = useMemo(() => {
    return inventory.filter(i => !i.isArchived).reduce((acc, item) => acc + item.qty, 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(item => !item.isArchived && item.qty <= 10).length;
  }, [inventory]);

  const scheduledMaintenanceCount = useMemo(() => {
    return reports.filter(r => r.status === 'Scheduled').length;
  }, [reports]);

  // Year Selection & Forecast Category Segment state for sales chart
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [forecastCategory, setForecastCategory] = useState<'all' | 'units' | 'parts' | 'accessories'>('all');
  const [selectedForecastItemId, setSelectedForecastItemId] = useState<number | 'all'>('all');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isItemForecastDropdownOpen, setIsItemForecastDropdownOpen] = useState(false);

  // Available active items matching current forecast category filter
  const forecastCategoryItems = useMemo(() => {
    const active = inventory.filter(i => !i.isArchived);
    if (forecastCategory === 'units') return active.filter(i => i.category === 'Aircon Units');
    if (forecastCategory === 'parts') return active.filter(i => i.category === 'Spare Parts');
    if (forecastCategory === 'accessories') return active.filter(i => i.category === 'Accessories');
    return active;
  }, [inventory, forecastCategory]);

  const selectedForecastItem = useMemo(() => {
    if (selectedForecastItemId === 'all') return null;
    return inventory.find(i => i.id === selectedForecastItemId) || null;
  }, [inventory, selectedForecastItemId]);

  // Forms modals visibility
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isRecordServiceOpen, setIsRecordServiceOpen] = useState(false);
  const [isLsaOpen, setIsLsaOpen] = useState(false);

  // Add Item form fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemModel, setNewItemModel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Aircon Units');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('₱1,500.00');
  const [newItemQty, setNewItemQty] = useState(1);

  // Record Service form fields
  const [srvCustomer, setSrvCustomer] = useState('');
  const [srvPhone, setSrvPhone] = useState('');
  const [srvAddress, setSrvAddress] = useState('');
  const [srvCategory, setSrvCategory] = useState('Repair');
  const [srvItem, setSrvItem] = useState('');
  const [srvNotes, setSrvNotes] = useState('');
  const [srvPartsUsed, setSrvPartsUsed] = useState<{ itemId: number; qty: number }[]>([]);
  const [srvPartsSearch, setSrvPartsSearch] = useState('');

  // Custom Dropdowns in Record Service
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  // Chart SVG Animation support
  const [animatedHeights, setAnimatedHeights] = useState<number[]>(new Array(12).fill(0));

  const currentChartData = useMemo(() => {
    if (selectedForecastItem) {
      return getItemMonthlyForecast(selectedForecastItem, selectedYear);
    }
    let sourceData = SALES_FORECAST_TOTAL;
    if (forecastCategory === 'units') sourceData = SALES_FORECAST_UNITS;
    if (forecastCategory === 'parts') sourceData = SALES_FORECAST_PARTS;
    if (forecastCategory === 'accessories') sourceData = SALES_FORECAST_ACCESSORIES;
    return sourceData[selectedYear] || sourceData[2026];
  }, [selectedYear, forecastCategory, selectedForecastItem]);

  useEffect(() => {
    // Animate chart bars on data change
    setAnimatedHeights(new Array(12).fill(0));
    const maxVal = Math.max(...currentChartData, 10);
    const timers = currentChartData.map((val, idx) => {
      return setTimeout(() => {
        setAnimatedHeights(prev => {
          const next = [...prev];
          next[idx] = (val / maxVal) * 140; // scale to fit container height
          return next;
        });
      }, idx * 35);
    });
    return () => timers.forEach(clearTimeout);
  }, [currentChartData, selectedYear, forecastCategory, selectedForecastItem]);

  // Action: Add Item submission with auto QR Generation
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      onShowToast('Please enter item name');
      return;
    }
    
    const nextId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    const qrCodeStr = `AUX-${newItemCategory === 'Aircon Units' ? 'UNIT' : 'PART'}-${nextId}-${Date.now().toString().slice(-4)}`;
    
    let qrDataUrl = '';
    try {
      qrDataUrl = await generateQrDataUrl(qrCodeStr);
    } catch {
      qrDataUrl = createFallbackQrSvg(qrCodeStr);
    }

    const addedItem: InventoryItem = {
      id: nextId,
      name: `Item ${String.fromCharCode(65 + (inventory.length % 26))}`,
      itemName: newItemName.trim(),
      model: newItemModel.trim() || 'AUX-GENERIC',
      category: newItemCategory,
      qty: Math.max(0, newItemQty),
      location: newItemLocation.trim() || 'General Shelf',
      price: newItemPrice.trim() || '₱1,000.00',
      qrCode: qrCodeStr,
      qrDataUrl: qrDataUrl
    };

    setInventory(prev => [...prev, addedItem]);
    onShowToast(`Added ${addedItem.itemName} with QR code ${qrCodeStr}!`);
    
    // Reset and close
    setNewItemName('');
    setNewItemModel('');
    setNewItemCategory('Aircon Units');
    setNewItemLocation('');
    setNewItemPrice('₱1,500.00');
    setNewItemQty(1);
    setIsAddItemOpen(false);
  };

  // Action: Record Service submission
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvCustomer.trim()) {
      onShowToast('Please enter customer name');
      return;
    }
    if (!srvPhone.trim()) {
      onShowToast('Please enter contact number');
      return;
    }
    if (!srvItem) {
      onShowToast('Please select air conditioner item');
      return;
    }

    const nextIdNum = reports.length > 0 ? Math.max(...reports.map(r => {
      const match = r.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    })) + 1 : 1001;

    const todayStr = new Date().toISOString().split('T')[0];

    // Build items used list
    const preparedItemsUsed: ServiceItemUsed[] = srvPartsUsed.map(p => {
      const found = inventory.find(i => i.id === p.itemId);
      return {
        itemId: p.itemId,
        itemName: found ? found.itemName : 'Spare Part',
        model: found ? found.model : 'AUX-GENERIC',
        qty: p.qty,
        unitPrice: found ? (found.price || '₱500.00') : '₱500.00'
      };
    });

    const newRecord: ServiceRecord = {
      id: `RPT-${nextIdNum}`,
      customer: srvCustomer.trim(),
      phone: srvPhone.trim(),
      address: srvAddress.trim() || 'Pulilan, Bulacan',
      item: srvItem,
      category: srvCategory,
      status: 'Scheduled',
      technician: 'John Cruz',
      notes: srvNotes.trim() || 'Registered from Dashboard service desk.',
      paymentStatus: 'Unpaid',
      amount: '₱2,500.00',
      serviceDate: todayStr,
      startTime: '10:00 AM',
      endTime: '—',
      created: todayStr,
      updated: todayStr,
      itemsUsed: preparedItemsUsed
    };

    // Deduct stock for items used
    if (preparedItemsUsed.length > 0) {
      setInventory(prev => prev.map(invItem => {
        const used = preparedItemsUsed.find(pu => pu.itemId === invItem.id);
        if (used) {
          return { ...invItem, qty: Math.max(0, invItem.qty - used.qty) };
        }
        return invItem;
      }));
    }

    setReports(prev => [newRecord, ...prev]);
    onShowToast(`Recorded service report ${newRecord.id}!`);

    // Reset fields & close
    setSrvCustomer('');
    setSrvPhone('');
    setSrvAddress('');
    setSrvCategory('Repair');
    setSrvItem('');
    setSrvNotes('');
    setSrvPartsUsed([]);
    setIsRecordServiceOpen(false);
  };

  return (
    <div className="w-full pb-28 pt-4 font-sans select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-2">
        <div className="flex flex-col leading-none">
          <span className="font-display font-extrabold text-3xl tracking-wide text-blue-900 italic">
            AUX
          </span>
          <span className="text-[10px] font-bold tracking-[0.12em] text-red-primary mt-1">
            AIR CONDITIONER
          </span>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Notifications Button */}
          <button 
            onClick={() => setIsLsaOpen(true)}
            className="w-11 h-11 rounded-2xl bg-red-primary/10 text-red-primary hover:bg-red-primary/15 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            <Bell className="w-5.5 h-5.5 fill-red-primary/20" />
          </button>
          
          {/* Scan button link */}
          <button 
            onClick={() => onNavigateToTab('scan')}
            className="w-11 h-11 rounded-2xl bg-navy-mid text-white hover:bg-navy-light flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            title="Open Camera QR Scanner"
          >
            <QrCode className="w-5.5 h-5.5" />
          </button>
        </div>
      </header>

      <h1 className="font-display font-extrabold text-2xl px-6 mt-4 text-slate-900">
        Dashboard Overview
      </h1>

      {/* Grid of Dynamic Stats Cards */}
      <div className="grid grid-cols-2 gap-3.5 px-6 mt-4">
        {/* Total items in stocks */}
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="bg-gradient-to-br from-teal-primary to-teal-dark rounded-2xl p-4 flex items-center gap-3.5 shadow-md shadow-teal-700/10 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer text-white"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl leading-none">
              {totalItemsCount}
            </span>
            <span className="text-[10px] font-bold text-teal-50/90 tracking-wide mt-1">
              Total Catalog Stock
            </span>
          </div>
        </div>

        {/* Low stock alerts */}
        <div 
          onClick={() => setIsLsaOpen(true)}
          className="bg-gradient-to-br from-navy-light to-navy-deep rounded-2xl p-4 flex items-center gap-3.5 shadow-md shadow-navy-950/15 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer text-white"
        >
          <div className="w-10 h-10 rounded-xl bg-red-primary flex items-center justify-center text-white shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl leading-none">
              {lowStockCount}
            </span>
            <span className="text-[10px] font-bold text-slate-300 tracking-wide mt-1">
              Low Stocks
            </span>
          </div>
        </div>

        {/* Scheduled maintenance count */}
        <div 
          className="bg-gradient-to-br from-teal-primary to-teal-dark rounded-2xl p-4 flex items-center gap-3.5 shadow-md shadow-teal-700/10 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer text-white"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <Clipboard className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl leading-none">
              {scheduledMaintenanceCount}
            </span>
            <span className="text-[10px] font-bold text-teal-50/90 tracking-wide mt-1">
              Scheduled Services
            </span>
          </div>
        </div>

        {/* Aircon Units vs Parts Quick Counter */}
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="bg-gradient-to-br from-navy-light to-navy-deep rounded-2xl p-4 flex items-center gap-3.5 shadow-md shadow-navy-950/15 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer text-white"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-xl leading-none">
              {inventory.length}
            </span>
            <span className="text-[10px] font-bold text-slate-300 tracking-wide mt-1">
              Active Items
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions buttons */}
      <h2 className="font-display font-extrabold text-lg px-6 mt-6 text-slate-900">
        Quick Actions
      </h2>
      <div className="flex gap-3.5 px-6 mt-2.5">
        <button 
          onClick={() => setIsAddItemOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-primary text-white font-bold text-sm py-3 px-4 shadow-lg shadow-teal-500/10 hover:bg-teal-dark active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          Add Item
        </button>

        <button 
          onClick={() => setIsRecordServiceOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy-mid text-white font-bold text-sm py-3 px-4 shadow-lg shadow-navy-500/10 hover:bg-navy-light active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Clipboard className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          Record Services
        </button>
      </div>

      {/* Embedded Low Stock alerts widget */}
      <div className="mx-6 mt-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <AlertTriangle className="w-4.5 h-4.5 text-red-primary" />
            Low Stock Alerts
          </div>
          <span className="text-[11px] font-bold text-red-primary bg-red-50 px-2 py-0.5 rounded">
            {lowStockCount} items
          </span>
        </div>
        <div className="flex flex-col gap-3 mt-3">
          {inventory.filter(item => item.qty <= 10).slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center justify-between text-xs text-slate-800">
              <span className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-primary" />
                {item.itemName}
              </span>
              <span className="font-black text-red-primary bg-red-50 px-2 py-0.5 rounded">
                ({item.qty} left)
              </span>
            </div>
          ))}
          {lowStockCount === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-1">
              All items are well stocked!
            </p>
          )}
        </div>
      </div>

      {/* SALES FORECASTING MODULE */}
      <div className="mx-6 mt-6 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
        
        {/* Module Header */}
        <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-teal-700 uppercase bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Demand Analytics
            </span>

            {/* Year selector dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-extrabold text-slate-800 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Year {selectedYear}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isYearDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 min-w-[95px] max-h-48 overflow-y-auto font-sans">
                  {Object.keys(SALES_FORECAST_TOTAL).map(yearStr => {
                    const y = parseInt(yearStr, 10);
                    return (
                      <div 
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-teal-50 hover:text-teal-700 transition-colors ${
                          selectedYear === y ? 'bg-teal-50 text-teal-700 font-black' : 'text-slate-700'
                        }`}
                      >
                        {y}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <h2 className="font-display font-black text-lg text-slate-900 mt-1">
            Item-by-Item Sales Forecasting
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any Aircon Unit, Spare Part, or Accessory to view its individual demand forecast.
          </p>
        </div>

        {/* Forecast Category Segment Toggle Controls */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-4 text-[11px] font-extrabold overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setForecastCategory('all');
              setSelectedForecastItemId('all');
            }}
            className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              forecastCategory === 'all' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Sales
          </button>
          <button
            onClick={() => {
              setForecastCategory('units');
              setSelectedForecastItemId('all');
            }}
            className={`flex-1 min-w-[85px] py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              forecastCategory === 'units' 
                ? 'bg-teal-primary text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Aircon Units
          </button>
          <button
            onClick={() => {
              setForecastCategory('parts');
              setSelectedForecastItemId('all');
            }}
            className={`flex-1 min-w-[80px] py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              forecastCategory === 'parts' 
                ? 'bg-navy-mid text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Spare Parts
          </button>
          <button
            onClick={() => {
              setForecastCategory('accessories');
              setSelectedForecastItemId('all');
            }}
            className={`flex-1 min-w-[85px] py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              forecastCategory === 'accessories' 
                ? 'bg-purple-700 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Accessories
          </button>
        </div>

        {/* SPECIFIC ITEM SELECTOR DROPDOWN / CHIPS */}
        <div className="mt-3.5">
          <label className="block text-[11px] font-extrabold text-slate-700 mb-1 flex items-center justify-between">
            <span>Select Specific Inventory Item:</span>
            {selectedForecastItem && (
              <button 
                onClick={() => setSelectedForecastItemId('all')}
                className="text-teal-700 hover:underline text-[10px] font-bold cursor-pointer"
              >
                Reset to Aggregated View
              </button>
            )}
          </label>
          
          <div className="relative">
            <button
              onClick={() => setIsItemForecastDropdownOpen(!isItemForecastDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Package className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">
                  {selectedForecastItem 
                    ? `${selectedForecastItem.itemName} (${selectedForecastItem.model})`
                    : `All Items in ${forecastCategory === 'units' ? 'Aircon Units' : forecastCategory === 'parts' ? 'Spare Parts' : forecastCategory === 'accessories' ? 'Accessories' : 'All Categories'} (${forecastCategoryItems.length})`
                  }
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isItemForecastDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isItemForecastDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-2 max-h-56 overflow-y-auto">
                <div
                  onClick={() => {
                    setSelectedForecastItemId('all');
                    setIsItemForecastDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between transition-colors ${
                    selectedForecastItemId === 'all' ? 'bg-teal-50 text-teal-800 font-extrabold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>📊 Category Aggregated Forecast</span>
                  <span className="text-[10px] text-slate-400">All Items</span>
                </div>

                <div className="my-1 border-t border-slate-100" />

                {forecastCategoryItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedForecastItemId(item.id);
                      setIsItemForecastDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between transition-colors ${
                      selectedForecastItemId === item.id ? 'bg-teal-50 text-teal-800 font-extrabold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate text-slate-900 font-bold">{item.itemName}</span>
                      <span className="text-[10px] text-slate-400">{item.category} • {item.model}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                      Stock: {item.qty}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Item KPI Metrics Header */}
        {selectedForecastItem && (
          <div className="mt-4 p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-wide">
                  Item Analysis
                </span>
                <h3 className="font-display font-extrabold text-sm text-slate-900 leading-tight mt-0.5">
                  {selectedForecastItem.itemName}
                </h3>
              </div>
              <span className="text-xs font-black text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg">
                {selectedForecastItem.model}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-1 pt-2 border-t border-teal-100 text-[11px]">
              <div className="bg-white p-2 rounded-xl border border-teal-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-500">Current Stock</span>
                <span className="font-black text-slate-900 text-xs mt-0.5">{selectedForecastItem.qty} pcs</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-teal-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-500">Peak Demand</span>
                <span className="font-black text-teal-700 text-xs mt-0.5">Apr–May Peak</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-teal-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-500">Reorder Level</span>
                <span className="font-black text-amber-700 text-xs mt-0.5">≤ 10 pcs</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic SVG Bar Chart */}
        <div className="relative h-44 mt-5 select-none">
          <svg className="w-full h-full" viewBox="0 0 340 170" preserveAspectRatio="none">
            <defs>
              <linearGradient id="barGradUnits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6"/>
                <stop offset="100%" stopColor="#0d9488"/>
              </linearGradient>
              <linearGradient id="barGradParts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b"/>
                <stop offset="100%" stopColor="#334155"/>
              </linearGradient>
              <linearGradient id="barGradAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7e22ce"/>
                <stop offset="100%" stopColor="#a855f7"/>
              </linearGradient>
              <linearGradient id="barGradAll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb"/>
                <stop offset="100%" stopColor="#60a5fa"/>
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="30" y1="10" x2="340" y2="10" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="55" x2="340" y2="55" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="100" x2="340" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="145" x2="340" y2="145" stroke="#cbd5e1" strokeWidth="1.2" />
            
            {/* Grid labels */}
            {(() => {
              const maxV = Math.max(...currentChartData, 10);
              return (
                <>
                  <text x="0" y="14" fontSize="8" fill="#64748b" fontWeight="800">{Math.round(maxV)}</text>
                  <text x="0" y="59" fontSize="8" fill="#64748b" fontWeight="800">{Math.round(maxV * 0.66)}</text>
                  <text x="0" y="104" fontSize="8" fill="#64748b" fontWeight="800">{Math.round(maxV * 0.33)}</text>
                  <text x="12" y="149" fontSize="8" fill="#64748b" fontWeight="800">0</text>
                </>
              );
            })()}
            
            {/* Bars rendering */}
            {animatedHeights.map((h, i) => {
              const bWidth = 14;
              const bGap = 11;
              const xPos = 35 + i * (bWidth + bGap);
              const yPos = 145 - h;
              let fillGrad = 'url(#barGradAll)';
              if (forecastCategory === 'units') fillGrad = 'url(#barGradUnits)';
              if (forecastCategory === 'parts') fillGrad = 'url(#barGradParts)';
              if (forecastCategory === 'accessories') fillGrad = 'url(#barGradAcc)';
              
              return (
                <rect 
                  key={i}
                  x={xPos}
                  y={yPos}
                  width={bWidth}
                  height={h}
                  rx="3.5"
                  fill={fillGrad}
                  className="transition-all duration-500 ease-out"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Month abbreviation labels */}
        <div className="flex justify-between pl-8 pr-1 mt-1 text-[10px] font-extrabold text-slate-400 uppercase font-sans">
          {MONTH_NAMES.map(m => (
            <span key={m}>{m}</span>
          ))}
        </div>

        {/* Predictive Demand & Business Planning Insights Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-black text-slate-900">
            <BarChart3 className="w-4 h-4 text-teal-primary" />
            Demand Estimation & Business Planning Insights
          </div>
          
          <div className="text-slate-600 space-y-2 leading-relaxed text-[11px]">
            {selectedForecastItem ? (
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-primary mt-1.5 shrink-0" />
                <span>
                  <strong>Specific Demand Forecast for {selectedForecastItem.itemName}:</strong> Expected demand for <strong>{selectedYear}</strong> is highest during Q2 summer months. Reorder stock when inventory drops below <strong>10 units</strong>.
                </span>
              </p>
            ) : (
              <>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Peak Season Surge:</strong> Historical analytics indicate a <strong>220% demand spike</strong> during summer months (April–May) for Aircon Units and installation accessories.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-navy-mid mt-1.5 shrink-0" />
                  <span>
                    <strong>Procurement Recommendation:</strong> Restock <strong>Spare Parts & Accessories</strong> by early March to ensure zero downtime during summer service rush.
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS & FORMS OVERLAYS ================= */}
      
      {/* 1. Add Item Overlay */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900">
                Add Item & Auto-Generate QR
              </h3>
              <button 
                onClick={() => setIsAddItemOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. AUX Inverter Split-Type 1.5HP" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Model Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. AUX-12INV-HG" 
                  value={newItemModel}
                  onChange={(e) => setNewItemModel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                >
                  <option value="Aircon Units">Aircon Units</option>
                  <option value="Spare Parts">Spare Parts</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Unit Price</label>
                <input 
                  type="text" 
                  placeholder="e.g. ₱28,900.00" 
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Unit Bay A-2" 
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl py-1.5 px-3 bg-slate-50/50">
                  <button 
                    type="button"
                    onClick={() => setNewItemQty(prev => Math.max(0, prev - 1))}
                    disabled={newItemQty <= 0}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 cursor-pointer"
                  >
                    –
                  </button>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      min="0"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-center font-display font-black text-base text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-400">pcs</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewItemQty(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-teal-500/10"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Record Services Overlay */}
      {isRecordServiceOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900">
                Record New Service
              </h3>
              <button 
                onClick={() => setIsRecordServiceOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maria Santos" 
                  value={srvCustomer}
                  onChange={(e) => setSrvCustomer(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 0917 123 4567" 
                  value={srvPhone}
                  onChange={(e) => setSrvPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pulilan, Bulacan" 
                  value={srvAddress}
                  onChange={(e) => setSrvAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold"
                />
              </div>

              {/* Service Category custom dropdown */}
              <div className="relative">
                <label className="block text-slate-700 font-bold mb-1">Service Category</label>
                <div 
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 flex items-center justify-between cursor-pointer font-semibold"
                >
                  <span>{srvCategory}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isCatDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 max-h-36 overflow-y-auto">
                    {CATEGORY_OPTIONS.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => {
                          setSrvCategory(opt);
                          setIsCatDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-teal-50 hover:text-teal-700 cursor-pointer font-semibold"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Aircon Item custom dropdown */}
              <div className="relative">
                <label className="block text-slate-700 font-bold mb-1">Primary Unit / Item Serviced</label>
                <div 
                  onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 flex items-center justify-between cursor-pointer font-semibold"
                >
                  <span className={srvItem ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                    {srvItem || 'Select catalog item'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isItemDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isItemDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 max-h-48 overflow-y-auto">
                    {inventory.map(invItem => (
                      <div 
                        key={invItem.id}
                        onClick={() => {
                          setSrvItem(invItem.itemName);
                          setIsItemDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-teal-50 hover:text-teal-700 cursor-pointer font-semibold text-xs flex justify-between"
                      >
                        <span>{invItem.itemName}</span>
                        <span className="text-slate-400 font-normal">({invItem.qty} left)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Used Inventory Items Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">Inventory Parts Used During Service</label>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {srvPartsUsed.length} parts selected
                  </span>
                </div>

                {/* Search input for available parts */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search active parts or accessories..."
                    value={srvPartsSearch}
                    onChange={(e) => setSrvPartsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-primary placeholder:text-slate-400"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {inventory
                    .filter(i => !i.isArchived)
                    .filter(i => {
                      if (!srvPartsSearch.trim()) return true;
                      const q = srvPartsSearch.toLowerCase();
                      return i.itemName.toLowerCase().includes(q) || i.model.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
                    })
                    .map(part => {
                      const selected = srvPartsUsed.find(p => p.itemId === part.id);
                      return (
                        <div key={part.id} className="flex items-center justify-between text-[11px] font-semibold bg-white p-2 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-slate-800 truncate">{part.itemName}</span>
                            <span className="text-[10px] text-slate-500">{part.category} • {part.price || '₱500.00'} • <span className={part.qty > 0 ? 'text-teal-700 font-bold' : 'text-red-500 font-bold'}>Stock: {part.qty}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {selected ? (
                              <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setSrvPartsUsed(prev => prev.map(p => p.itemId === part.id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));
                                  }}
                                  className="font-black text-teal-800 px-1 hover:bg-teal-100 rounded"
                                >
                                  –
                                </button>
                                <span className="font-extrabold text-teal-900">{selected.qty}</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setSrvPartsUsed(prev => prev.map(p => p.itemId === part.id ? { ...p, qty: p.qty + 1 } : p));
                                  }}
                                  className="font-black text-teal-800 px-1 hover:bg-teal-100 rounded"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSrvPartsUsed(prev => [...prev, { itemId: part.id, qty: 1 }]);
                                }}
                                disabled={part.qty <= 0}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                  part.qty > 0 
                                    ? 'text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer' 
                                    : 'text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed'
                                }`}
                              >
                                {part.qty > 0 ? '+ Add' : 'Out of Stock'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes</label>
                <textarea 
                  placeholder="Detailed findings or service notes..."
                  value={srvNotes}
                  onChange={(e) => setSrvNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary text-xs font-semibold resize-none"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsRecordServiceOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-teal-500/10"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Low Stock Alerts overlay list */}
      {isLsaOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-display font-black text-base">
                <ShieldAlert className="w-5 h-5 text-red-primary" />
                Low Stock Alerts
              </div>
              <button 
                onClick={() => setIsLsaOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 mt-4 max-h-60 overflow-y-auto no-scrollbar">
              {inventory.filter(item => item.qty <= 10).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{item.itemName}</span>
                    <span className="text-[10px] text-slate-500">{item.category} • {item.model}</span>
                  </div>
                  <span className="text-xs font-black text-red-primary px-2.5 py-1 rounded bg-red-50">
                    {item.qty} left
                  </span>
                </div>
              ))}
              {lowStockCount === 0 && (
                <div className="text-center py-6 text-slate-400 font-semibold text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-primary" />
                  All catalog items are well stocked 🎉
                </div>
              )}
            </div>

            <div className="mt-5">
              <button 
                onClick={() => {
                  setIsLsaOpen(false);
                  setTimeout(() => setIsAddItemOpen(true), 200);
                }}
                className="w-full bg-teal-primary hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10"
              >
                <Plus className="w-4 h-4" />
                Restock / Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
