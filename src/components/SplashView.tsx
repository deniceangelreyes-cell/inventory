/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashViewProps {
  onComplete: () => void;
}

export default function SplashView({ onComplete }: SplashViewProps) {
  const [phase, setPhase] = useState<'splash' | 'loading'>('splash');

  const handleTap = () => {
    if (phase === 'splash') {
      setPhase('loading');
    }
  };

  useEffect(() => {
    if (phase === 'loading') {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-navy-deep cursor-pointer font-sans select-none"
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        {phase === 'splash' ? (
          <motion.div 
            key="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Fallback gradients if assets are slow */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-indigo-950/60 to-slate-950/90 z-10" />
            
            {/* Visual background using custom overlays */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30" 
              style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop')` 
              }} 
            />

            <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <h1 className="font-display font-extrabold text-7xl tracking-wider text-white italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  AUX
                </h1>
                
                <div className="flex items-center justify-center gap-2.5 mt-4">
                  {/* Rotating Fan Icon */}
                  <svg 
                    className="w-6 h-6 text-cyan-400 animate-spin-slow" 
                    viewBox="0 0 100 100" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="50" cy="50" r="8" fill="currentColor"/>
                    <path d="M50 50 C 50 20, 30 10, 15 20 C 30 28, 40 38, 50 50 Z" fill="currentColor"/>
                    <path d="M50 50 C 80 50, 90 30, 80 15 C 72 30, 62 40, 50 50 Z" fill="currentColor"/>
                    <path d="M50 50 C 50 80, 70 90, 85 80 C 70 72, 60 62, 50 50 Z" fill="currentColor"/>
                    <path d="M50 50 C 20 50, 10 70, 20 85 C 28 70, 38 60, 50 50 Z" fill="currentColor"/>
                  </svg>
                  <span className="text-xl font-bold tracking-[0.25em] text-white">
                    AIR CONDITIONER
                  </span>
                </div>
              </motion.div>

              {/* Tagline Strip */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full absolute left-0 top-[55%] bg-navy-mid/90 py-4 px-6 border-y border-white/5 shadow-lg"
              >
                <p className="text-sm font-semibold text-slate-200 tracking-wide">
                  Reliable Airconditioning Service, Anytime.
                </p>
              </motion.div>

              {/* Tap anywhere prompt */}
              <div className="absolute bottom-10 left-0 right-0">
                <p className="text-xs font-bold tracking-[0.2em] text-slate-400/80 animate-pulse uppercase">
                  TAP ANYWHERE TO CONTINUE
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-navy-deep to-navy-mid z-50"
          >
            {/* Spinning loading fan */}
            <svg 
              className="w-20 h-20 text-cyan-400 animate-spin" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="8" fill="currentColor"/>
              <path d="M50 50 C 50 20, 30 10, 15 20 C 30 28, 40 38, 50 50 Z" fill="currentColor"/>
              <path d="M50 50 C 80 50, 90 30, 80 15 C 72 30, 62 40, 50 50 Z" fill="currentColor"/>
              <path d="M50 50 C 50 80, 70 90, 85 80 C 70 72, 60 62, 50 50 Z" fill="currentColor"/>
              <path d="M50 50 C 20 50, 10 70, 20 85 C 28 70, 38 60, 50 50 Z" fill="currentColor"/>
            </svg>
            
            <p className="text-xs font-bold text-slate-200 tracking-[0.25em] uppercase animate-pulse">
              LOADING SYSTEM
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
