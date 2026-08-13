/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Package, QrCode, FileText, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-50 -translate-x-50 w-full max-w-[430px] bg-navy-mid border-t border-white/5 flex items-center justify-around py-2.5 px-1.5 z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] select-none">
      {/* Dashboard */}
      <button 
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl flex-1 text-center cursor-pointer active:scale-95 transition-all duration-200 ${
          activeTab === 'dashboard' ? 'text-green-primary' : 'text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5.5 h-5.5 stroke-[2]" />
        <span className="text-[9px] font-extrabold tracking-wider uppercase font-sans">
          DASHBOARD
        </span>
      </button>

      {/* Inventory */}
      <button 
        onClick={() => onTabChange('inventory')}
        className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl flex-1 text-center cursor-pointer active:scale-95 transition-all duration-200 ${
          activeTab === 'inventory' ? 'text-green-primary' : 'text-slate-400'
        }`}
      >
        <Package className="w-5.5 h-5.5 stroke-[2]" />
        <span className="text-[9px] font-extrabold tracking-wider uppercase font-sans">
          INVENTORY
        </span>
      </button>

      {/* Scan Circle QR */}
      <button 
        onClick={() => onTabChange('scan')}
        className="flex flex-col items-center -mt-6 flex-1 text-center cursor-pointer active:scale-95 transition-all duration-200"
      >
        <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center shadow-lg border-[4px] border-navy-mid">
          <QrCode className="w-6.5 h-6.5 text-navy-deep stroke-[2.2]" />
        </div>
        <span className="text-[9px] font-extrabold tracking-wider uppercase font-sans text-slate-400 mt-1">
          SCAN
        </span>
      </button>

      {/* Reports */}
      <button 
        onClick={() => onTabChange('reports')}
        className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl flex-1 text-center cursor-pointer active:scale-95 transition-all duration-200 ${
          activeTab === 'reports' ? 'text-green-primary' : 'text-slate-400'
        }`}
      >
        <FileText className="w-5.5 h-5.5 stroke-[2]" />
        <span className="text-[9px] font-extrabold tracking-wider uppercase font-sans">
          REPORTS
        </span>
      </button>

      {/* Account Settings */}
      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl flex-1 text-center cursor-pointer active:scale-95 transition-all duration-200 ${
          activeTab === 'profile' ? 'text-green-primary' : 'text-slate-400'
        }`}
      >
        <Settings className="w-5.5 h-5.5 stroke-[2]" />
        <span className="text-[8px] font-extrabold tracking-tight uppercase font-sans whitespace-nowrap">
          ACCOUNT SETTINGS
        </span>
      </button>
    </nav>
  );
}
