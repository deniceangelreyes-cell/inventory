import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, RefreshCw, CheckCircle2, AlertCircle, Package, Plus, Minus, Search, ArrowRight, ShieldCheck, MapPin, ArrowLeft, Layers, Loader2, ShoppingCart, UserCheck, CreditCard, Trash2, Check, FileText } from 'lucide-react';
import { InventoryItem, ServiceRecord, BuyerSaleItem } from '../types';
import jsQR from 'jsqr';

interface ScannerViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  reports: ServiceRecord[];
  setReports: React.Dispatch<React.SetStateAction<ServiceRecord[]>>;
  onShowToast: (msg: string) => void;
  onNavigateToTab: (tab: 'inventory' | 'reports') => void;
}

export default function ScannerView({
  inventory,
  setInventory,
  reports,
  setReports,
  onShowToast,
  onNavigateToTab
}: ScannerViewProps) {
  // Scanner Mode: 'inventory' (lookup/stock update) or 'buyer' (point-of-sale checkout)
  const [scanMode, setScanMode] = useState<'inventory' | 'buyer'>('inventory');

  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [qtyAdjustment, setQtyAdjustment] = useState(0);

  // Screen View state: 'scanner' or 'results'
  const [activeScreen, setActiveScreen] = useState<'scanner' | 'results'>('scanner');
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Buyer Sale Cart & Checkout State
  const [buyerCart, setBuyerCart] = useState<{ item: InventoryItem; qty: number }[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fulfillmentType, setFulfillmentType] = useState<'In-Store Pick Up' | 'For Delivery'>('In-Store Pick Up');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'Bank Transfer' | 'Credit Card'>('Cash');
  const [cashierName, setCashierName] = useState('John Cruz');
  const [buyerNotes, setBuyerNotes] = useState('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Helper to parse numeric unit price string e.g. "₱28,900.00" -> 28900
  const parseUnitPrice = (priceStr?: string): number => {
    if (!priceStr) return 1000;
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 1000 : num;
  };

  // Trigger Scanning Delay Animation then process scan depending on mode
  const triggerScanProcess = (codeToSearch: string) => {
    const raw = codeToSearch.trim();
    if (!raw) return;

    // Clean search string
    const q = raw.toLowerCase().replace(/[\r\n]+/g, '').trim();

    // Build array of search queries to handle JSON, URLs, prefixes, models, names, IDs
    const searchQueries: string[] = [q, raw];

    // Handle JSON payloads e.g. {"qrCode":"AUX-UNIT-09JS-001", "id":1, "name":"..."}
    if (raw.startsWith('{') || raw.includes('"qrCode"') || raw.includes('"model"')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.qrCode) searchQueries.push(String(parsed.qrCode).toLowerCase());
        if (parsed.code) searchQueries.push(String(parsed.code).toLowerCase());
        if (parsed.model) searchQueries.push(String(parsed.model).toLowerCase());
        if (parsed.itemName) searchQueries.push(String(parsed.itemName).toLowerCase());
        if (parsed.name) searchQueries.push(String(parsed.name).toLowerCase());
        if (parsed.id) searchQueries.push(String(parsed.id).toLowerCase());
      } catch (e) {}
    }

    // Handle URL payloads e.g. http://.../item?code=AUX-UNIT-09JS-001
    if (raw.includes('http://') || raw.includes('https://') || raw.includes('?')) {
      try {
        const urlObj = new URL(raw);
        const codeParam = urlObj.searchParams.get('code') || urlObj.searchParams.get('qr') || urlObj.searchParams.get('id');
        if (codeParam) searchQueries.push(codeParam.toLowerCase());
        const segments = urlObj.pathname.split('/').filter(Boolean);
        if (segments.length > 0) searchQueries.push(segments[segments.length - 1].toLowerCase());
      } catch (e) {}
    }

    // Search inventory using intelligent multi-field matching
    const found = inventory.find(i => {
      const qrStr = (i.qrCode || '').toLowerCase();
      const nameStr = (i.itemName || '').toLowerCase();
      const modelStr = (i.model || '').toLowerCase();
      const shortName = (i.name || '').toLowerCase();
      const idStr = String(i.id);
      const auxIdStr = `aux-${i.id}`;
      const auxUnitIdStr = `aux-unit-${i.id}`;
      const auxPartIdStr = `aux-part-${i.id}`;

      return searchQueries.some(search => {
        if (!search) return false;
        return (
          qrStr === search ||
          (qrStr && search.includes(qrStr)) ||
          (qrStr && qrStr.includes(search)) ||
          modelStr === search ||
          (modelStr && search.includes(modelStr)) ||
          (modelStr && modelStr.includes(search)) ||
          nameStr.includes(search) ||
          search.includes(nameStr) ||
          shortName === search ||
          idStr === search ||
          auxIdStr === search ||
          auxUnitIdStr === search ||
          auxPartIdStr === search
        );
      });
    });

    // Start 1-second scanning animation sequence
    setIsScanningAnimation(true);
    setScanProgress(0);
    stopCamera();

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 180);

    setTimeout(() => {
      clearInterval(interval);
      setIsScanningAnimation(false);

      if (found) {
        if (scanMode === 'inventory') {
          setScannedItem(found);
          setQtyAdjustment(0);
          setActiveScreen('results');
          onShowToast(`Scan Complete: Identified ${found.itemName}!`);
        } else {
          // BUYER SALE POS MODE
          setBuyerCart(prev => {
            const existingIdx = prev.findIndex(c => c.item.id === found.id);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx].qty += 1;
              return updated;
            }
            return [...prev, { item: found, qty: 1 }];
          });
          onShowToast(`🛒 Added to Buyer POS Cart: ${found.itemName}!`);
        }
      } else {
        onShowToast(`No inventory item matched QR payload "${raw.slice(0, 30)}".`);
      }
    }, 900);
  };

  // Start real camera scanner feed with robust fallback constraints
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      } catch (err: any) {
        console.warn('Camera access error:', err);
        setCameraError(
          'Camera access failed or blocked. Make sure camera permissions are enabled in browser settings.'
        );
        setIsCameraActive(false);
        return;
      }
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch(() => {});
      scanFrame();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    setIsCameraActive(false);
  };

  const scanFrame = () => {
    if (
      videoRef.current && 
      canvasRef.current && 
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
    ) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          triggerScanProcess(code.data);
          return;
        }
      }
    }
    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Submit Inventory Stock Quantity Adjustment from Scanner
  const handleSaveScannedQty = () => {
    if (!scannedItem) return;
    const newQty = Math.max(0, scannedItem.qty + qtyAdjustment);
    
    setInventory(prev => prev.map(item => {
      if (item.id === scannedItem.id) {
        return { ...item, qty: newQty };
      }
      return item;
    }));

    onShowToast(`Updated ${scannedItem.itemName} stock to ${newQty}!`);
    setScannedItem(prev => prev ? { ...prev, qty: newQty } : null);
    setQtyAdjustment(0);
  };

  // Submit Buyer Sale Transaction
  const handleCompleteBuyerSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerCart.length === 0) {
      onShowToast('Please scan or add at least one item for the buyer');
      return;
    }
    if (!buyerName.trim()) {
      onShowToast('Please enter the buyer/customer name');
      return;
    }

    // 1. Verify inventory stock sufficiency
    for (const cartEntry of buyerCart) {
      const currentStock = inventory.find(i => i.id === cartEntry.item.id)?.qty || 0;
      if (cartEntry.qty > currentStock) {
        onShowToast(`Insufficient stock for ${cartEntry.item.itemName}. Current stock: ${currentStock}`);
        return;
      }
    }

    // 2. Compute Buyer Sale Totals
    const buyerItemsPrepared: BuyerSaleItem[] = buyerCart.map(c => {
      const uPrice = parseUnitPrice(c.item.price);
      return {
        itemId: c.item.id,
        itemName: c.item.itemName,
        model: c.item.model,
        category: c.item.category,
        qty: c.qty,
        unitPrice: uPrice,
        totalPrice: uPrice * c.qty
      };
    });

    const grandTotal = buyerItemsPrepared.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalQty = buyerItemsPrepared.reduce((sum, item) => sum + item.qty, 0);

    const nextBuyIdNum = reports.length > 0 ? Math.max(...reports.map(r => {
      const match = r.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 2000;
    })) + 1 : 2001;

    const todayStr = purchaseDate || new Date().toISOString().split('T')[0];

    // 3. Create Buyer Sale Report Record
    const newBuyerReport: ServiceRecord = {
      id: `BUY-${nextBuyIdNum}`,
      reportType: 'buyer_sale',
      customer: buyerName.trim(),
      phone: buyerPhone.trim() || '0917 000 0000',
      address: fulfillmentType === 'In-Store Pick Up' ? 'In-Store Pick Up' : 'For Delivery',
      purchaseDate: todayStr,
      fulfillmentType,
      item: buyerCart.length === 1 
        ? `${buyerCart[0].item.itemName} (x${buyerCart[0].qty})` 
        : `Direct Buyer Purchase (${buyerCart.length} Unique Items)`,
      category: buyerCart[0]?.item.category || 'Direct Purchase',
      status: 'Completed',
      technician: `N/A (Cashier: ${cashierName.trim() || 'John Cruz'})`,
      notes: buyerNotes.trim() || 'Recorded via Direct Store Buyer Checkout.',
      paymentStatus: 'Paid',
      amount: `₱${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      paymentMethod,
      cashierName: cashierName.trim() || 'John Cruz',
      serviceDate: todayStr,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: 'Completed',
      created: todayStr,
      updated: todayStr,
      totalQtySold: totalQty,
      buyerItems: buyerItemsPrepared
    };

    // 4. AUTOMATIC INVENTORY STOCK DEDUCTION
    setInventory(prev => prev.map(invItem => {
      const bought = buyerCart.find(c => c.item.id === invItem.id);
      if (bought) {
        return {
          ...invItem,
          qty: Math.max(0, invItem.qty - bought.qty)
        };
      }
      return invItem;
    }));

    // 5. Append report record
    setReports(prev => [newBuyerReport, ...prev]);

    onShowToast(`🎉 Sale Recorded (${newBuyerReport.id})! Deducted stock for ${buyerCart.length} item(s).`);

    // Reset Buyer Cart & Form
    setBuyerCart([]);
    setBuyerName('');
    setBuyerPhone('');
    setBuyerAddress('');
    setBuyerNotes('');

    // Jump to Reports tab or show confirmation
    setTimeout(() => {
      onNavigateToTab('reports');
    }, 600);
  };

  return (
    <div className="w-full min-h-screen pb-28 pt-4 font-sans select-none relative">
      
      {/* 1. DEDICATED INVENTORY SCAN RESULTS SCREEN */}
      {activeScreen === 'results' && scannedItem ? (
        <div className="px-5 animate-fade-in">
          {/* Top Header bar with prominent Back button */}
          <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-200">
            <button 
              onClick={() => {
                setActiveScreen('scanner');
                startCamera();
              }}
              className="flex items-center gap-2 text-xs font-black text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-teal-600 stroke-[2.5]" />
              <span>Back to Scanner</span>
            </button>

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Inventory Inspection
            </span>
          </div>

          {/* ITEM DETAILS DISPLAYED IMMEDIATELY AT TOP */}
          <div className="bg-white border-2 border-teal-400 rounded-3xl p-5 shadow-xl">
            {/* Badge & Code */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Item Identified
              </span>
              <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                {scannedItem.qrCode || `AUX-INV-${scannedItem.id}`}
              </span>
            </div>

            {/* Item Name & Attributes */}
            <div className="mt-3">
              <h2 className="font-display font-black text-xl text-slate-900 leading-snug">
                {scannedItem.itemName}
              </h2>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-bold">
                <span>Model: <span className="text-slate-800">{scannedItem.model}</span></span>
                <span>•</span>
                <span className="text-teal-700 font-extrabold">{scannedItem.category}</span>
              </div>

              {/* Price & Location Card */}
              <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Location
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    {scannedItem.location}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Unit Price
                  </span>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block">
                    {scannedItem.price || '₱1,000.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct quantity adjustment controls */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-slate-900 font-black text-xs">
                  Inventory Stock Quantity
                </label>
                <span className="text-xs font-bold text-slate-500">
                  Current: <strong className="text-slate-900">{scannedItem.qty} pcs</strong>
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setQtyAdjustment(prev => prev - 1)}
                    disabled={(scannedItem.qty + qtyAdjustment) <= 0}
                    className="w-10 h-10 rounded-xl bg-teal-primary text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <input 
                    type="number"
                    min="0"
                    value={scannedItem.qty + qtyAdjustment}
                    onChange={(e) => setQtyAdjustment((parseInt(e.target.value) || 0) - scannedItem.qty)}
                    className="w-20 text-center font-display font-black text-lg text-slate-900 bg-white border border-slate-200 rounded-xl py-1 px-2 focus:outline-none focus:border-teal-primary"
                  />
                  <button 
                    type="button"
                    onClick={() => setQtyAdjustment(prev => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-teal-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                <button 
                  onClick={handleSaveScannedQty}
                  className="bg-navy-mid hover:bg-navy-light text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Stock
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons at bottom of results */}
          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={() => {
                setActiveScreen('scanner');
                startCamera();
              }}
              className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Scan Another QR
            </button>
            
            <button 
              onClick={() => onNavigateToTab('inventory')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-slate-200"
            >
              <Package className="w-4 h-4" />
              View in Inventory
            </button>
          </div>
        </div>
      ) : (
        /* 2. MAIN CAMERA SCANNER & BUYER SALE POS SCREEN */
        <div>
          {/* Header Title & Scanner Mode Switcher */}
          <div className="px-6 mt-2">
            <h1 className="font-display font-extrabold text-2xl text-slate-900">
              QR Code Scanner
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Select mode: Inventory inspection or Buyer purchase checkout
            </p>

            {/* Prominent Mode Switcher Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 mt-3.5 bg-slate-200/80 rounded-2xl text-xs font-black shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setScanMode('inventory');
                  stopCamera();
                }}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  scanMode === 'inventory' 
                    ? 'bg-navy-mid text-white shadow-md shadow-navy-500/10' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Inventory Lookup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScanMode('buyer');
                  stopCamera();
                }}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  scanMode === 'buyer' 
                    ? 'bg-teal-primary text-white shadow-md shadow-teal-500/10' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Buyer Sale POS</span>
                {buyerCart.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                    {buyerCart.reduce((sum, c) => sum + c.qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Scanning In-Progress Animation Modal */}
          {isScanningAnimation && (
            <div className="mx-6 mt-4 bg-navy-deep border-2 border-teal-400 rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center justify-center text-center animate-fade-in relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center mb-3">
                <Loader2 className="w-8 h-8 text-teal-300 animate-spin" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-white">
                {scanMode === 'buyer' ? 'Scanning Item for Buyer...' : 'Scanning QR Code...'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {scanMode === 'buyer' ? 'Adding scanned item to buyer cart' : 'Fetching item inventory record details'}
              </p>
              
              {/* Animated Progress Bar */}
              <div className="w-full bg-white/10 h-2.5 rounded-full mt-4 overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="bg-teal-400 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-teal-300 mt-1.5 font-mono">
                {scanProgress}% Processed
              </span>
            </div>
          )}

          {/* Main Camera Viewfinder Container */}
          {!isScanningAnimation && (
            <div className="mx-6 mt-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col items-center">
              
              {/* Mode indicator badge on camera feed */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 border ${
                  scanMode === 'buyer' 
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {scanMode === 'buyer' ? <ShoppingCart className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                  {scanMode === 'buyer' ? 'Direct Store Buyer Checkout' : 'Inventory Lookup Mode'}
                </span>
              </div>

              {/* Hidden Canvas for Frame Processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Video feed or Camera Placeholder frame */}
              <div className="w-full h-52 rounded-2xl bg-slate-950 border-2 border-slate-800 relative flex flex-col items-center justify-center overflow-hidden">
                {isCameraActive ? (
                  <video ref={videoRef} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <QrCode className="w-12 h-12 text-teal-400 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-slate-300">
                      Camera Scanner Ready
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {scanMode === 'buyer' ? 'Point camera at item buyer wants to buy' : 'Point camera at item QR code or select preset below'}
                    </p>
                  </div>
                )}

                {/* Scanner Reticle Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-36 h-36 border-2 rounded-2xl relative ${scanMode === 'buyer' ? 'border-amber-400/80' : 'border-teal-400/80'}`}>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-300 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-300 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-300 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-300 -mb-1 -mr-1" />
                    {/* Laser line animation */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Camera toggle control */}
              <div className="flex items-center gap-3 w-full mt-4">
                {!isCameraActive ? (
                  <button 
                    onClick={startCamera}
                    className="flex-1 bg-teal-primary hover:bg-teal-dark text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera Scanner
                  </button>
                ) : (
                  <button 
                    onClick={stopCamera}
                    className="flex-1 bg-red-primary hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    Stop Camera Feed
                  </button>
                )}
              </div>

              {cameraError && (
                <p className="text-[11px] text-amber-400 font-semibold mt-2 text-center">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* 3. BUYER CHECKOUT CART & FORM (Visible when in Buyer mode or when cart has items) */}
          {scanMode === 'buyer' && (
            <div className="mx-6 mt-4 bg-white border-2 border-teal-400 rounded-3xl p-5 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900">
                      Direct Buyer Sale Checkout
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold">
                      Walk-in store buyers purchase • Stock deducted automatically
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {buyerCart.reduce((sum, c) => sum + c.qty, 0)} Items
                </span>
              </div>

              {/* Scanned Cart Items List */}
              <div className="mt-3.5 flex flex-col gap-2">
                <label className="block text-slate-800 font-extrabold text-xs">
                  Items to Purchase:
                </label>

                {buyerCart.length > 0 ? (
                  buyerCart.map((entry, idx) => {
                    const uPrice = parseUnitPrice(entry.item.price);
                    const subtotal = uPrice * entry.qty;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-bold text-slate-900 truncate">{entry.item.itemName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {entry.item.category} • {entry.item.price || '₱1,000.00'} / unit
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quantity stepper for each buyer item */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                setBuyerCart(prev => prev.map((c, i) => i === idx ? { ...c, qty: Math.max(1, c.qty - 1) } : c));
                              }}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="1"
                              max={entry.item.qty}
                              value={entry.qty}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(entry.item.qty, parseInt(e.target.value) || 1));
                                setBuyerCart(prev => prev.map((c, i) => i === idx ? { ...c, qty: val } : c));
                              }}
                              className="w-10 text-center font-black text-slate-900 text-xs bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setBuyerCart(prev => prev.map((c, i) => i === idx ? { ...c, qty: Math.min(entry.item.qty, c.qty + 1) } : c));
                              }}
                              className="w-6 h-6 rounded-lg bg-teal-primary text-white font-extrabold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-black text-slate-900 text-xs min-w-[65px] text-right">
                            ₱{subtotal.toLocaleString()}
                          </span>

                          <button
                            type="button"
                            onClick={() => setBuyerCart(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold flex flex-col items-center gap-1">
                    <QrCode className="w-8 h-8 text-teal-500 animate-pulse" />
                    <span>No buyer items scanned yet.</span>
                    <span className="text-[10px] text-slate-400">Point camera at QR code or pick item below to add.</span>
                  </div>
                )}
              </div>

              {/* Quick Item Picker Dropdown for Buyer Sale */}
              <div className="mt-3">
                <label className="block text-slate-700 font-bold text-[11px] mb-1">
                  Or select item from Inventory catalog:
                </label>
                <select
                  onChange={(e) => {
                    const itemId = Number(e.target.value);
                    if (!itemId) return;
                    const found = inventory.find(i => i.id === itemId);
                    if (found) {
                      setBuyerCart(prev => {
                        const existingIdx = prev.findIndex(c => c.item.id === found.id);
                        if (existingIdx >= 0) {
                          const updated = [...prev];
                          updated[existingIdx].qty += 1;
                          return updated;
                        }
                        return [...prev, { item: found, qty: 1 }];
                      });
                      e.target.value = "";
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-slate-50 text-slate-800"
                >
                  <option value="">+ Add Item by Name / Model...</option>
                  {inventory.filter(i => !i.isArchived && i.qty > 0).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.itemName} ({i.category} • Stock: {i.qty} • {i.price || '₱1,000'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Fill-Up Form */}
              <form onSubmit={handleCompleteBuyerSale} className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3 text-xs">
                <h3 className="font-display font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-primary" />
                  Buyer Information
                </h3>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Buyer / Customer Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Juan Dela Cruz" 
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
                      placeholder="e.g. 0918 123 4567" 
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
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 text-slate-800 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Delivery / Pick Up *</label>
                    <select 
                      value={fulfillmentType}
                      onChange={(e) => setFulfillmentType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl py-2.5 px-2 bg-slate-50 text-slate-800 text-xs font-bold"
                    >
                      <option value="In-Store Pick Up">In-Store Pick Up</option>
                      <option value="For Delivery">For Delivery</option>
                    </select>
                  </div>
                </div>

                {/* Grand Total Summary Display */}
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between mt-1">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-teal-800 block">
                      Total Payable Amount
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {buyerCart.reduce((sum, c) => sum + c.qty, 0)} total pcs
                    </span>
                  </div>
                  <span className="font-display font-black text-2xl text-teal-900">
                    ₱{buyerCart.reduce((sum, c) => sum + (parseUnitPrice(c.item.price) * c.qty), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button 
                  type="submit"
                  disabled={buyerCart.length === 0}
                  className="w-full bg-teal-primary hover:bg-teal-dark text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Buyer Report & Deduct Inventory Stock
                </button>
              </form>
            </div>
          )}

          {/* Manual Code Entry & Quick Presets */}
          <div className="mx-6 mt-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <h2 className="font-display font-extrabold text-sm text-slate-900 mb-2">
              Manual QR Lookup or Test Presets
            </h2>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                triggerScanProcess(manualCode);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="e.g. AUX-UNIT-09JS-001 or model" 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold bg-slate-50 focus:outline-none focus:border-teal-primary focus:bg-white"
                />
              </div>
              <button 
                type="submit"
                className="bg-navy-mid hover:bg-navy-light text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer active:scale-95 transition-transform"
              >
                Find
              </button>
            </form>

            {/* Preset item chips for quick testing */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Quick Scan Simulation Presets:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {inventory.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    onClick={() => triggerScanProcess(item.qrCode || item.itemName)}
                    className="bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-800 px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <QrCode className="w-3 h-3 text-teal-600" />
                    {item.itemName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
