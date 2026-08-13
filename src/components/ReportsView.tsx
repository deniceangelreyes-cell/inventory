import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronRight, ArrowLeft, Filter, FileText, CheckCircle2, Clock, 
  AlertCircle, Calendar, MapPin, User, Tag, Plus, X, Package, Edit3, 
  Trash2, Ban, Lock, PlusCircle, RotateCcw, ShieldAlert, Info, FileCheck, Check, ShoppingCart, UserCheck, CreditCard, Printer
} from 'lucide-react';
import { ServiceRecord, InventoryItem, ServiceStatus, BuyerSaleItem } from '../types';
import { STATUS_OPTIONS, CATEGORY_OPTIONS, SORT_OPTIONS } from '../data';

interface ReportsViewProps {
  reports: ServiceRecord[];
  setReports: React.Dispatch<React.SetStateAction<ServiceRecord[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onShowToast: (msg: string) => void;
}

export default function ReportsView({
  reports,
  setReports,
  inventory,
  setInventory,
  onShowToast
}: ReportsViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Report Type Tab: 'all' | 'service' | 'buyer_sale'
  const [reportTypeTab, setReportTypeTab] = useState<'all' | 'service' | 'buyer_sale'>('all');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Newest First');

  // Modal State 1: New Report
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [newReportType, setNewReportType] = useState<'service' | 'buyer_sale'>('service');

  // Service Report Fields
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Repair');
  const [itemServiced, setItemServiced] = useState('');
  const [initialStatus, setInitialStatus] = useState<ServiceStatus>('In Progress');
  const [technician, setTechnician] = useState('John Cruz');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('₱3,200.00');
  const [selectedParts, setSelectedParts] = useState<{ itemId: number; qty: number }[]>([]);

  // Buyer Sale Fields
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerPurchaseDate, setBuyerPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [buyerFulfillmentType, setBuyerFulfillmentType] = useState<'In-Store Pick Up' | 'For Delivery'>('In-Store Pick Up');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Bank Transfer' | 'Credit Card'>('Cash');
  const [cashierName, setCashierName] = useState('John Cruz');
  const [buyerSaleItems, setBuyerSaleItems] = useState<{ itemId: number; qty: number }[]>([]);

  // Part / Item Picker temporary state
  const [partPickerId, setPartPickerId] = useState<number>(inventory[0]?.id || 1);
  const [partPickerQty, setPartPickerQty] = useState<number>(1);

  // Modal State 2: Edit Report
  const [editingReport, setEditingReport] = useState<ServiceRecord | null>(null);
  const [editCustomer, setEditCustomer] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCategory, setEditCategory] = useState('Repair');
  const [editItem, setEditItem] = useState('');
  const [editStatus, setEditStatus] = useState<ServiceStatus>('Scheduled');
  const [editTechnician, setEditTechnician] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editParts, setEditParts] = useState<{ itemId: number; qty: number }[]>([]);

  // Modal State 3: Delete Confirmation (Scheduled only)
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<ServiceRecord | null>(null);

  // Modal State 4: Cancel Transaction (In Progress & Scheduled)
  const [cancelConfirmReport, setCancelConfirmReport] = useState<ServiceRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modal State 5: Adjustment / Correction Transaction (For Completed records)
  const [adjustmentBaseReport, setAdjustmentBaseReport] = useState<ServiceRecord | null>(null);
  const [adjNotes, setAdjNotes] = useState('');
  const [adjAmount, setAdjAmount] = useState('₱0.00');

  const parseUnitPrice = (priceStr?: string): number => {
    if (!priceStr) return 1000;
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 1000 : num;
  };

  const selectedReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Filtered & sorted reports list
  const filteredReports = useMemo(() => {
    let result = reports;

    // Report Type Filter
    if (reportTypeTab === 'service') {
      result = result.filter(r => (r.reportType || 'service') === 'service');
      if (statusFilter !== 'All Status' && statusFilter !== 'Transaction History') {
        result = result.filter(r => r.status === statusFilter);
      }
    } else if (reportTypeTab === 'buyer_sale') {
      result = result.filter(r => r.reportType === 'buyer_sale');
      if (statusFilter === 'In-Store Pick Up') {
        result = result.filter(r => r.fulfillmentType === 'In-Store Pick Up' || r.address === 'In-Store Pick Up' || r.address.toLowerCase().includes('pickup') || r.address.toLowerCase().includes('store'));
      } else if (statusFilter === 'For Delivery') {
        result = result.filter(r => r.fulfillmentType === 'For Delivery' || r.address === 'For Delivery' || (r.address !== 'In-Store Pick Up' && !r.address.toLowerCase().includes('store')));
      }
    } else {
      if (statusFilter !== 'All Status' && statusFilter !== 'Transaction History') {
        result = result.filter(r => r.status === statusFilter);
      }
    }

    if (categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.item.toLowerCase().includes(q) ||
        r.technician.toLowerCase().includes(q) ||
        (r.cashierName && r.cashierName.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortOption === 'Newest First') return b.id.localeCompare(a.id);
      if (sortOption === 'Oldest First') return a.id.localeCompare(b.id);
      if (sortOption === 'Highest Cost') {
        const costA = parseFloat(a.amount.replace(/[^0-9.]/g, '')) || 0;
        const costB = parseFloat(b.amount.replace(/[^0-9.]/g, '')) || 0;
        return costB - costA;
      }
      if (sortOption === 'Lowest Cost') {
        const costA = parseFloat(a.amount.replace(/[^0-9.]/g, '')) || 0;
        const costB = parseFloat(b.amount.replace(/[^0-9.]/g, '')) || 0;
        return costA - costB;
      }
      return 0;
    });
  }, [reports, reportTypeTab, statusFilter, categoryFilter, searchQuery, sortOption]);

  // Handle Add New Report Submit
  const handleAddReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const todayStr = new Date().toISOString().split('T')[0];

    if (newReportType === 'buyer_sale') {
      // BUYER SALE FORM SUBMISSION
      if (!buyerName.trim()) {
        onShowToast('Please enter customer/buyer name');
        return;
      }
      if (buyerSaleItems.length === 0) {
        onShowToast('Please add at least one item to the buyer sale list');
        return;
      }

      // 1. Verify stock availability
      for (const itemEntry of buyerSaleItems) {
        const invItem = inventory.find(i => i.id === itemEntry.itemId);
        const currentStock = invItem ? invItem.qty : 0;
        if (itemEntry.qty > currentStock) {
          onShowToast(`Insufficient stock for ${invItem?.itemName || 'Item'}. Available: ${currentStock}`);
          return;
        }
      }

      // 2. Prepare Buyer Sale Items & Amounts
      const buyerItemsPrepared: BuyerSaleItem[] = buyerSaleItems.map(b => {
        const invItem = inventory.find(i => i.id === b.itemId);
        const uPrice = invItem ? parseUnitPrice(invItem.price) : 1000;
        return {
          itemId: b.itemId,
          itemName: invItem ? invItem.itemName : 'Aircon Item',
          model: invItem ? invItem.model : 'AUX-MODEL',
          category: invItem ? invItem.category : 'Aircon Units',
          qty: b.qty,
          unitPrice: uPrice,
          totalPrice: uPrice * b.qty
        };
      });

      const grandTotal = buyerItemsPrepared.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalQty = buyerItemsPrepared.reduce((sum, item) => sum + item.qty, 0);

      const nextBuyIdNum = reports.length > 0 ? Math.max(...reports.map(r => {
        const match = r.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 2000;
      })) + 1 : 2001;

      const saleDate = buyerPurchaseDate || todayStr;

      const newBuyerReport: ServiceRecord = {
        id: `BUY-${nextBuyIdNum}`,
        reportType: 'buyer_sale',
        customer: buyerName.trim(),
        phone: buyerPhone.trim() || '0917 000 0000',
        address: buyerFulfillmentType,
        purchaseDate: saleDate,
        fulfillmentType: buyerFulfillmentType,
        item: buyerSaleItems.length === 1 
          ? `${buyerItemsPrepared[0].itemName} (x${buyerItemsPrepared[0].qty})` 
          : `Direct Buyer Purchase (${buyerSaleItems.length} Unique Items)`,
        category: buyerItemsPrepared[0]?.category || 'Direct Sale',
        status: 'Completed',
        technician: `N/A (Cashier: ${cashierName.trim() || 'John Cruz'})`,
        notes: notes.trim() || 'Buyer sale transaction recorded.',
        paymentStatus: 'Paid',
        amount: `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        paymentMethod,
        cashierName: cashierName.trim() || 'John Cruz',
        serviceDate: saleDate,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: 'Completed',
        created: saleDate,
        updated: saleDate,
        totalQtySold: totalQty,
        buyerItems: buyerItemsPrepared
      };

      // 3. AUTOMATIC INVENTORY STOCK DEDUCTION
      setInventory(prev => prev.map(invItem => {
        const bought = buyerSaleItems.find(b => b.itemId === invItem.id);
        if (bought) {
          return {
            ...invItem,
            qty: Math.max(0, invItem.qty - bought.qty)
          };
        }
        return invItem;
      }));

      // 4. Save report
      setReports(prev => [newBuyerReport, ...prev]);
      onShowToast(`🎉 Buyer Sale ${newBuyerReport.id} Created! Stock updated automatically.`);

      // Reset
      setBuyerName('');
      setBuyerPhone('');
      setBuyerAddress('');
      setBuyerSaleItems([]);
      setIsAddReportOpen(false);
      return;
    }

    // SERVICE REPORT FORM SUBMISSION
    if (!customer.trim()) {
      onShowToast('Please enter customer name');
      return;
    }

    const nextIdNum = reports.length > 0 ? Math.max(...reports.map(r => {
      const match = r.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    })) + 1 : 1001;

    const itemsUsedPrepared = selectedParts.map(p => {
      const invItem = inventory.find(i => i.id === p.itemId);
      return {
        itemId: p.itemId,
        itemName: invItem ? invItem.itemName : 'Spare Part',
        model: invItem ? invItem.model : 'AUX-GENERIC',
        qty: p.qty,
        unitPrice: invItem ? (invItem.price || '₱500.00') : '₱500.00'
      };
    });

    const newRecord: ServiceRecord = {
      id: `RPT-${nextIdNum}`,
      reportType: 'service',
      customer: customer.trim(),
      phone: phone.trim() || '0917 000 0000',
      address: address.trim() || 'Bulacan area',
      item: itemServiced.trim() || 'AUX Inverter Aircon Unit',
      category: category,
      status: initialStatus,
      technician: technician.trim() || 'John Cruz',
      notes: notes.trim() || 'Recorded from service reports module.',
      paymentStatus: initialStatus === 'Completed' ? 'Paid' : 'Pending',
      amount: amount.trim() || '₱3,200.00',
      serviceDate: todayStr,
      startTime: '10:00 AM',
      endTime: initialStatus === 'Completed' ? '12:00 PM' : '—',
      created: todayStr,
      updated: todayStr,
      itemsUsed: itemsUsedPrepared
    };

    setReports(prev => [newRecord, ...prev]);
    onShowToast(`Created service report ${newRecord.id} (${newRecord.status})`);

    // Reset & close
    setCustomer('');
    setPhone('');
    setAddress('');
    setCategory('Repair');
    setItemServiced('');
    setNotes('');
    setSelectedParts([]);
    setIsAddReportOpen(false);
  };

  // Open Edit Modal with report pre-filled
  const handleOpenEdit = (rpt: ServiceRecord) => {
    if (rpt.status === 'Completed') {
      onShowToast('❌ Completed transactions are locked to preserve data integrity.');
      return;
    }
    setEditingReport(rpt);
    setEditCustomer(rpt.customer);
    setEditPhone(rpt.phone);
    setEditAddress(rpt.address);
    setEditCategory(rpt.category);
    setEditItem(rpt.item);
    setEditStatus(rpt.status);
    setEditTechnician(rpt.technician);
    setEditNotes(rpt.notes);
    setEditAmount(rpt.amount);
    setEditParts(rpt.itemsUsed ? rpt.itemsUsed.map(i => ({ itemId: i.itemId, qty: i.qty })) : []);
  };

  // Save Edits handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedParts = editParts.map(p => {
      const invItem = inventory.find(i => i.id === p.itemId);
      return {
        itemId: p.itemId,
        itemName: invItem ? invItem.itemName : 'Spare Part',
        model: invItem ? invItem.model : 'AUX-GENERIC',
        qty: p.qty,
        unitPrice: invItem ? (invItem.price || '₱500.00') : '₱500.00'
      };
    });

    setReports(prev => prev.map(r => {
      if (r.id === editingReport.id) {
        return {
          ...r,
          customer: editCustomer.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
          category: editCategory,
          item: editItem.trim(),
          status: editStatus,
          technician: editTechnician.trim(),
          notes: editNotes.trim(),
          amount: editAmount.trim(),
          itemsUsed: updatedParts,
          updated: todayStr,
          paymentStatus: editStatus === 'Completed' ? 'Paid' : r.paymentStatus
        };
      }
      return r;
    }));

    onShowToast(`Updated report ${editingReport.id}`);
    setEditingReport(null);
  };

  // Delete Scheduled report
  const handleDeleteReport = () => {
    if (!deleteConfirmReport) return;
    setReports(prev => prev.filter(r => r.id !== deleteConfirmReport.id));
    onShowToast(`Deleted scheduled report ${deleteConfirmReport.id}`);
    setDeleteConfirmReport(null);
    if (selectedReportId === deleteConfirmReport.id) {
      setSelectedReportId(null);
    }
  };

  // Cancel Service Report
  const handleCancelReport = () => {
    if (!cancelConfirmReport) return;
    const todayStr = new Date().toISOString().split('T')[0];

    setReports(prev => prev.map(r => {
      if (r.id === cancelConfirmReport.id) {
        return {
          ...r,
          status: 'Cancelled',
          notes: `${r.notes}\n[Cancelled on ${todayStr}: ${cancelReason || 'Cancelled by user'}]`,
          updated: todayStr
        };
      }
      return r;
    }));

    onShowToast(`Cancelled service record ${cancelConfirmReport.id}`);
    setCancelConfirmReport(null);
    setCancelReason('');
  };

  // Create Correction / Adjustment Transaction Record for Completed Records
  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentBaseReport) return;

    const nextIdNum = reports.length > 0 ? Math.max(...reports.map(r => {
      const match = r.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    })) + 1 : 1001;

    const todayStr = new Date().toISOString().split('T')[0];

    const adjRecord: ServiceRecord = {
      id: `RPT-ADJ-${nextIdNum}`,
      customer: adjustmentBaseReport.customer,
      phone: adjustmentBaseReport.phone,
      address: adjustmentBaseReport.address,
      item: `[Adjustment] ${adjustmentBaseReport.item}`,
      category: 'Adjustment',
      status: 'Completed',
      technician: adjustmentBaseReport.technician,
      notes: `CORRECTION / ADJUSTMENT for base record ${adjustmentBaseReport.id}:\n${adjNotes}`,
      paymentStatus: 'Paid',
      amount: adjAmount.trim() || '₱0.00',
      serviceDate: todayStr,
      startTime: 'N/A',
      endTime: 'Completed',
      created: todayStr,
      updated: todayStr
    };

    setReports(prev => [adjRecord, ...prev]);
    onShowToast(`Adjustment record ${adjRecord.id} generated successfully.`);
    setAdjustmentBaseReport(null);
    setAdjNotes('');
    setAdjAmount('₱0.00');
  };

  // Status badge styling helper
  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            In Progress
          </span>
        );
      case 'Scheduled':
        return (
          <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Scheduled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="text-xs font-extrabold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="w-full min-h-screen pb-28 pt-4 font-sans select-none relative">
      
      {/* 1. MAIN REPORTS CATALOG LIST */}
      {!selectedReport && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-6">
            <div>
              <h1 className="font-display font-extrabold text-2xl text-slate-900">
                Reports & Sales System
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Track service records and buyer sale transactions
              </p>
            </div>

            <button 
              onClick={() => setIsAddReportOpen(true)}
              className="bg-teal-primary hover:bg-teal-dark text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md shadow-teal-500/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>

          {/* Primary Type Filter Tabs (All / Service / Buyer Sales) */}
          <div className="mx-6 mt-4 grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-2xl text-xs font-black shadow-inner">
            <button
              onClick={() => setReportTypeTab('all')}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                reportTypeTab === 'all'
                  ? 'bg-navy-mid text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({reports.length})
            </button>

            <button
              onClick={() => setReportTypeTab('service')}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                reportTypeTab === 'service'
                  ? 'bg-navy-mid text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              Service Logs
            </button>

            <button
              onClick={() => setReportTypeTab('buyer_sale')}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                reportTypeTab === 'buyer_sale'
                  ? 'bg-teal-primary text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              Buyer Sales
            </button>
          </div>

          {/* Search bar */}
          <div className="px-6 mt-3.5">
            <div className="relative flex items-center bg-teal-primary rounded-2xl py-3 px-4 shadow-lg shadow-teal-700/10">
              <Search className="w-4 h-4 text-white shrink-0 mr-3" />
              <input 
                type="text"
                placeholder="Search ID, customer, item, or cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-bold text-sm placeholder-white/80 w-full"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 px-6 mt-3.5 overflow-x-auto no-scrollbar text-xs font-bold">
            {reportTypeTab === 'buyer_sale' ? (
              ['Transaction History', 'In-Store Pick Up', 'For Delivery'].map(opt => {
                const isActive = statusFilter === opt || (opt === 'Transaction History' && (statusFilter === 'All Status' || statusFilter === 'Transaction History'));
                return (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-teal-primary text-white shadow-md shadow-teal-500/10' 
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })
            ) : (
              STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`py-2 px-3.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === opt 
                      ? 'bg-navy-mid text-white shadow-md shadow-navy-500/10' 
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>

          {/* Reports Catalog */}
          <div className="mx-6 mt-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3.5 px-1">
              <h2 className="font-display font-extrabold text-base text-slate-900">
                Transactions List ({filteredReports.length})
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                Tap card to view details
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredReports.map(rpt => {
                const isBuyerSale = rpt.reportType === 'buyer_sale';
                return (
                  <div 
                    key={rpt.id}
                    onClick={() => setSelectedReportId(rpt.id)}
                    className={`p-4 border rounded-2xl hover:shadow-md transition-all cursor-pointer relative group ${
                      isBuyerSale 
                        ? 'border-teal-200 bg-teal-50/30 hover:border-teal-400' 
                        : 'border-slate-100 bg-slate-50/40 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                          isBuyerSale 
                            ? 'text-teal-900 bg-amber-100 border-amber-300' 
                            : 'text-teal-700 bg-teal-50 border-teal-200/80'
                        }`}>
                          {rpt.id}
                        </span>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isBuyerSale
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isBuyerSale ? <ShoppingCart className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {isBuyerSale ? 'Buyer Sale' : 'Service Log'}
                        </span>
                      </div>

                      {isBuyerSale ? (
                        <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-teal-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          Transaction History
                        </span>
                      ) : (
                        getStatusBadge(rpt.status)
                      )}
                    </div>

                    <h3 className="font-display font-extrabold text-base text-slate-900 mt-1 flex items-center justify-between">
                      <span>{rpt.customer}</span>
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                      <span className="truncate max-w-[180px]">{rpt.item}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{rpt.category}</span>
                    </div>

                    {/* Cashier / Tech info */}
                    <div className="mt-2 text-[10px] font-semibold flex items-center justify-between text-slate-400">
                      <span>{isBuyerSale ? `Cashier: ${rpt.cashierName || 'John Cruz'}` : `Tech: ${rpt.technician}`}</span>
                      {isBuyerSale && rpt.paymentMethod && (
                        <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {rpt.paymentMethod}
                        </span>
                      )}
                    </div>

                    {/* Buyer Items Purchased Summary */}
                    {isBuyerSale && rpt.buyerItems && rpt.buyerItems.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-teal-900 font-bold bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                        <ShoppingCart className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">
                          Purchased: {rpt.buyerItems.map(b => `${b.itemName} (x${b.qty})`).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Service Used parts summary tag */}
                    {!isBuyerSale && rpt.itemsUsed && rpt.itemsUsed.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-teal-800 font-bold bg-teal-50/60 p-2 rounded-xl">
                        <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">Parts Used: {rpt.itemsUsed.map(u => `${u.itemName} (x${u.qty})`).join(', ')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/80 text-xs">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {rpt.serviceDate}
                      </span>
                      <span className="font-display font-black text-slate-900 text-sm">
                        {rpt.amount}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-semibold text-xs flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-slate-300 animate-pulse" />
                  No records found matching current criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT VIEW DETAILS SCREEN */}
      {selectedReport && (
        <div className="animate-fade-in px-6">
          <button 
            onClick={() => setSelectedReportId(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl mt-2 active:scale-95 transition-transform cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Records List
          </button>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                {selectedReport.id}
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                selectedReport.reportType === 'buyer_sale' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
              }`}>
                {selectedReport.reportType === 'buyer_sale' ? '🛒 Buyer Sale Order' : '🛠️ Service Log'}
              </span>
            </div>

            {selectedReport.reportType === 'buyer_sale' ? (
              <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Transaction Details
              </span>
            ) : (
              getStatusBadge(selectedReport.status)
            )}
          </div>

          <h2 className="font-display font-black text-2xl mt-2 text-slate-900 leading-tight">
            {selectedReport.customer}
          </h2>

          {selectedReport.reportType === 'buyer_sale' ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                Purchase Date: <strong className="text-slate-900">{selectedReport.purchaseDate || selectedReport.serviceDate}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Option: <strong className="text-slate-900">{selectedReport.fulfillmentType || selectedReport.address}</strong>
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              {selectedReport.address}
            </p>
          )}

          {/* ACTION BUTTONS PANEL */}
          <div className="mt-3.5 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-wrap gap-2 text-xs font-bold">
            
            {/* SCHEDULED -> Edit & Delete */}
            {selectedReport.status === 'Scheduled' && (
              <>
                <button
                  onClick={() => handleOpenEdit(selectedReport)}
                  className="flex-1 bg-teal-primary hover:bg-teal-dark text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Report
                </button>

                <button
                  onClick={() => setDeleteConfirmReport(selectedReport)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Delete
                </button>
              </>
            )}

            {/* IN PROGRESS -> Edit details & Cancel */}
            {selectedReport.status === 'In Progress' && (
              <>
                <button
                  onClick={() => handleOpenEdit(selectedReport)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Report
                </button>

                <button
                  onClick={() => setCancelConfirmReport(selectedReport)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  Cancel Service
                </button>
              </>
            )}

            {/* COMPLETED -> Print Receipt / Create Adjustment */}
            {selectedReport.status === 'Completed' && (
              <div className="w-full flex gap-2">
                <button
                  onClick={() => {
                    onShowToast(`🖨️ Printing official receipt for ${selectedReport.id}...`);
                    window.print();
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <Printer className="w-4 h-4 text-teal-600" />
                  Print Receipt
                </button>

                <button
                  onClick={() => {
                    setAdjustmentBaseReport(selectedReport);
                    setAdjNotes('');
                    setAdjAmount('₱0.00');
                  }}
                  className="flex-1 bg-navy-mid hover:bg-navy-light text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Correction
                </button>
              </div>
            )}
          </div>

          {/* Service or Buyer Sale Details Breakdown Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 mt-4 shadow-sm divide-y divide-slate-100 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">
                {selectedReport.reportType === 'buyer_sale' ? 'Purchased Items Summary' : 'Primary Serviced Item'}
              </span>
              <span className="font-extrabold text-slate-900">{selectedReport.item}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">Transaction Category</span>
              <span className="font-extrabold text-teal-700">{selectedReport.category}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">
                {selectedReport.reportType === 'buyer_sale' ? 'Attending Cashier' : 'Assigned Technician'}
              </span>
              <span className="font-extrabold text-slate-800">
                {selectedReport.cashierName || selectedReport.technician}
              </span>
            </div>

            {selectedReport.paymentMethod && (
              <div className="flex justify-between py-2.5">
                <span className="font-bold text-slate-800">Payment Method</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedReport.paymentMethod}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">Contact Number</span>
              <span className="font-bold text-slate-600">{selectedReport.phone}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">Transaction Date</span>
              <span className="font-bold text-slate-600">{selectedReport.serviceDate} ({selectedReport.startTime})</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="font-bold text-slate-800">Total Billed Amount</span>
              <span className="font-display font-black text-lg text-slate-900">{selectedReport.amount}</span>
            </div>
          </div>

          {/* ITEMIZED BUYER PURCHASED ITEMS TABLE (If buyer sale) */}
          {selectedReport.reportType === 'buyer_sale' && selectedReport.buyerItems && selectedReport.buyerItems.length > 0 && (
            <div className="bg-white border-2 border-teal-300 rounded-2xl p-4.5 mt-4 shadow-sm">
              <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                Itemized Buyer Purchase Breakdown
              </h3>

              <div className="flex flex-col gap-2.5 mt-3">
                {selectedReport.buyerItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold text-slate-900 truncate">{item.itemName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.category} • Model: {item.model}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        x{item.qty} Qty
                      </span>
                      <span className="font-black text-slate-900">
                        ₱{item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVENTORY ITEMS USED DURING SERVICE */}
          {selectedReport.reportType !== 'buyer_sale' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 mt-4 shadow-sm">
              <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Package className="w-4 h-4 text-teal-primary" />
                Inventory Items Used During Service
              </h3>

              <div className="flex flex-col gap-2.5 mt-3">
                {selectedReport.itemsUsed && selectedReport.itemsUsed.length > 0 ? (
                  selectedReport.itemsUsed.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate">{item.itemName}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">Model: {item.model}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          x{item.qty} Qty
                        </span>
                        <span className="font-bold text-slate-700">
                          {item.unitPrice}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 text-xs italic text-center bg-slate-50 rounded-xl">
                    No inventory parts logged for this service session.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mt-4 text-xs shadow-sm mb-6">
            <span className="font-bold text-slate-800 block mb-1">Transaction Notes & Remarks</span>
            <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
              {selectedReport.notes}
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: ADD NEW REPORT (SERVICE OR BUYER SALE) */}
      {isAddReportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900">
                Create New Report
              </h3>
              <button 
                onClick={() => setIsAddReportOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Switcher Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1 mt-3 bg-slate-100 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => setNewReportType('service')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newReportType === 'service' ? 'bg-navy-mid text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Service Report</span>
              </button>

              <button
                type="button"
                onClick={() => setNewReportType('buyer_sale')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  newReportType === 'buyer_sale' ? 'bg-teal-primary text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Buyer Sale</span>
              </button>
            </div>

            <form onSubmit={handleAddReportSubmit} className="flex flex-col gap-3.5 mt-4 text-xs">
              
              {/* IF BUYER SALE REPORT FORM */}
              {newReportType === 'buyer_sale' ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Buyer / Customer Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Maria Santos" 
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50 text-slate-800 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 0917 123 4567" 
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-2 bg-slate-50 text-slate-800 text-xs font-bold"
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Purchase Date *</label>
                      <input 
                        type="date" 
                        value={buyerPurchaseDate}
                        onChange={(e) => setBuyerPurchaseDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Delivery / Pick Up *</label>
                      <select 
                        value={buyerFulfillmentType}
                        onChange={(e) => setBuyerFulfillmentType(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-2 bg-slate-50 text-slate-800 text-xs font-bold"
                      >
                        <option value="In-Store Pick Up">In-Store Pick Up</option>
                        <option value="For Delivery">For Delivery</option>
                      </select>
                    </div>
                  </div>

                  {/* Item picker for buyer sale */}
                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-slate-800 font-extrabold mb-1.5">Select Items Purchased</label>
                    <div className="flex gap-1.5 mb-2">
                      <select
                        value={partPickerId}
                        onChange={(e) => setPartPickerId(Number(e.target.value))}
                        className="flex-1 border border-slate-200 rounded-xl p-2 text-xs font-semibold bg-slate-50"
                      >
                        {inventory.filter(i => !i.isArchived && i.qty > 0).map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.itemName} ({inv.category} • Stock: {inv.qty} • {inv.price || '₱1,000'})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={partPickerQty}
                        onChange={(e) => setPartPickerQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBuyerSaleItems(prev => {
                            const existingIdx = prev.findIndex(p => p.itemId === partPickerId);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx].qty += partPickerQty;
                              return updated;
                            }
                            return [...prev, { itemId: partPickerId, qty: partPickerQty }];
                          });
                        }}
                        className="bg-teal-primary text-white font-bold px-3 rounded-xl hover:bg-teal-dark text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Selected buyer items list */}
                    {buyerSaleItems.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        {buyerSaleItems.map((sp, idx) => {
                          const item = inventory.find(i => i.id === sp.itemId);
                          const uPrice = item ? parseUnitPrice(item.price) : 1000;
                          return (
                            <div key={idx} className="flex items-center justify-between bg-teal-50 border border-teal-200 p-2 rounded-xl text-[11px] font-bold text-teal-900">
                              <div className="flex flex-col">
                                <span>{item ? item.itemName : 'Aircon Item'} (x{sp.qty})</span>
                                <span className="text-[10px] text-teal-700">Subtotal: ₱{(uPrice * sp.qty).toLocaleString()}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setBuyerSaleItems(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* SERVICE REPORT FORM */
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Maria Santos" 
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 0917 123 4567" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Pulilan, Bulacan" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                      <select 
                        value={initialStatus}
                        onChange={(e) => setInitialStatus(e.target.value as ServiceStatus)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-2 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Service Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-2 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                      >
                        <option value="Repair">Repair</option>
                        <option value="Installation">Installation</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Replacement">Replacement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Serviced Aircon Item</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AUX Inverter Split-Type 1.5HP" 
                      value={itemServiced}
                      onChange={(e) => setItemServiced(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Technician</label>
                      <input 
                        type="text" 
                        value={technician}
                        onChange={(e) => setTechnician(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Amount Billed</label>
                      <input 
                        type="text" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50/50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Technician Notes</label>
                    <textarea 
                      placeholder="Findings or replacement details..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50/50 text-slate-800 text-xs font-semibold resize-none"
                    />
                  </div>

                  {/* Parts Selection */}
                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-slate-800 font-extrabold mb-1.5">Add Inventory Items Used</label>
                    <div className="flex gap-1.5 mb-2">
                      <select
                        value={partPickerId}
                        onChange={(e) => setPartPickerId(Number(e.target.value))}
                        className="flex-1 border border-slate-200 rounded-xl p-2 text-xs font-semibold bg-slate-50"
                      >
                        {inventory.filter(i => !i.isArchived).map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.itemName} ({inv.category} • Stock: {inv.qty})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={partPickerQty}
                        onChange={(e) => setPartPickerQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParts(prev => {
                            const existingIdx = prev.findIndex(p => p.itemId === partPickerId);
                            if (existingIdx >= 0) {
                              const updated = [...prev];
                              updated[existingIdx].qty += partPickerQty;
                              return updated;
                            }
                            return [...prev, { itemId: partPickerId, qty: partPickerQty }];
                          });
                        }}
                        className="bg-teal-primary text-white font-bold px-3 rounded-xl hover:bg-teal-dark text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Selected parts list */}
                    {selectedParts.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {selectedParts.map((sp, idx) => {
                          const item = inventory.find(i => i.id === sp.itemId);
                          return (
                            <div key={idx} className="flex items-center justify-between bg-teal-50/70 border border-teal-100 p-2 rounded-xl text-[11px] font-bold text-teal-900">
                              <span>{item ? item.itemName : 'Part'} (x{sp.qty})</span>
                              <button
                                type="button"
                                onClick={() => setSelectedParts(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddReportOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT REPORT MODAL */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display font-black text-base text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  Edit Report {editingReport.id}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  Status: {editingReport.status}
                </span>
              </div>
              <button 
                onClick={() => setEditingReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ServiceStatus)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-2 bg-slate-50 text-slate-800 text-xs font-bold"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Address</label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Aircon Item</label>
                <input 
                  type="text" 
                  value={editItem}
                  onChange={(e) => setEditItem(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Technician</label>
                  <input 
                    type="text" 
                    value={editTechnician}
                    onChange={(e) => setEditTechnician(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount</label>
                  <input 
                    type="text" 
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes</label>
                <textarea 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2.5}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 text-xs font-semibold resize-none"
                />
              </div>

              <div className="flex gap-2.5 mt-3">
                <button 
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-navy-mid hover:bg-navy-light text-white font-bold py-3 rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Save Edits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: DELETE CONFIRMATION (Scheduled only) */}
      {deleteConfirmReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-display font-black text-base text-slate-900">
              Delete Scheduled Report?
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Are you sure you want to delete report <strong className="text-slate-800">{deleteConfirmReport.id}</strong>?
            </p>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmReport(null)}
                className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: CANCEL SERVICE TRANSACTION */}
      {cancelConfirmReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
              <Ban className="w-5 h-5" />
            </div>

            <h3 className="font-display font-black text-base text-slate-900">
              Cancel Service Record
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Record <strong className="text-slate-800">{cancelConfirmReport.id}</strong> will be marked as Cancelled.
            </p>

            <div className="mt-3">
              <label className="block text-slate-700 font-bold text-[11px] mb-1">Reason for Cancellation</label>
              <input 
                type="text" 
                placeholder="e.g. Customer requested rescheduling or unavailable" 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-2 px-3 text-xs bg-slate-50 text-slate-800 font-semibold"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCancelConfirmReport(null)}
                className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelReport}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Mark Cancelled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: CORRECTION / ADJUSTMENT TRANSACTION RECORD */}
      {adjustmentBaseReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-5 z-100 select-none animate-fade-in font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-black text-base text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-teal-primary" />
                Create Correction / Adjustment
              </h3>
              <button 
                onClick={() => setAdjustmentBaseReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Generating a linked correction transaction for completed record <strong className="text-slate-800">{adjustmentBaseReport.id}</strong>.
            </p>

            <form onSubmit={handleCreateAdjustment} className="flex flex-col gap-3.5 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Adjustment Reason / Notes *</label>
                <textarea 
                  placeholder="e.g. Additional warranty part replaced or refund adjustment..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 text-slate-800 font-semibold resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Adjustment Amount (₱)</label>
                <input 
                  type="text" 
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 text-slate-800 font-black text-sm"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setAdjustmentBaseReport(null)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-3 rounded-xl font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Create Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
