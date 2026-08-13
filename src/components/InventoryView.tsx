import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ArrowLeft, Plus, Minus, Package, MapPin, Box, QrCode, Edit2, Trash2, X, Printer, Check, Tag, Archive, RotateCcw, BarChart3, Info } from 'lucide-react';
import { InventoryItem } from '../types';
import { generateQrDataUrl, createFallbackQrSvg } from '../utils/qrHelper';
import { getItemMonthlyForecast, MONTH_NAMES } from '../data';

interface InventoryViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onShowToast: (msg: string) => void;
}

type InvSubScreen = 'list' | 'details' | 'stepper';

export default function InventoryView({
  inventory,
  setInventory,
  onShowToast
}: InventoryViewProps) {
  const [subScreen, setSubScreen] = useState<InvSubScreen>('list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isArchiveView, setIsArchiveView] = useState(false);

  // Stepper quantity adjustment state
  const [qtyAdjustment, setQtyAdjustment] = useState(0);

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [archivingItemId, setArchivingItemId] = useState<number | null>(null);
  const [qrModalItem, setQrModalItem] = useState<InventoryItem | null>(null);
  const [forecastModalItem, setForecastModalItem] = useState<InventoryItem | null>(null);

  // Counts
  const activeCount = useMemo(() => inventory.filter(i => !i.isArchived).length, [inventory]);
  const archiveCount = useMemo(() => inventory.filter(i => i.isArchived).length, [inventory]);

  // Form inputs for Add
  const [addName, setAddName] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addCategory, setAddCategory] = useState('Aircon Units');
  const [addLocation, setAddLocation] = useState('');
  const [addPrice, setAddPrice] = useState('₱1,500.00');
  const [addQty, setAddQty] = useState(1);

  // Form inputs for Edit
  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState(0);

  // Filter items based on archive status, search input & category tab
  const filteredItems = useMemo(() => {
    let result = inventory;
    if (isArchiveView) {
      result = result.filter(item => item.isArchived === true);
    } else {
      result = result.filter(item => !item.isArchived);
    }

    if (categoryFilter !== 'All') {
      result = result.filter(item => item.category === categoryFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(item => 
        item.itemName.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.qrCode && item.qrCode.toLowerCase().includes(q))
      );
    }
    return result;
  }, [inventory, searchQuery, categoryFilter, isArchiveView]);

  // Selected item reference
  const selectedItem = useMemo(() => {
    if (selectedItemId === null) return null;
    return inventory.find(item => item.id === selectedItemId) || null;
  }, [inventory, selectedItemId]);

  const handleOpenDetails = (id: number) => {
    setSelectedItemId(id);
    setSubScreen('details');
  };

  const handleOpenStepper = () => {
    setQtyAdjustment(0);
    setSubScreen('stepper');
  };

  // Confirm stock stepper adjustment
  const handleConfirmAdjustment = () => {
    if (selectedItemId === null || !selectedItem) return;

    const newQty = Math.max(0, selectedItem.qty + qtyAdjustment);
    setInventory(prev => prev.map(item => {
      if (item.id === selectedItemId) {
        return { ...item, qty: newQty };
      }
      return item;
    }));

    onShowToast(`Updated ${selectedItem.itemName} stock to ${newQty}!`);
    setSubScreen('details');
  };

  // ACTION: Add New Inventory Item
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      onShowToast('Please enter item name');
      return;
    }

    const nextId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    const qrCodeStr = `AUX-${addCategory === 'Aircon Units' ? 'UNIT' : 'PART'}-${nextId}-${Date.now().toString().slice(-4)}`;
    
    // Auto-generate QR Data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await generateQrDataUrl(qrCodeStr);
    } catch {
      qrDataUrl = createFallbackQrSvg(qrCodeStr);
    }

    const newItem: InventoryItem = {
      id: nextId,
      name: `Item ${String.fromCharCode(65 + (inventory.length % 26))}`,
      itemName: addName.trim(),
      model: addModel.trim() || 'AUX-GENERIC',
      category: addCategory,
      qty: Math.max(0, addQty),
      location: addLocation.trim() || 'Shelf Main',
      price: addPrice.trim() || '₱1,000.00',
      qrCode: qrCodeStr,
      qrDataUrl: qrDataUrl
    };

    setInventory(prev => [...prev, newItem]);
    onShowToast(`Added ${newItem.itemName} with auto-generated QR code!`);

    // Reset & close
    setAddName('');
    setAddModel('');
    setAddCategory('Aircon Units');
    setAddLocation('');
    setAddPrice('₱1,500.00');
    setAddQty(1);
    setIsAddItemOpen(false);
  };

  // ACTION: Open Edit Modal
  const handleStartEdit = (item: InventoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditName(item.itemName);
    setEditModel(item.model);
    setEditCategory(item.category);
    setEditLocation(item.location);
    setEditPrice(item.price || '₱1,000.00');
    setEditQty(item.qty);
  };

  // ACTION: Submit Edit Item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      onShowToast('Item name cannot be empty');
      return;
    }

    setInventory(prev => prev.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          itemName: editName.trim(),
          model: editModel.trim() || item.model,
          category: editCategory,
          location: editLocation.trim() || item.location,
          price: editPrice.trim() || item.price,
          qty: Math.max(0, editQty)
        };
      }
      return item;
    }));

    onShowToast(`Updated ${editName.trim()} successfully!`);
    setEditingItem(null);
  };

  // ACTION: Confirm Archive
  const handleConfirmArchive = () => {
    if (archivingItemId === null) return;
    const target = inventory.find(i => i.id === archivingItemId);
    if (target) {
      setInventory(prev => prev.map(i => i.id === archivingItemId ? { ...i, isArchived: true } : i));
      onShowToast(`Moved "${target.itemName}" to Archives.`);
    }
    setArchivingItemId(null);
    if (selectedItemId === archivingItemId) {
      setSubScreen('list');
    }
  };

  // ACTION: Restore Item from Archives
  const handleRestoreItem = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = inventory.find(i => i.id === id);
    if (target) {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, isArchived: false } : i));
      onShowToast(`Restored "${target.itemName}" to Active Inventory!`);
    }
  };

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'text-red-primary bg-red-50 border-red-200' };
    if (qty <= 10) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'In Stock', color: 'text-green-700 bg-green-50 border-green-200' };
  };

  return (
    <div className="w-full min-h-screen pb-28 pt-4 font-sans select-none">
      
      {/* 1. LIST SCREEN */}
      {subScreen === 'list' && (
        <div className="animate-fade-in">
          
          <div className="flex items-center justify-between px-6 mt-2">
            <div>
              <h1 className="font-display font-extrabold text-2xl text-slate-900">
                Inventory Catalog
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Manage Aircon Units, Spare Parts & QR codes
              </p>
            </div>

            {/* Add Item Trigger Button */}
            <button 
              onClick={() => setIsAddItemOpen(true)}
              className="bg-teal-primary hover:bg-teal-dark text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md shadow-teal-500/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Active Catalog vs Archives Toggle Header */}
          <div className="flex items-center justify-between px-6 mt-3">
            <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-2xl w-full text-xs font-black">
              <button
                onClick={() => setIsArchiveView(false)}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isArchiveView 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 text-teal-600" />
                Active Inventory ({activeCount})
              </button>
              <button
                onClick={() => setIsArchiveView(true)}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isArchiveView 
                    ? 'bg-amber-600 text-white shadow-sm font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive className="w-4 h-4" />
                Archives ({archiveCount})
              </button>
            </div>
          </div>

          {/* Search bar input block */}
          <div className="px-6 mt-3.5">
            <div className="relative flex items-center bg-teal-primary rounded-2xl py-3 px-4 shadow-lg shadow-teal-700/10 transition-all focus-within:shadow-teal-700/20">
              <Search className="w-4 h-4 text-white shrink-0 mr-3" />
              <input 
                type="text"
                placeholder={isArchiveView ? "Search archived items..." : "Search Item, Model, Category or QR..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-bold text-sm placeholder-white/80 w-full"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 px-6 mt-3.5 overflow-x-auto no-scrollbar text-xs font-bold">
            {['All', 'Aircon Units', 'Spare Parts', 'Accessories'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-navy-mid text-white shadow-md shadow-navy-500/10' 
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Archive Info Banner */}
          {isArchiveView && (
            <div className="mx-6 mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-700 shrink-0" />
                Archived items are hidden from service records & main catalog.
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                {filteredItems.length} Archived
              </span>
            </div>
          )}

          {/* Items Container Panel */}
          <div className="mx-6 mt-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 px-1">
              <h2 className="font-display font-extrabold text-base text-slate-900">
                {isArchiveView ? 'Archived Items' : 'Active Catalog'} ({filteredItems.length})
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {isArchiveView ? 'Click Restore to bring back item' : 'Click item to manage or QR to scan'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredItems.map(item => {
                const status = getStockStatus(item.qty);
                const itemQrData = item.qrDataUrl || createFallbackQrSvg(item.qrCode || item.itemName);

                return (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenDetails(item.id)}
                    className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all cursor-pointer group relative ${
                      isArchiveView ? 'bg-amber-50/20 border-amber-200/60 hover:border-amber-400' : 'bg-slate-50/40 border-slate-100 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      
                      {/* Box QR Code Thumbnail Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrModalItem(item);
                        }}
                        title="Click to view QR Code"
                        className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex flex-col items-center justify-center shrink-0 shadow-xs hover:border-teal-500 hover:scale-105 transition-all group/qr"
                      >
                        <img 
                          src={itemQrData} 
                          alt="Item QR" 
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-[8px] font-black text-slate-500 group-hover/qr:text-teal-600 leading-none mt-0.5">
                          QR
                        </span>
                      </button>

                      {/* Main info text */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-[14px] text-slate-900 truncate leading-snug">
                            {item.itemName}
                          </span>
                          {item.isArchived && (
                            <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {item.model}
                          </span>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60">
                            {item.price || '₱1,000.00'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${status.color}`}>
                            {status.label}: {item.qty}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 truncate">
                            📍 {item.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on card */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isArchived ? (
                        <>
                          <button 
                            onClick={(e) => handleStartEdit(item, e)}
                            title="Edit Item"
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchivingItemId(item.id);
                            }}
                            title="Move to Archives"
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={(e) => handleRestoreItem(item.id, e)}
                          title="Restore Item"
                          className="px-2.5 py-1.5 rounded-lg bg-teal-primary hover:bg-teal-dark text-white text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      )}
                      <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-semibold text-xs flex flex-col items-center gap-2">
                  <Package className="w-10 h-10 text-slate-300 animate-pulse" />
                  No items match the query in directory.
                  <button 
                    onClick={() => setIsAddItemOpen(true)}
                    className="mt-2 text-teal-primary font-bold hover:underline"
                  >
                    + Add New Item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ITEM DETAILS SCREEN */}
      {subScreen === 'details' && selectedItem && (
        <div className="animate-fade-in px-6">
          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => setSubScreen('list')}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </button>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setQrModalItem(selectedItem)}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                View QR
              </button>
              <button 
                onClick={() => handleStartEdit(selectedItem)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>

          <h2 className="font-display font-black text-2xl mt-5 text-slate-900 leading-tight">
            {selectedItem.itemName}
          </h2>

          {/* Hero visual icon card with QR display */}
          <div className="w-full rounded-3xl bg-gradient-to-br from-navy-mid via-navy-deep to-slate-900 p-6 text-white mt-4 shadow-xl flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                {selectedItem.category}
              </span>
              <span className="font-display font-extrabold text-lg text-white leading-snug">
                {selectedItem.itemName}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Model: {selectedItem.model}
              </span>
              <span className="text-sm font-black text-teal-300 mt-1">
                Unit Price: {selectedItem.price || '₱1,000.00'}
              </span>
            </div>

            <div 
              onClick={() => setQrModalItem(selectedItem)}
              className="w-24 h-24 bg-white p-2 rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer shadow-lg hover:scale-105 transition-transform"
            >
              <img 
                src={selectedItem.qrDataUrl || createFallbackQrSvg(selectedItem.qrCode || selectedItem.itemName)} 
                alt="QR Code"
                className="w-16 h-16 object-contain" 
              />
              <span className="text-[9px] font-extrabold text-slate-900 mt-1">
                SCAN QR
              </span>
            </div>
          </div>

          {/* Detailed field listings */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 mt-5 shadow-sm divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">QR Code Payload</span>
              <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
                {selectedItem.qrCode || `AUX-INV-${selectedItem.id}`}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">Item Name</span>
              <span className="font-semibold text-slate-600">{selectedItem.itemName}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">Model Number</span>
              <span className="font-semibold text-slate-600">{selectedItem.model}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">Category</span>
              <span className="font-semibold text-slate-600">{selectedItem.category}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">Current Stock</span>
              <span className={`font-black px-2.5 py-1 rounded border ${getStockStatus(selectedItem.qty).color}`}>
                {selectedItem.qty} units
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-bold text-slate-800">Assigned Location</span>
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                {selectedItem.location}
              </span>
            </div>
          </div>

          {/* Buttons actions */}
          <div className="flex flex-col gap-2.5 mt-6">
            <button 
              onClick={() => setForecastModalItem(selectedItem)}
              className="w-full bg-navy-mid hover:bg-navy-deep text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md shadow-navy-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              View Sales & Demand Forecast
            </button>

            <div className="flex gap-3">
              {!selectedItem.isArchived ? (
                <button 
                  onClick={() => setArchivingItemId(selectedItem.id)}
                  className="flex-1 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Archive className="w-4 h-4 text-amber-700" />
                  Archive Item
                </button>
              ) : (
                <button 
                  onClick={() => handleRestoreItem(selectedItem.id)}
                  className="flex-1 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-teal-600" />
                  Restore Item
                </button>
              )}

              <button 
                onClick={handleOpenStepper}
                className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-teal-500/10 cursor-pointer active:scale-[0.98] transition-transform"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. STEPPER SELECTION SCREEN */}
      {subScreen === 'stepper' && selectedItem && (
        <div className="animate-fade-in px-6">
          <button 
            onClick={() => setSubScreen('details')}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl mt-2 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>

          <h2 className="font-display font-black text-2xl mt-5 text-slate-900 text-center">
            Update Stock Quantity
          </h2>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mt-5 shadow-sm text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold text-slate-800">
              <span>Current Stock</span>
              <span className="text-sm font-black">{selectedItem.qty} units</span>
            </div>

            {/* Adjustment Stepper Buttons */}
            <div className="flex items-center justify-center gap-4 py-8 border-b border-slate-100">
              <button 
                onClick={() => setQtyAdjustment(prev => prev - 1)}
                disabled={(selectedItem.qty + qtyAdjustment) <= 0}
                className="w-12 h-12 rounded-full bg-teal-primary text-white hover:bg-teal-dark flex items-center justify-center font-bold text-xl cursor-pointer disabled:opacity-40 transition-all shadow-md shadow-teal-500/15"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              
              <div className="bg-navy-mid text-white px-8 py-3 rounded-xl min-w-[100px] shadow-inner text-center font-display font-black text-lg">
                {qtyAdjustment >= 0 ? `+${qtyAdjustment}` : qtyAdjustment}
              </div>

              <button 
                onClick={() => setQtyAdjustment(prev => prev + 1)}
                className="w-12 h-12 rounded-full bg-teal-primary text-white hover:bg-teal-dark flex items-center justify-center font-bold text-xl cursor-pointer transition-all shadow-md shadow-teal-500/15"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 text-sm font-black text-slate-800">
              <span>New Total Stock</span>
              <span className="text-base text-teal-dark font-display">
                {selectedItem.qty + qtyAdjustment} units
              </span>
            </div>

            <div className="flex gap-3.5 mt-7">
              <button 
                onClick={() => setSubScreen('details')}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs py-3.5 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAdjustment}
                className="flex-1 bg-navy-mid hover:bg-navy-light text-white font-extrabold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow-md shadow-navy-500/10"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS & DIALOG OVERLAYS ================= */}

      {/* A. ADD NEW ITEM MODAL WITH AUTO QR GENERATION */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900">
                Add Inventory Item & Generate QR
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
                  placeholder="e.g. AUX Inverter Split-Type 2.5HP" 
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Model Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. AUX-24INV-JS" 
                  value={addModel}
                  onChange={(e) => setAddModel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select 
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold cursor-pointer"
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
                  placeholder="e.g. ₱32,500.00" 
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Shelf Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Unit Bay A-3 or Shelf B" 
                  value={addLocation}
                  onChange={(e) => setAddLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Quantity</label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl py-1.5 px-3 bg-slate-50/50">
                  <button 
                    type="button"
                    onClick={() => setAddQty(prev => Math.max(0, prev - 1))}
                    disabled={addQty <= 0}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 cursor-pointer"
                  >
                    –
                  </button>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      min="0"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-center font-display font-black text-base text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-400">pcs</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAddQty(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200/60 rounded-xl text-[11px] text-teal-800 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal-600 shrink-0" />
                <span>System will auto-generate a unique QR code for camera scanning.</span>
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
                  Add & Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900">
                Edit Item Details
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Model Number</label>
                <input 
                  type="text" 
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
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
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Shelf Location</label>
                <input 
                  type="text" 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:border-teal-primary focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantity</label>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl py-1.5 px-3 bg-slate-50/50">
                  <button 
                    type="button"
                    onClick={() => setEditQty(prev => Math.max(0, prev - 1))}
                    disabled={editQty <= 0}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 cursor-pointer"
                  >
                    –
                  </button>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-center font-display font-black text-base text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-400">pcs</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditQty(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-teal-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-navy-mid hover:bg-navy-light text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-navy-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ARCHIVE ITEM CONFIRMATION DIALOG */}
      {archivingItemId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6 z-100 animate-fade-in font-sans select-none">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-base text-slate-900">
              Archive Inventory Item?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This item will be hidden from the active catalog and service records, but can be restored anytime from the Archives tab.
            </p>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setArchivingItemId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmArchive}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-500/10"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. ITEM SALES FORECAST MODAL */}
      {forecastModalItem && (() => {
        const monthlyForecast = getItemMonthlyForecast(forecastModalItem);
        const maxVal = Math.max(...monthlyForecast, 1);
        const totalAnnualDemand = monthlyForecast.reduce((a, b) => a + b, 0);
        const peakMonthIdx = monthlyForecast.indexOf(maxVal);
        const peakMonthName = MONTH_NAMES[peakMonthIdx] || 'Jul';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-100 select-none animate-fade-in font-sans">
            <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Item Sales Forecast & Analytics
                </span>
                <button 
                  onClick={() => setForecastModalItem(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Item Summary header */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-slate-900">{forecastModalItem.itemName}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">{forecastModalItem.category} • Model: {forecastModalItem.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Stock</span>
                  <span className="font-black text-sm text-teal-700">{forecastModalItem.qty} units</span>
                </div>
              </div>

              {/* Annual stats row */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-3 bg-teal-50/60 border border-teal-200/60 rounded-2xl text-center">
                  <span className="text-[10px] text-teal-800 font-bold block uppercase">Est. Annual Sales</span>
                  <span className="font-display font-black text-lg text-teal-900">{totalAnnualDemand} units</span>
                </div>
                <div className="p-3 bg-cyan-50/60 border border-cyan-200/60 rounded-2xl text-center">
                  <span className="text-[10px] text-cyan-800 font-bold block uppercase">Peak Demand Month</span>
                  <span className="font-display font-black text-lg text-cyan-900">{peakMonthName} ({maxVal} u)</span>
                </div>
              </div>

              {/* 12 Month Bar Graph */}
              <div className="mt-4">
                <span className="text-xs font-extrabold text-slate-800 block mb-2">Monthly Demand Projection (2026)</span>
                <div className="h-36 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-end justify-between gap-1">
                  {monthlyForecast.map((val, idx) => {
                    const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));
                    const isPeak = idx === peakMonthIdx;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          {val}
                        </div>
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all ${
                            isPeak 
                              ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-sm' 
                              : 'bg-slate-300 hover:bg-teal-500'
                          }`}
                        />
                        <span className={`text-[9px] font-extrabold ${isPeak ? 'text-teal-700' : 'text-slate-400'}`}>
                          {MONTH_NAMES[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex gap-2 text-xs">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-amber-900">
                  <span className="font-extrabold block">Demand Planning Tip:</span>
                  <p className="text-[11px] font-semibold text-amber-800 mt-0.5 leading-snug">
                    Forecast peak occurs in <strong className="font-black text-amber-950">{peakMonthName}</strong>. Keep buffer stock around {Math.ceil(maxVal * 1.2)} units before peak months to prevent stockouts.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setForecastModalItem(null)}
                className="w-full mt-5 bg-teal-primary hover:bg-teal-dark text-white font-black text-xs py-3 rounded-xl shadow-md cursor-pointer"
              >
                Close Forecast
              </button>
            </div>
          </div>
        );
      })()}

      {/* E. QR CODE EXPANDED VIEW MODAL */}
      {qrModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-600" />
                Item QR Code Label
              </span>
              <button 
                onClick={() => setQrModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-md">
                <img 
                  src={qrModalItem.qrDataUrl || createFallbackQrSvg(qrModalItem.qrCode || qrModalItem.itemName)} 
                  alt="Item QR Code"
                  className="w-48 h-48 object-contain mx-auto" 
                />
              </div>

              <h3 className="font-display font-extrabold text-base text-slate-900 mt-4">
                {qrModalItem.itemName}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Model: {qrModalItem.model} • {qrModalItem.category}
              </p>
              <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg mt-2 border border-teal-200/80">
                {qrModalItem.qrCode || `AUX-INV-${qrModalItem.id}`}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-xs flex justify-between items-center text-slate-700 font-bold mb-5 border border-slate-100">
              <span>Location: {qrModalItem.location}</span>
              <span className="text-teal-700 font-black">In Stock: {qrModalItem.qty}</span>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  onShowToast(`Printing QR Code label for ${qrModalItem.itemName}...`);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                Print Label
              </button>
              <button 
                onClick={() => setQrModalItem(null)}
                className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer shadow-md shadow-teal-500/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
