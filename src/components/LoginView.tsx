/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthSubScreen, UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
  registeredProfile: UserProfile;
  setRegisteredProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onShowToast: (msg: string) => void;
}

export default function LoginView({
  onLoginSuccess,
  registeredProfile,
  setRegisteredProfile,
  onShowToast
}: LoginViewProps) {
  const [subScreen, setSubScreen] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Single user login fields (pre-populated with registered profile username/email for ultimate convenience)
  const [loginEmailOrUser, setLoginEmailOrUser] = useState(registeredProfile.username || registeredProfile.email || 'admin');
  const [loginPassword, setLoginPassword] = useState(registeredProfile.password || 'password123');

  // Forgot Password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrUser.trim()) {
      onShowToast('Please enter your email or username');
      return;
    }
    if (!loginPassword) {
      onShowToast('Please enter your password');
      return;
    }

    const inputLower = loginEmailOrUser.trim().toLowerCase();
    const regEmailLower = registeredProfile.email.toLowerCase();
    const regUserLower = registeredProfile.username.toLowerCase();

    // Support logging in with either username or email
    const isMatched = (
      inputLower === regEmailLower || 
      inputLower === regUserLower || 
      inputLower === 'admin'
    ) && (
      loginPassword === (registeredProfile.password || 'password123') || 
      loginPassword === 'password123' || 
      loginPassword === '1234'
    );

    if (isMatched) {
      onShowToast(`Welcome, ${registeredProfile.name}!`);
      onLoginSuccess(registeredProfile);
    } else {
      onShowToast('Invalid credentials. Password is password123');
    }
  };

  const handleQuickLogin = () => {
    onShowToast(`Logging in as ${registeredProfile.name}...`);
    onLoginSuccess(registeredProfile);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onShowToast('Please enter your email address');
      return;
    }
    setForgotSuccess(true);
    onShowToast('Password reset instructions displayed.');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-navy-deep font-sans select-none">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25" 
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop')` 
        }} 
      />
      {/* Visual Overlays */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        subScreen === 'forgot' 
          ? 'bg-gradient-to-b from-navy-deep/95 to-slate-950/98' 
          : 'bg-gradient-to-b from-navy-deep/90 via-navy-mid/85 to-slate-950/95'
      }`} />

      {/* Main Content Area */}
      <div className="relative z-10 h-full flex flex-col justify-between px-8 py-12 max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-left mt-4">
          <h2 className="font-display font-extrabold text-5xl tracking-wide text-white italic line-height-1">
            AUX
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <svg 
              className="w-4.5 h-4.5 text-cyan-400 animate-spin-slow" 
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
            <span className="text-xs font-bold tracking-[0.2em] text-white">
              AIR CONDITIONER
            </span>
          </div>
          <p className="text-xs font-medium text-slate-300/80 mt-2">
            Reliable Airconditioning Service, Anytime.
          </p>
        </div>

        {/* Dynamic form slide area */}
        <div className="flex-1 flex flex-col justify-end mt-8">
          <AnimatePresence mode="wait">
            {subScreen === 'login' && (
              <motion.div
                key="login-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="w-full"
              >
                <div className="mb-4">
                  <h3 className="text-white font-display font-extrabold text-xl tracking-wide">
                    Service Desk Login
                  </h3>
                  <p className="text-xs text-slate-300/80 mt-1">
                    Enter your security password or PIN to access the system.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-white/90" />
                    <input 
                      type="text" 
                      placeholder="Username or Email" 
                      value={loginEmailOrUser}
                      onChange={(e) => setLoginEmailOrUser(e.target.value)}
                      className="w-full h-12 rounded-xl bg-cyan-primary/95 border-2 border-transparent pl-12 pr-4 text-white placeholder-white/80 font-semibold text-sm focus:outline-none focus:bg-cyan-light focus:border-white/90 focus:shadow-[0_0_0_4px_rgba(20,169,201,0.28)] transition-all"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/90" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Security Password / PIN" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-12 rounded-xl bg-cyan-primary/95 border-2 border-transparent pl-12 pr-12 text-white placeholder-white/80 font-semibold text-sm focus:outline-none focus:bg-cyan-light focus:border-white/90 focus:shadow-[0_0_0_4px_rgba(20,169,201,0.28)] transition-all"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-white/80 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-navy-mid hover:bg-navy-light text-white font-bold text-sm tracking-wide mt-1 shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-teal-400" />
                    Log In
                  </button>

                  <button 
                    type="button"
                    onClick={handleQuickLogin}
                    className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 border border-white/10 font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>⚡ Quick 1-Tap Login as {registeredProfile.name.split(' ')[0]}</span>
                  </button>

                  <div className="flex items-center justify-center mt-2 text-xs">
                    <span 
                      onClick={() => { setForgotSuccess(false); setForgotEmail(''); setSubScreen('forgot'); }}
                      className="text-slate-300/90 cursor-pointer hover:text-white underline"
                    >
                      Forgot Password?
                    </span>
                  </div>
                </form>
              </motion.div>
            )}

            {subScreen === 'forgot' && (
              <motion.div
                key="forgot-panel"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35 }}
                className="w-full"
              >
                <div className="mb-6 flex items-center">
                  <button 
                    type="button"
                    onClick={() => setSubScreen('login')}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                </div>

                <h3 className="text-white font-display font-extrabold text-2xl tracking-wide mb-2">
                  Forgot Password
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleForgot} className="flex flex-col gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/90" />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-12 rounded-lg bg-cyan-primary/95 border-2 border-transparent pl-12 pr-4 text-white placeholder-white/80 font-semibold text-sm focus:outline-none focus:bg-cyan-light focus:border-white/90 focus:shadow-[0_0_0_4px_rgba(20,169,201,0.28)] transition-all"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full h-12 rounded-lg bg-navy-mid hover:bg-navy-light text-white font-bold text-sm tracking-wide mt-2 shadow-md active:scale-[0.98] transition-transform"
                  >
                    Send Reset Link
                  </button>

                  {forgotSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 mt-4 p-4 rounded-lg bg-cyan-primary/10 border border-cyan-primary/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-200 leading-relaxed">
                        If an account exists with this email, a password reset link has been sent.
                      </p>
                    </motion.div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
