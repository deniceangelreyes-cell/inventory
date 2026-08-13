import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile, InventoryItem, ServiceRecord, ActiveTab, AppScreen } from './types';
import { INITIAL_PROFILE, INITIAL_INVENTORY, INITIAL_REPORTS } from './data';
import { generateQrDataUrl } from './utils/qrHelper';

// Component Imports
import SplashView from './components/SplashView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import ScannerView from './components/ScannerView';
import ReportsView from './components/ReportsView';
import ProfileView from './components/ProfileView';
import BottomNavBar from './components/BottomNavBar';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Registered & Active Session Profiles
  const [registeredProfile, setRegisteredProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('aux_profile');
    return cached ? JSON.parse(cached) : INITIAL_PROFILE;
  });

  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    const cachedActive = localStorage.getItem('aux_active_session');
    return cachedActive ? JSON.parse(cachedActive) : null;
  });

  // Inventory items state
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const cached = localStorage.getItem('aux_inventory');
    return cached ? JSON.parse(cached) : INITIAL_INVENTORY;
  });

  // Service records/reports state
  const [reports, setReports] = useState<ServiceRecord[]>(() => {
    const cached = localStorage.getItem('aux_reports');
    return cached ? JSON.parse(cached) : INITIAL_REPORTS;
  });

  // Unified Custom Toast system
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  // Fetch initial data from Express backend endpoints if available
  useEffect(() => {
    async function loadBackendData() {
      try {
        const invRes = await fetch('/api/inventory');
        if (invRes.ok) {
          const invData = await invRes.json();
          if (Array.isArray(invData) && invData.length > 0) {
            setInventory(invData);
          }
        }
      } catch (err) {
        console.log('Using initial client inventory cache');
      }

      try {
        const rptRes = await fetch('/api/reports');
        if (rptRes.ok) {
          const rptData = await rptRes.json();
          if (Array.isArray(rptData) && rptData.length > 0) {
            setReports(rptData);
          }
        }
      } catch (err) {
        console.log('Using initial client reports cache');
      }
    }
    loadBackendData();
  }, []);

  // Ensure all inventory items have valid, scannable PNG QR Code Data URLs
  useEffect(() => {
    let isMounted = true;
    async function ensureRealQrCodes() {
      let updated = false;
      const newInv = await Promise.all(
        inventory.map(async (item) => {
          if (!item.qrDataUrl || item.qrDataUrl.startsWith('data:image/svg')) {
            try {
              const realQr = await generateQrDataUrl(item.qrCode || `AUX-INV-${item.id}`);
              updated = true;
              return { ...item, qrDataUrl: realQr };
            } catch (err) {
              return item;
            }
          }
          return item;
        })
      );

      if (updated && isMounted) {
        setInventory(newInv);
      }
    }

    if (inventory.length > 0) {
      ensureRealQrCodes();
    }

    return () => { isMounted = false; };
  }, [inventory.length]);

  // Sync inventory & reports to localStorage & backend
  useEffect(() => {
    localStorage.setItem('aux_inventory', JSON.stringify(inventory));
    // Optional sync to server
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory)
    }).catch(() => {});
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('aux_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('aux_profile', JSON.stringify(registeredProfile));
  }, [registeredProfile]);

  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem('aux_active_session', JSON.stringify(activeProfile));
    } else {
      localStorage.removeItem('aux_active_session');
    }
  }, [activeProfile]);

  // Helper to trigger system notification toast
  const handleShowToast = (msg: string) => {
    setToast({ message: msg, visible: true });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Auth actions
  const handleLoginSuccess = (profile: UserProfile) => {
    setActiveProfile(profile);
    setScreen('main');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setScreen('auth');
    setActiveTab('dashboard');
    handleShowToast('Logged out of AUX Air Conditioner session.');
  };

  const handleSplashComplete = () => {
    if (activeProfile) {
      setScreen('main');
    } else {
      setScreen('auth');
    }
  };

  return (
    <div className="relative w-full max-w-[430px] min-h-screen mx-auto bg-slate-50 shadow-2xl overflow-hidden flex flex-col">
      
      <AnimatePresence mode="wait">
        {/* Phase 1: Splash and Loading transition */}
        {screen === 'splash' && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50"
          >
            <SplashView onComplete={handleSplashComplete} />
          </motion.div>
        )}

        {/* Phase 2: Sign-up / Sign-in Authenticate form */}
        {screen === 'auth' && (
          <motion.div
            key="auth-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40"
          >
            <LoginView 
              onLoginSuccess={handleLoginSuccess}
              registeredProfile={registeredProfile}
              setRegisteredProfile={setRegisteredProfile}
              onShowToast={handleShowToast}
            />
          </motion.div>
        )}

        {/* Phase 3: Connected main pages */}
        {screen === 'main' && activeProfile && (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col min-h-screen bg-slate-50"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="tab-dashboard"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    <DashboardView 
                      inventory={inventory}
                      setInventory={setInventory}
                      reports={reports}
                      setReports={setReports}
                      onNavigateToTab={(tab) => {
                        if (tab === 'inventory' || tab === 'scan') {
                          setActiveTab(tab);
                        }
                      }}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'inventory' && (
                  <motion.div
                    key="tab-inventory"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    <InventoryView 
                      inventory={inventory}
                      setInventory={setInventory}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'scan' && (
                  <motion.div
                    key="tab-scan"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    <ScannerView 
                      inventory={inventory}
                      setInventory={setInventory}
                      reports={reports}
                      setReports={setReports}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'reports' && (
                  <motion.div
                    key="tab-reports"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    <ReportsView 
                      reports={reports}
                      setReports={setReports}
                      inventory={inventory}
                      setInventory={setInventory}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="tab-profile"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    <ProfileView 
                      profile={activeProfile}
                      setProfile={(p) => {
                        setActiveProfile(p);
                        setRegisteredProfile(p);
                      }}
                      onLogout={handleLogout}
                      onNavigateToTab={(tab) => {
                        setActiveTab(tab);
                      }}
                      onShowToast={handleShowToast}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky Bottom Navigation Bar */}
            <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert Popup */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white font-sans font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl z-200 text-center flex items-center gap-2.5 max-w-[85vw] whitespace-normal"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
            <span className="leading-snug">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
