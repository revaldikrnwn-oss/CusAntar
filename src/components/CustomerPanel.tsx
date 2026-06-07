/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, Order, OrderType, LocationCoordinates, Restaurant, FoodOrderItem } from '../types';
import { PRESET_LOCATIONS, MOCK_RESTAURANTS } from '../data';
import CityMap from './CityMap';
import {
  Package,
  Utensils,
  Car,
  ChevronRight,
  TrendingUp,
  Wallet,
  MapPin,
  FileText,
  User,
  Phone,
  Scale,
  ShoppingCart,
  Plus,
  Minus,
  MessageCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Compass
} from 'lucide-react';

interface CustomerPanelProps {
  user: UserAccount;
  activeOrders: Order[];
  onPlaceOrder: (orderData: Partial<Order>) => void;
  onCancelOrder: (orderId: string) => void;
  onTopUpWallet: (amount: number) => void;
  onSendMessage: (orderId: string, text: string) => void;
  onRateCourier: (orderId: string, rating: number, review: string) => void;
}

export default function CustomerPanel({
  user,
  activeOrders,
  onPlaceOrder,
  onCancelOrder,
  onTopUpWallet,
  onSendMessage,
  onRateCourier,
}: CustomerPanelProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<OrderType>('goods'); // goods | food | passenger
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // General Input States
  const [originIndex, setOriginIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cuspay' | 'cash'>('cuspay');
  const [chatInput, setChatInput] = useState('');

  // 1. CusSend (Goods) States
  const [parcelName, setParcelName] = useState('Documents Case');
  const [parcelWeight, setParcelWeight] = useState(1);
  const [parcelNote, setParcelNote] = useState('Fragrant envelope, handle with care.');
  const [recipientName, setRecipientName] = useState('Aditya Pratama');
  const [recipientPhone, setRecipientPhone] = useState('+62 855-4321-0987');

  // 2. CusFood (Food) States
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [foodNote, setFoodNote] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodCategory, setFoodCategory] = useState('Semua'); // Semua | Burger/Western | Nusantara | Kopi/Roti | Minuman & Dessert
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // 3. CusRide (Passenger) States
  const [rideTier, setRideTier] = useState<'standard' | 'premium'>('standard');
  const [passengerCount, setPassengerCount] = useState(1);
  const [rideNote, setRideNote] = useState('Menunggu di lobi utama dekat air mancur.');

  // Top Up Dialog state
  const [topUpAmount, setTopUpAmount] = useState('50000');
  const [showTopUpMsg, setShowTopUpMsg] = useState(false);

  // Driver rating UI state
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Calculate simulated distance base on index differences
  const routeDistance = Math.max(1.2, Math.abs(destIndex - originIndex) * 2.4);

  // Calculate Fares
  const getFares = () => {
    let baseFare = 0;
    if (activeTab === 'goods') {
      baseFare = 10000 + routeDistance * 3000 + (parcelWeight * 2000);
    } else if (activeTab === 'passenger') {
      baseFare = rideTier === 'standard' ? 8000 + routeDistance * 3500 : 18000 + routeDistance * 5000;
    } else {
      // Food
      const foodTotal = getCartTotal();
      baseFare = foodTotal + 12000 - promoDiscount; // Standard IDR 12,000 delivery fee minus discount
    }
    return Math.max(0, Math.round(baseFare));
  };

  const currentFare = getFares();

  // Helper selectors
  const originLoc = PRESET_LOCATIONS[originIndex];
  const destLoc = PRESET_LOCATIONS[destIndex];

  // Cart operations
  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (!copy[itemId]) return prev;
      if (copy[itemId] <= 1) {
        delete copy[itemId];
      } else {
        copy[itemId] -= 1;
      }
      return copy;
    });
  };

  function getCartTotal() {
    if (!selectedRestId) return 0;
    const rest = MOCK_RESTAURANTS.find(r => r.id === selectedRestId);
    if (!rest) return 0;
    let total = 0;
    Object.keys(cart).forEach(itemId => {
      const item = rest.items.find(i => i.id === itemId);
      if (item) {
        total += item.price * cart[itemId];
      }
    });
    return total;
  }

  const getCartItemCount = () => {
    let count = 0;
    Object.keys(cart).forEach(itemId => {
      count += cart[itemId] || 0;
    });
    return count;
  };

  // Place actual unified order
  const handleCheckout = () => {
    if (paymentMethod === 'cuspay' && user.balance < currentFare) {
      alert('Saldo dompet CusPay tidak mencukupi untuk pembayaran ini. Silakan isi saldo Anda terlebih dahulu!');
      return;
    }

    if (activeTab === 'food' && getCartItemCount() === 0) {
      alert('Keranjang belanja Anda masih kosong! Silakan tambahkan menu makanan terlebih dahulu.');
      return;
    }

    let details: any = {};

    if (activeTab === 'goods') {
      details = {
        goods: {
          parcelName,
          weight: parcelWeight,
          description: parcelNote,
          recipientName,
          recipientPhone,
        }
      };
    } else if (activeTab === 'passenger') {
      details = {
        passenger: {
          vehicleTier: rideTier,
          passengerCount,
          specialNotes: rideNote,
        }
      };
    } else {
      // Food
      if (!selectedRestId || getCartItemCount() === 0) return;
      const rest = MOCK_RESTAURANTS.find(r => r.id === selectedRestId);
      if (!rest) return;

      const itemsInOrder: FoodOrderItem[] = [];
      Object.keys(cart).forEach(itemId => {
        const menuItem = rest.items.find(i => i.id === itemId);
        if (menuItem) {
          itemsInOrder.push({
            name: menuItem.name,
            quantity: cart[itemId],
            price: menuItem.price,
          });
        }
      });

      details = {
        food: {
          restaurantName: rest.name,
          items: itemsInOrder,
          deliveryNote: foodNote,
        }
      };
    }

    onPlaceOrder({
      type: activeTab,
      origin: activeTab === 'food'
        ? { address: 'Dapur Cabang Resto Rekanan', lat: -6.1955, lng: 106.8201 }
        : { address: originLoc.address, lat: originLoc.lat, lng: originLoc.lng },
      destination: { address: destLoc.address, lat: destLoc.lat, lng: destLoc.lng },
      fare: currentFare,
      paymentMethod,
      details,
    });

    // Reset localized fields
    setCart({});
    setSelectedRestId(null);
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCode('');
  };

  const handleWalletTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!isNaN(amt) && amt > 0) {
      onTopUpWallet(amt);
      setShowTopUpMsg(true);
      setTimeout(() => setShowTopUpMsg(false), 3000);
    }
  };

  const handleSendMessageSubmit = (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(orderId, chatInput.trim());
      setChatInput('');
    }
  };

  const activeOrderDetails = selectedOrder
    ? activeOrders.find(o => o.id === selectedOrder.id) || selectedOrder
    : activeOrders[0] || null;

  return (
    <div id="customer-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto">
      {/* LEFT SECTION: Main Dashboard & Ordering Systems (7 cols) */}
      <div className="lg:col-span-7 space-y-6">

        {/* CUSTOMER PORTAL HEADER CARD */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                Anggota Resmi Terverifikasi CusPay
              </span>
              <h1 className="text-2xl font-bold font-sans tracking-tight mt-1">Halo, {user.name}!</h1>
              <span className="text-xs text-slate-400 mt-0.5 block">{user.email} • {user.phone}</span>
            </div>
            {/* Wallet Quick Balance Badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-right flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center text-white font-bold opacity-90 shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Saldo CusPay</span>
                <span className="text-lg font-bold text-yellow-500 font-sans">
                  IDR {user.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Wallet Top Up trigger */}
          <form onSubmit={handleWalletTopUp} className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1">
              Isi Saldo CusPay:
            </span>
            <select
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100 font-medium"
            >
              <option value="25000">IDR 25.000</option>
              <option value="50000">IDR 50.000 (Populer)</option>
              <option value="100000">IDR 100.000</option>
              <option value="250000">IDR 250.000</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-xs text-slate-950 font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Instan
            </button>
            {showTopUpMsg && (
              <span className="text-[11px] font-semibold text-emerald-500 animate-pulse font-sans flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Top-up Berhasil!
              </span>
            )}
          </form>
        </div>

        {/* WORK SERVICE SELECTION MENU SYSTEM */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
          {/* Tabs header */}
          <div className="grid grid-cols-3 border-b border-slate-100">
            <button
              onClick={() => { setActiveTab('goods'); setSelectedRestId(null); }}
              className={`py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
                activeTab === 'goods' ? 'text-amber-600 bg-amber-50/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-5 h-5 mb-0.5" />
              <span>CusSend (Kirim Barang)</span>
              {activeTab === 'goods' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>

            <button
              onClick={() => { setActiveTab('food'); }}
              className={`py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
                activeTab === 'food' ? 'text-amber-600 bg-amber-50/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Utensils className="w-5 h-5 mb-0.5" />
              <span>CusFood (Pesan Kuliner)</span>
              {activeTab === 'food' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>

            <button
              onClick={() => { setActiveTab('passenger'); setSelectedRestId(null); }}
              className={`py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
                activeTab === 'passenger' ? 'text-amber-600 bg-amber-50/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Car className="w-5 h-5 mb-0.5" />
              <span>CusRide (Antar Penumpang)</span>
              {activeTab === 'passenger' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>
          </div>

          <div className="p-6">
            {/* GENERAL ROUTE SELECTORS: HIDDEN FOR FOOD SINCE ORIGIN IS RESTAURANT */}
            {activeTab !== 'food' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Alamat Penjemputan
                  </label>
                  <select
                    value={originIndex}
                    onChange={(e) => setOriginIndex(parseInt(e.target.value))}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    {PRESET_LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={idx}>{loc.address}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Alamat Pengantaran
                  </label>
                  <select
                    value={destIndex}
                    onChange={(e) => setDestIndex(parseInt(e.target.value))}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    {PRESET_LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={idx}>{loc.address}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* A) CUSSEND INPUT FORM */}
            {activeTab === 'goods' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl px-4 py-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Paket dikirim seketika menggunakan rute pintar optimal disertai jaminan pelacakan penuh.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Apa yang Anda kirim?</label>
                    <input
                      type="text"
                      className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5"
                      value={parcelName}
                      onChange={(e) => setParcelName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estimasi Berat (kg)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5"
                        value={parcelWeight}
                        onChange={(e) => setParcelWeight(parseFloat(e.target.value) || 1)}
                      />
                      <span className="text-xs font-bold text-slate-500">KG</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nama Penerima</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-9 text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nomor Telepon Penerima</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-9 text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Catatan Driver / Detail Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl p-3"
                    placeholder="Contoh: Titipkan paket ke resepsionis di lantai 12."
                    value={parcelNote}
                    onChange={(e) => setParcelNote(e.target.value)}
                  />
                </div>
              </div>
            )}            {/* B) CUSFOOD INTEGRATED PLATFORM */}
            {activeTab === 'food' && (
              <div id="cusfood-integrated-section" className="space-y-4">
                {!selectedRestId ? (
                  <div className="space-y-4">
                    {/* Search and Category Filter Section */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-grow w-full">
                          <Compass className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari restoran atau kuliner favorit Anda..."
                            value={foodSearchQuery}
                            onChange={(e) => setFoodSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                          />
                        </div>
                        {foodSearchQuery && (
                          <button
                            onClick={() => setFoodSearchQuery('')}
                            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer underline shrink-0"
                          >
                            Bersihkan Pencarian
                          </button>
                        )}
                      </div>

                      {/* Filter Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Semua', 'Tradisional Indonesia', 'Barat / Burger', 'Kopi & Dessert'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFoodCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                              foodCategory === cat
                                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Rekomendasi Resto Rekanan Terbaik</span>
                    </h3>

                    <div className="space-y-3">
                      {MOCK_RESTAURANTS.filter((rest) => {
                        const matchesCategory =
                          foodCategory === 'Semua' || rest.cuisine === foodCategory;
                        const matchesSearch =
                          rest.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                          rest.cuisine.toLowerCase().includes(foodSearchQuery.toLowerCase());
                        return matchesCategory && matchesSearch;
                      }).length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200/60 p-4">
                          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-bold">Tidak ada restoran yang cocok dengan pencarian Anda.</p>
                        </div>
                      ) : (
                        MOCK_RESTAURANTS.filter((rest) => {
                          const matchesCategory =
                            foodCategory === 'Semua' || rest.cuisine === foodCategory;
                          const matchesSearch =
                            rest.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                            rest.cuisine.toLowerCase().includes(foodSearchQuery.toLowerCase());
                          return matchesCategory && matchesSearch;
                        }).map((rest) => (
                          <div
                            key={rest.id}
                            className="flex items-center gap-4 p-3.5 border border-slate-100 bg-white rounded-2xl hover:border-amber-400 hover:bg-amber-50/10 cursor-pointer transition-all shadow-sm"
                            onClick={() => { setSelectedRestId(rest.id); setCart({}); setMenuSearchQuery(''); }}
                          >
                            <img
                              src={rest.image}
                              alt={rest.name}
                              className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-grow min-w-0">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 font-mono">
                                {rest.cuisine}
                              </span>
                              <h4 className="font-bold text-sm text-slate-950 truncate">{rest.name}</h4>
                              <div className="flex items-center gap-3 mt-1.5 text-slate-500 text-[11px] font-semibold">
                                <span className="flex items-center gap-0.5 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /> {rest.rating}</span>
                                <span>•</span>
                                <span>Estimasi Kirim: {rest.deliveryTime}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* View Restaurant Menu */}
                    {(() => {
                      const rest = MOCK_RESTAURANTS.find(r => r.id === selectedRestId)!;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setSelectedRestId(null); setAppliedPromo(null); setPromoDiscount(0); }}
                                className="text-amber-700 hover:text-amber-800 text-xs font-black underline cursor-pointer flex items-center gap-1.5"
                              >
                                ← &nbsp;Ganti Menu Restoran
                              </button>
                            </div>
                            <span className="font-extrabold text-xs text-amber-900 font-mono">Menu {rest.name}</span>
                          </div>

                          {/* Search inside menu */}
                          <div className="relative w-full">
                            <input
                              type="text"
                              placeholder={`Cari makanan di ${rest.name}...`}
                              value={menuSearchQuery}
                              onChange={(e) => setMenuSearchQuery(e.target.value)}
                              className="w-full px-4 py-2 text-xs border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rest.items.filter(item =>
                              item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
                            ).length === 0 ? (
                              <div className="md:col-span-2 text-center py-6 text-slate-400 text-xs">
                                Menu tidak ditemukan. Coba pencarian lain!
                              </div>
                            ) : (
                              rest.items.filter(item =>
                                item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                                item.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
                              ).map((item) => (
                                <div key={item.id} className="p-3 border border-slate-100 rounded-xl flex gap-3 bg-white items-start justify-between hover:border-slate-200 transition-all shadow-sm">
                                  <div className="flex-grow min-w-0">
                                    <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 pr-2">{item.description}</p>
                                    <span className="text-xs font-black text-amber-600 font-mono mt-2 block">IDR {item.price.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <img src={item.image} className="w-14 h-14 object-cover rounded-xl" referrerPolicy="no-referrer" />
                                    {cart[item.id] ? (
                                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1">
                                        <button type="button" onClick={() => removeFromCart(item.id)} className="p-0.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold text-slate-800">{cart[item.id]}</span>
                                        <button type="button" onClick={() => addToCart(item.id)} className="p-0.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => addToCart(item.id)}
                                        className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-[10px] font-bold text-slate-950 rounded-lg transition-all cursor-pointer shadow-sm"
                                      >
                                        Tambah
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Coupon Promo Integration */}
                          {getCartItemCount() > 0 && (
                            <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-2">
                              <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Gunakan Kode Kupon Belanja (Gunakan CUSHEMAT untuk diskon IDR 15.000!)</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Contoh: CUSHEMAT"
                                  value={promoCode}
                                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 focus:outline-none focus:border-amber-500 rounded-lg uppercase flex-grow font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (promoCode === 'CUSHEMAT') {
                                      setAppliedPromo('CUSHEMAT');
                                      setPromoDiscount(15000);
                                      alert('Kupon CUSHEMAT berhasil dipasang! Anda menghemat IDR 15.000.');
                                    } else if (promoCode === 'DISKON10') {
                                      setAppliedPromo('DISKON10');
                                      setPromoDiscount(10000);
                                      alert('Kupon DISKON10 berhasil dipasang! Anda menghemat IDR 10.000.');
                                    } else {
                                      alert('Kode promo tidak valid atau kadaluarsa.');
                                    }
                                  }}
                                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                                >
                                  Gunakan
                                </button>
                              </div>
                              {appliedPromo && (
                                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Kupon {appliedPromo} Aktif (Potongan IDR {promoDiscount.toLocaleString()})
                                </div>
                              )}
                            </div>
                          )}

                          {/* Food Destination and delivery details */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 mt-4">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              Kirim Ke Alamat:
                            </h4>
                            <select
                              value={destIndex}
                              onChange={(e) => setDestIndex(parseInt(e.target.value))}
                              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              {PRESET_LOCATIONS.map((loc, idx) => (
                                <option key={idx} value={idx}>{loc.address}</option>
                              ))}
                            </select>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Catatan Kamar / Petunjuk Pengiriman Kuliner</label>
                              <input
                                type="text"
                                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Contoh: Unit 24B, lobi lurus ke kiri depan lift."
                                value={foodNote}
                                onChange={(e) => setFoodNote(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* C) CUSRIDE (PASSENGER) INPUT FORM */}
            {activeTab === 'passenger' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-4 py-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Pengemudi berlisensi kami telah melalui verifikasi identitas & memiliki kelayakan kendaraan bintang lima.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Kategori Kendaraan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRideTier('standard')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          rideTier === 'standard'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs">CusRide Motor</span>
                        <span className="text-[9px] text-slate-500 font-normal">Perjalanan Solo Tercepat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRideTier('premium')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          rideTier === 'premium'
                            ? 'border-amber-500 bg-yellow-50/50 text-yellow-950 font-bold'
                            : 'border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs">CusRide Mobil</span>
                        <span className="text-[9px] text-slate-500 font-normal">Kabin Lega Ber-AC</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Jumlah Penumpang</label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                      className="w-full text-xs font-medium border border-slate-200 focus:outline-none rounded-xl px-3 py-3"
                    >
                      <option value="1">1 Penumpang (Solo)</option>
                      {rideTier === 'premium' && (
                        <>
                          <option value="2">2 Penumpang</option>
                          <option value="3">3 Penumpang</option>
                          <option value="4">4 Penumpang (Maks Hatchback)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Petunjuk Titik Jemput / Landmark Berdiri</label>
                  <textarea
                    rows={2}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl p-3"
                    placeholder="Contoh: Berdiri di seberang lobby lift utama, menggunakan kemeja krem."
                    value={rideNote}
                    onChange={(e) => setRideNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* LOWER FORM CHEKOUT ACTIONS (UNIFIED CALCULATOR FOR ALL SERVICES) */}
            {!(activeTab === 'food' && !selectedRestId) && (
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">estimasi total pembayaran</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                      IDR {currentFare.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      (termasuk PPN & biaya sistem)
                    </span>
                  </div>
                  {activeTab !== 'food' && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Jarak: <strong className="text-slate-600">{routeDistance.toFixed(1)} km</strong> • Tarif standar per kilometer berlaku.
                    </span>
                  )}
                </div>

                {/* Checkout selection with payment validation */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cuspay')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                        paymentMethod === 'cuspay' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      CusPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                        paymentMethod === 'cash' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Tunai
                    </button>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Pesan {activeTab === 'goods' ? 'CusSend (Barang)' : activeTab === 'food' ? 'CusFood (Kuliner)' : 'CusRide (Perjalanan)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Active Order Dispatch Tracker, Chats & Live Simulated Map (5 cols) */}
      <div className="lg:col-span-5 space-y-6">

        {/* ACTIVE COURIER GPS TRACKER FRAME */}
        <div className="bg-white rounded-3xl border border-slate-150 shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-sans">
              <Compass className="w-4 h-4 text-slate-500" /> GPS Pelacakan & Status Kurir
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full font-mono">
              PETA REAL-TIME
            </span>
          </div>

          <div className="p-4">
            <CityMap order={activeOrderDetails || undefined} />
          </div>

          <div className="p-5 border-t border-slate-100 space-y-4">
            {!activeOrderDetails ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">Tidak Ada Pengiriman Aktif</h4>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto mt-1 font-semibold">
                  Lakukan pemesanan barang, kuliner, atau perjalanan sepeda/mobil di modul kiri untuk melihat simulasi real-time.
                </p>
              </div>
            ) : (
              <div>
                {/* Active order info bar */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                      {activeOrderDetails.type === 'food' ? 'KULINER (CUSFOOD)' : activeOrderDetails.type === 'goods' ? 'BARANG (CUSSEND)' : 'KENDARAAN (CUSRIDE)'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5">
                      ID Pesanan: {activeOrderDetails.id.slice(0, 10).toUpperCase()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 font-mono">
                      IDR {activeOrderDetails.fare.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-550 block font-bold">Metode: {activeOrderDetails.paymentMethod === 'cuspay' ? 'CusPay eWallet' : 'Tunai'}</span>
                  </div>
                </div>

                {/* Pipeline visual milestones */}
                <div className="relative pl-6 space-y-4 py-2 border-l border-slate-200">
                  {/* Step 1: Placed */}
                  <div className="relative">
                    <div className="absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Pesanan Dibuat</h5>
                    <p className="text-[10px] text-slate-500">Menunggu mitra kurir melakukan konfirmasi.</p>
                  </div>

                  {/* Step 2: Accepted */}
                  <div className="relative">
                    <div className={`absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 flex items-center justify-center bg-white ${
                      ['accepted', 'picking_up', 'in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status)
                        ? 'border-emerald-500'
                        : 'border-slate-250'
                    }`}>
                      {['accepted', 'picking_up', 'in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status) && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <h5 className={`text-xs font-bold ${['accepted', 'picking_up', 'in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status) ? 'text-slate-900' : 'text-slate-400'}`}>
                      Kurir Diterima
                    </h5>
                    {activeOrderDetails.courierName ? (
                      <p className="text-[10px] text-slate-550 font-semibold">{activeOrderDetails.courierName} ({activeOrderDetails.courierPhone})</p>
                    ) : (
                      <p className="text-[10px] text-slate-400">Sedang mencari kurir terdekat...</p>
                    )}
                  </div>

                  {/* Step 3: Transit */}
                  <div className="relative">
                    <div className={`absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 flex items-center justify-center bg-white ${
                      ['in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status)
                        ? 'border-emerald-500'
                        : 'border-slate-250'
                    }`}>
                      {['in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status) && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <h5 className={`text-xs font-bold ${['in_transit', 'arrived', 'completed'].includes(activeOrderDetails.status) ? 'text-slate-900' : 'text-slate-400'}`}>
                      Dalam Perjalanan (Transit)
                    </h5>
                    <p className="text-[10px] text-slate-500">Kurir sedang menuju ke titik tujuan Anda.</p>
                  </div>

                  {/* Step 4: Arrived / Completed */}
                  <div className="relative">
                    <div className={`absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 flex items-center justify-center bg-white ${
                      ['completed'].includes(activeOrderDetails.status)
                        ? 'border-emerald-500'
                        : 'border-slate-250'
                    }`}>
                      {['completed'].includes(activeOrderDetails.status) && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <h5 className={`text-xs font-bold ${['completed'].includes(activeOrderDetails.status) ? 'text-slate-900' : 'text-slate-400'}`}>
                      Berhasil Diserahkan
                    </h5>
                    <p className="text-[10px] text-slate-500">Pesanan telah tiba dengan selamat dan selesai.</p>
                  </div>
                </div>

                {/* Quick Simulation Help Banner */}
                {activeOrderDetails.status === 'pending' && (
                  <div className="mt-4 p-3 bg-teal-50 text-teal-800 text-[11px] rounded-xl border border-teal-100 font-semibold flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Tips Simulator:</strong> Silakan buka tab <strong>"Layanan Kurir"</strong> di bilah navigasi atas untuk menerima, mengambil, dan menyelesaikan pengiriman pesanan Anda secara manual!
                    </span>
                  </div>
                )}

                {/* Cancel Ticket Section */}
                {['pending', 'accepted'].includes(activeOrderDetails.status) && (
                  <button
                    onClick={() => onCancelOrder(activeOrderDetails.id)}
                    className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    Batalkan Pesanan Pemesanan
                  </button>
                )}

                {/* Courier Profile detail card & Chat system */}
                {activeOrderDetails.courierId && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                    {/* Courier Detail card */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-teal-800 text-white rounded-full flex items-center justify-center font-bold relative overflow-hidden flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60" alt="Courier Photo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h5 className="font-bold text-xs text-slate-900">{activeOrderDetails.courierName}</h5>
                        <p className="text-[10px] text-slate-550 font-semibold mt-0.5">Kurir Mitra Berlisensi | Rating 4.9</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-900 block font-mono">B 4118 ANT</span>
                        <span className="text-[9px] text-white font-mono font-bold block uppercase bg-slate-900 px-1.5 py-0.5 rounded-md mt-0.5">Scooter</span>
                      </div>
                    </div>

                    {/* Chat System interface mock */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner">
                      <div className="bg-slate-100 px-4 py-2 flex items-center gap-1.5 border-b border-slate-150">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-550" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Hubungi Mitra Kurir</span>
                      </div>

                      {/* Chat messages viewport */}
                      <div className="bg-slate-50 p-3 h-40 overflow-y-auto space-y-2 text-[11px] font-medium leading-relaxed">
                        {(!activeOrderDetails.chatMessages || activeOrderDetails.chatMessages.length === 0) ? (
                          <div className="text-center text-slate-400 py-10 font-normal">
                            Belum ada pesan. Kirim instruksi jalan atau sapa kurir di bawah ini!
                          </div>
                        ) : (
                          activeOrderDetails.chatMessages.map((msg, idx) => {
                            const isMine = msg.sender === 'customer';
                            return (
                              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                                  isMine
                                    ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none'
                                    : 'bg-slate-200 text-slate-800 rounded-tl-none font-semibold'
                                }`}>
                                  <p>{msg.message}</p>
                                  <span className={`text-[8px] mt-0.5 block ${isMine ? 'text-amber-950/80 font-bold' : 'text-slate-450'} text-right`}>
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={(e) => handleSendMessageSubmit(e, activeOrderDetails.id)} className="flex border-t border-slate-150 p-2 bg-white gap-1">
                        <input
                          type="text"
                          className="flex-grow text-xs pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-amber-500"
                          placeholder="Tulis pesan Anda untuk kurir di sini..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
                        >
                          Kirim
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Rating review state for finished orders */}
                {activeOrderDetails.status === 'completed' && (
                  <div className="mt-5 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-yellow-950 flex items-center gap-1">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-current" /> Rekomendasi & Rating Pelayanan Kurir
                    </h4>
                    <p className="text-[10px] text-yellow-800 font-semibold">
                      Pengantaran selesai dengan sukses. Silakan beri ulasan bintang & komentar konstruktif Anda untuk mitra.
                    </p>

                    <div className="flex gap-1.5 items-center justify-center py-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStars(s)}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${s <= stars ? 'text-amber-550 fill-current' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      className="w-full text-xs font-medium bg-white border border-slate-200 focus:outline-none rounded-xl p-3"
                      placeholder="Masukkan ulasan penambah semangat untuk kurir Anda..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />

                    <button
                      onClick={() => {
                        onRateCourier(activeOrderDetails.id, stars, reviewText);
                        setReviewText('');
                        setSelectedOrder(null);
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Kirim Penilaian Layanan & Tutup
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ORDER TICKETING HISTORY LEDGER */}
        {activeOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-5 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider font-sans">
              Daftar Transaksi Pesanan Anda ({activeOrders.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    selectedOrder?.id === ord.id
                      ? 'border-amber-500 bg-amber-50/20'
                      : 'border-slate-100 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {ord.type === 'food' ? 'CusFood' : ord.type === 'goods' ? 'CusSend' : 'CusRide'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                        #{ord.id.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                      {ord.type === 'food' ? ord.details.food?.restaurantName : ord.destination.address}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-900 block font-mono">
                      IDR {ord.fare.toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-extrabold ${
                      ord.status === 'completed'
                        ? 'text-emerald-600'
                        : ord.status === 'pending'
                        ? 'text-blue-550 animate-pulse'
                        : 'text-amber-600'
                    }`}>
                      {ord.status === 'pending' ? 'MENUNGGU' : ord.status === 'accepted' ? 'DITERIMA' : ord.status === 'picking_up' ? 'DIJEMPUT' : ord.status === 'in_transit' ? 'DIANTAR' : ord.status === 'arrived' ? 'TIBA' : 'SELESAI'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
