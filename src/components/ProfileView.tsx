/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, Eye, EyeOff, Save, Check, LogOut, X } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'scan') => void;
  onShowToast: (msg: string) => void;
}

type ProfileSubScreen = 'details' | 'edit';

export default function ProfileView({
  profile,
  setProfile,
  onLogout,
  onNavigateToTab,
  onShowToast
}: ProfileViewProps) {
  const [subScreen, setSubScreen] = useState<ProfileSubScreen>('details');
  const [showPassword, setShowPassword] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editPassword, setEditPassword] = useState(profile.password || 'password123');
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editPhoto, setEditPhoto] = useState(profile.photo);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Logout confirmation state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditUsername(profile.username);
    setEditPassword(profile.password || 'password123');
    setEditPhone(profile.phone);
    setEditPhoto(profile.photo);
    setSubScreen('edit');
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditPhoto(reader.result as string);
      onShowToast('Avatar preview updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      onShowToast('Please enter your full name');
      return;
    }
    if (editEmail.trim() && !editEmail.includes('@')) {
      onShowToast('Please enter a valid email address');
      return;
    }

    const updatedProfile: UserProfile = {
      name: editName.trim(),
      email: editEmail.trim(),
      username: editUsername.trim() || profile.username,
      password: editPassword,
      phone: editPhone.trim(),
      photo: editPhoto
    };

    setProfile(updatedProfile);
    onShowToast('Account settings updated successfully.');
    setSubScreen('details');
  };

  return (
    <div className="w-full min-h-screen pb-28 text-white font-sans select-none animate-fade-in bg-navy-deep relative">
      
      {/* 1. PROFILE VIEW DETAILS VIEW */}
      {subScreen === 'details' && (
        <div className="flex flex-col h-full">
          
          {/* Header Top Card area (White card, curved bottom) */}
          <div className="bg-white rounded-b-[28px] px-6 py-6 text-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => onNavigateToTab('dashboard')}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              
              <div className="flex flex-col items-center text-center">
                <span className="font-display font-extrabold text-xl text-blue-900 italic leading-none">
                  AUX
                </span>
                <span className="text-[8px] font-bold tracking-widest text-red-primary mt-1">
                  AIR CONDITIONER
                </span>
              </div>

              {/* Scan link shortcut */}
              <button 
                onClick={() => onNavigateToTab('scan')}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
                title="Scan QR"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Account Settings detail heading Block */}
            <div className="flex items-center gap-4 mt-6">
              <div className="relative shrink-0">
                <img 
                  src={profile.photo} 
                  alt="Avatar" 
                  className="w-[74px] h-[74px] rounded-full object-cover border-2 border-cyan-400"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-display font-extrabold text-base text-slate-900 truncate">
                  {profile.name}
                </h2>
                <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                  @{profile.username}
                </p>
                <button 
                  onClick={handleOpenEdit}
                  className="bg-cyan-primary hover:bg-cyan-light text-white font-extrabold text-[11px] py-1.5 px-4 rounded-lg mt-2 w-max transition-colors cursor-pointer flex items-center gap-1"
                >
                  Edit Account Settings
                </button>
              </div>
            </div>
          </div>

          {/* Form listings (View Only, read-only fields matching the design) */}
          <div className="flex-1 overflow-y-auto px-6 mt-5 flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">User Name</label>
              <input 
                type="text" 
                value={profile.username} 
                readOnly
                className="w-full bg-white/10 border border-transparent rounded-xl py-3 px-4 text-slate-200 text-xs font-semibold focus:outline-none cursor-default select-all"
              />
            </div>

            <div className="relative">
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={profile.password || 'password123'} 
                readOnly
                className="w-full bg-white/10 border border-transparent rounded-xl py-3 pl-4 pr-12 text-slate-200 text-xs font-semibold focus:outline-none cursor-default"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-9.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Email Address (Optional)</label>
              <input 
                type="text" 
                value={profile.email || 'None provided'} 
                readOnly
                className="w-full bg-white/10 border border-transparent rounded-xl py-3 px-4 text-slate-200 text-xs font-semibold focus:outline-none cursor-default select-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Phone Number</label>
              <input 
                type="text" 
                value={profile.phone} 
                readOnly
                className="w-full bg-white/10 border border-transparent rounded-xl py-3 px-4 text-slate-200 text-xs font-semibold focus:outline-none cursor-default select-all"
              />
            </div>

            {/* Logout button */}
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full max-w-[260px] mx-auto bg-red-primary/95 hover:bg-red-primary text-white font-black text-xs py-3.5 rounded-xl mt-6 cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* 2. PROFILE EDIT VIEW SUB-SCREEN */}
      {subScreen === 'edit' && (
        <div className="flex flex-col h-full animate-fade-in">
          
          {/* Header Card in edit view */}
          <div className="bg-white rounded-b-[28px] px-6 py-6 text-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSubScreen('details')}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              
              <div className="flex flex-col items-center text-center">
                <span className="font-display font-extrabold text-xl text-blue-900 italic leading-none">
                  AUX
                </span>
                <span className="text-[8px] font-bold tracking-widest text-red-primary mt-1">
                  AIR CONDITIONER
                </span>
              </div>

              {/* Direct Save Button */}
              <button 
                onClick={handleSaveProfile}
                className="w-9 h-9 rounded-xl bg-teal-primary text-white hover:bg-teal-dark flex items-center justify-center transition-colors shadow-md shadow-teal-500/10 cursor-pointer"
                title="Save Changes"
              >
                <Save className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Editable Profile Image picker */}
            <div className="flex justify-center mt-6">
              <div 
                onClick={handlePhotoClick}
                className="relative cursor-pointer group active:scale-95 transition-transform"
              >
                <img 
                  src={editPhoto} 
                  alt="Editable Avatar" 
                  className="w-[84px] h-[84px] rounded-full object-cover border-2 border-teal-primary shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-7.5 h-7.5 rounded-full bg-teal-primary text-white border-2 border-white flex items-center justify-center shadow">
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <h3 className="text-center font-display font-extrabold text-lg mt-5 text-teal-400">
            Edit Account Settings
          </h3>

          {/* Form Input fields */}
          <form onSubmit={handleSaveProfile} className="flex-1 px-6 mt-4 flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">User Name</label>
              <input 
                type="text" 
                placeholder="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-white text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(20,169,201,0.2)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Full Name / Display Name</label>
              <input 
                type="text" 
                placeholder="Full name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-white text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(20,169,201,0.2)] transition-all"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Change Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="New Password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/5 rounded-xl py-3 pl-4 pr-12 text-white text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(20,169,201,0.2)] transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-9.5 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">
                Email Address <span className="text-teal-400 font-normal">(Optional)</span>
              </label>
              <input 
                type="email" 
                placeholder="email@gmail.com (Optional)"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-white text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(20,169,201,0.2)] transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1.5">Phone Number</label>
              <input 
                type="text" 
                placeholder="0917..."
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-white/10 border border-white/5 rounded-xl py-3 px-4 text-white text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-cyan-400 focus:shadow-[0_0_0_3px_rgba(20,169,201,0.2)] transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-teal-primary hover:bg-teal-dark text-white font-black text-xs py-4 rounded-xl mt-4 cursor-pointer shadow-lg shadow-teal-500/15"
            >
              Save Account Settings
            </button>
          </form>
        </div>
      )}

      {/* ================= SECURE LOGOUT MODAL DIALOG OVERLAY ================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6 z-100 animate-fade-in text-slate-800">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-slate-100 font-sans">
            <h3 className="font-display font-black text-base text-slate-950">
              Log Out
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2.5">
              Are you sure you want to log out of AUX service desk session?
            </p>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  onLogout();
                }}
                className="flex-1 bg-red-primary hover:bg-red-700 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
