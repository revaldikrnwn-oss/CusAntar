/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, CourierProfile, VehicleType, UserRole } from '../types';
import BrandLogo from './BrandLogo';
import { User, ShieldCheck, Mail, Phone, Car, Plus, LogIn, ChevronRight } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount, courierProfile?: CourierProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

  // Input States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // Simulated validation

  // Courier specific inputs
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [vehicleModel, setVehicleModel] = useState('Yamaha NMAX 2024');
  const [vehiclePlate, setVehiclePlate] = useState('B 3571 CUS');

  // Error/Feedback States
  const [errorMessage, setErrorMessage] = useState('');

  // Built-in presets for lightning fast evaluation
  const handleQuickLogin = (role: UserRole) => {
    setErrorMessage('');
    if (role === 'customer') {
      const presetUser: UserAccount = {
        id: 'cust-preset-1',
        name: 'Revaldi Kurniawan',
        email: 'revaldikrnwn@gmail.com',
        phone: '+62 812-3456-7890',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=60',
        balance: 350000,
      };
      onLoginSuccess(presetUser);
    } else {
      const presetUser: UserAccount = {
        id: 'cour-preset-1',
        name: 'Satria Antar',
        email: 'satria.courier@cusantar.com',
        phone: '+62 821-9988-7711',
        role: 'courier',
        avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60',
        balance: 125000,
      };
      const presetCourier: CourierProfile = {
        id: 'cour-preset-1',
        name: 'Satria Antar',
        phone: '+62 821-9988-7711',
        photo: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60',
        vehicleType: 'scooter',
        vehicleModel: 'Honda PCX Black',
        vehiclePlate: 'B 4118 ANT',
        isOnline: true,
        rating: 4.9,
        totalDeliveries: 42,
        earnings: 125000,
      };
      onLoginSuccess(presetUser, presetCourier);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !name || !phone) {
      setErrorMessage('Silakan isi seluruh formulir pendaftaran diri Anda.');
      return;
    }

    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;

    const userAccount: UserAccount = {
      id: userId,
      name,
      email,
      phone,
      role: selectedRole,
      avatar: selectedRole === 'customer'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
      balance: selectedRole === 'customer' ? 50000 : 0, // Customer get IDR 50K registration bonus!
    };

    let courierProfile: CourierProfile | undefined;

    if (selectedRole === 'courier') {
      if (!vehicleModel || !vehiclePlate) {
        setErrorMessage('Akun kurir membutuhkan data pendaftaran kendaraan.');
        return;
      }
      courierProfile = {
        id: userId,
        name,
        phone,
        photo: userAccount.avatar,
        vehicleType,
        vehicleModel,
        vehiclePlate: vehiclePlate.toUpperCase(),
        isOnline: true,
        rating: 5.0,
        totalDeliveries: 0,
        earnings: 0,
      };
    }

    onLoginSuccess(userAccount, courierProfile);
  };

  return (
    <div id="auth-screen" className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Brand Circles for Aesthetic Charm */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden relative z-10">
        {/* Upper Decorative Branding Plate */}
        <div className="bg-slate-905 bg-slate-900 px-8 pt-8 pb-7 text-center relative">
          <div className="absolute top-4 left-4 flex gap-1.5 pointer-events-none mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <BrandLogo size="lg" className="mx-auto" />
          <p className="text-slate-400 text-xs mt-1 font-sans tracking-wide">
            Transportasi On-Demand, Pengiriman Barang, & Logistik Kuliner
          </p>
        </div>

        {/* Auth Body Area */}
        <div className="p-8">
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isRegistering ? (
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight mb-2">
                Akses Portal Instan
              </h2>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                Masuk seketika menggunakan profil uji coba (simulasi) super cepat di bawah ini, atau daftarkan akun baru sesuai profil kustom Anda.
              </p>

              {/* Instant Evaluation Role Selector Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer')}
                  className="flex flex-col items-center p-4 rounded-2xl border-2 border-amber-500 bg-amber-50/40 hover:bg-amber-50 transition-all duration-200 group text-left cursor-pointer"
                >
                  <User className="w-7 h-7 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-slate-900">Demo Pelanggan</span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center font-medium">Revaldi K. • Saldo IDR 350rb</span>
                  <span className="mt-3 flex items-center font-mono font-semibold text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    MASUK CEPAT <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('courier')}
                  className="flex flex-col items-center p-4 rounded-2xl border-2 border-teal-600 bg-teal-50/40 hover:bg-teal-50 transition-all duration-200 group text-left cursor-pointer"
                >
                  <ShieldCheck className="w-7 h-7 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-slate-900">Demo Kurir/Driver</span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center font-medium">Satria A. • Motor PCX Hitam</span>
                  <span className="mt-3 flex items-center font-mono font-semibold text-[9px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    MASUK CEPAT <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-slate-100 flex-grow" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">atau daftar baru</span>
                <div className="h-px bg-slate-100 flex-grow" />
              </div>

              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-2xl transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Buat Profil Akun Kustom Baru
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Daftar Akun Baru</h2>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-amber-600 hover:text-amber-700 text-xs font-semibold cursor-pointer"
                >
                  Kembali ke Masuk Instan
                </button>
              </div>

              {/* Form Role Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    selectedRole === 'customer'
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Saya Pelanggan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('courier')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    selectedRole === 'courier'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Saya Kurir & Driver
                </button>
              </div>

              {/* General inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Contoh: budi@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nomor Telepon Seluler</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: +62 812-3456-7890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs font-medium pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Courier Vehicle Setup Fields */}
                {selectedRole === 'courier' && (
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                    <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                      <Car className="w-4 h-4" /> Kelola Profil Armada Kendaraan
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">Kelas Armada</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                        className="w-full text-xs font-medium px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="scooter">Sepeda Motor Scooter (Ekonomis/Tercepat)</option>
                        <option value="bike">Sepeda Kayu/Onthel (Jangkauan Dekat)</option>
                        <option value="car">Mobil Penumpang (CusRide Premium)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">Nama Model/Merek</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Honda Vario 160"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          className="w-full text-xs font-medium px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">Nomor Pelat (Nopol)</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: B 1234 CD"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          className="w-full text-xs font-medium px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md ${
                  selectedRole === 'customer'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                Buat Akun & Masuk Sekarang ({selectedRole === 'customer' ? 'Pelanggan' : 'Kurir'})
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
