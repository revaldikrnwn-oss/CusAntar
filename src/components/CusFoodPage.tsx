/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, Order, OrderType, LocationCoordinates, Restaurant, FoodOrderItem } from '../types';
import { PRESET_LOCATIONS, MOCK_RESTAURANTS } from '../data';
import CityMap from './CityMap';
import {
  Utensils,
  ChevronRight,
  Sparkles,
  Wallet,
  MapPin,
  FileText,
  ShoppingCart,
  Plus,
  Minus,
  MessageCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Compass,
  Search,
  Tag,
  Clock,
  Heart,
  Undo2
} from 'lucide-react';

interface CusFoodPageProps {
  user: UserAccount;
  activeOrders: Order[];
  onPlaceOrder: (orderData: Partial<Order>) => void;
  onCancelOrder: (orderId: string) => void;
  onTopUpWallet: (amount: number) => void;
  onSendMessage: (orderId: string, text: string) => void;
  onRateCourier: (orderId: string, rating: number, review: string) => void;
}

export default function CusFoodPage({
  user,
  activeOrders,
  onPlaceOrder,
  onCancelOrder,
  onTopUpWallet,
  onSendMessage,
  onRateCourier,
}: CusFoodPageProps) {
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [foodNote, setFoodNote] = useState('');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodCategory, setFoodCategory] = useState('Semua'); // Semua | Tradisional Indonesia | Barat / Burger | Kopi & Dessert
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cuspay' | 'cash'>('cuspay');
  const [chatInput, setChatInput] = useState('');
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Top Up Quick State
  const [topUpAmount, setTopUpAmount] = useState('50000');
  const [showTopUpMsg, setShowTopUpMsg] = useState(false);

  // Favorite list simulation
  const [likedRestIds, setLikedRestIds] = useState<string[]>(['rest-3']);

  // Helpers
  const destLoc = PRESET_LOCATIONS[destIndex];

  const toggleLikeRestaurant = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedRestIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  function getCartItemCount() {
    let count = 0;
    Object.keys(cart).forEach(itemId => {
      count += cart[itemId] || 0;
    });
    return count;
  }

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

  const currentFare = Math.max(0, getCartTotal() + 12000 - promoDiscount); // IDR 12k delivery fee

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

  const handleCheckout = () => {
    if (paymentMethod === 'cuspay' && user.balance < currentFare) {
      alert('Saldo dompet CusPay Anda tidak mencukupi untuk pembayaran kuliner ini. Silakan isi saldo Anda terlebih dahulu!');
      return;
    }

    if (getCartItemCount() === 0) {
      alert('Keranjang CusFood Anda masih kosong! Silakan tambahkan menu makanan lezat terlebih dahulu.');
      return;
    }

    if (!selectedRestId) return;
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

    onPlaceOrder({
      type: 'food',
      origin: { address: `${rest.name} Cabang Sudirman`, lat: -6.1955, lng: 106.8201 },
      destination: { address: destLoc.address, lat: destLoc.lat, lng: destLoc.lng },
      fare: currentFare,
      paymentMethod,
      details: {
        food: {
          restaurantName: rest.name,
          items: itemsInOrder,
          deliveryNote: foodNote || 'Harap dikirim hangat-hangat.',
        }
      },
    });

    // Reset local state fields
    setCart({});
    setSelectedRestId(null);
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCode('');
    setFoodNote('');
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

  // Only filter food orders for tracking inside the CusFood Page!
  const foodActiveOrders = activeOrders.filter(o => o.type === 'food');

  const activeOrderDetails = selectedOrder
    ? foodActiveOrders.find(o => o.id === selectedOrder.id) || selectedOrder
    : foodActiveOrders[0] || null;

  return (
    <div id="cusfood-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto font-sans">
      
      {/* LEFT SECTION: Food Explorer & Restaurant Baskets (7 cols) */}
      <div className="lg:col-span-7 space-y-6">

        {/* CUSFOOD BRAND BANNER HEADER */}
        <div className="bg-gradient-to-r from-red-655 to-amber-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-100 font-extrabold bg-white/20 px-3 py-1 rounded-full">
                CusFood Kuliner Enak & Cepat
              </span>
              <h1 className="text-3xl font-black tracking-tight pt-2">CusFood - Pesan Kuliner</h1>
              <p className="text-xs text-red-50 font-medium">
                Nikmati hidangan legendaris terdekat dengan rute antar kustom terlindungi.
              </p>
            </div>

            {/* CusPay quick state */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-right border border-white/10 shadow-md">
              <span className="text-[10px] text-red-100 font-bold uppercase tracking-wider block font-mono">Dompet CusPay</span>
              <span className="text-xl font-bold text-white block">
                IDR {user.balance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
            <form onSubmit={handleWalletTopUp} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-100 uppercase font-mono">
                Top-Up Saldo:
              </span>
              <select
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="text-[11px] bg-red-955 text-white border border-red-500 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="25000">IDR 25K</option>
                <option value="50000">IDR 50K</option>
                <option value="100000">IDR 100K</option>
                <option value="250000">IDR 250K</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1 bg-white text-red-700 hover:bg-slate-100 text-[11px] font-bold rounded-lg transition-all shadow-md cursor-pointer"
              >
                Top-Up
              </button>
              {showTopUpMsg && (
                <span className="text-[10px] text-emerald-300 font-extrabold animate-pulse">Berhasil!</span>
              )}
            </form>

            <span className="text-[11px] text-yellow-100 font-bold flex items-center gap-1 bg-red-800/40 px-3 py-1 rounded-xl">
              <Tag className="w-3.5 h-3.5 text-yellow-300" /> Gunakan kupon <strong>CUSHEMAT</strong> diskon IDR 15.000!
            </span>
          </div>
        </div>

        {/* RESTAURANT DIRECTORIES OR ACTIVE MENU BASKET */}
        <div id="food-marketplace-card" className="bg-white rounded-3xl border border-slate-150 shadow-md overflow-hidden p-6 space-y-6">
          
          {!selectedRestId ? (
            <div className="space-y-5">
              {/* Explorer Search Tools */}
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Masukkan nama resto, masakan nusantara, cemilan arabika..."
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none rounded-xl font-medium"
                  />
                </div>
                {foodSearchQuery && (
                  <button
                    onClick={() => setFoodSearchQuery('')}
                    className="text-xs text-red-655 hover:text-red-700 cursor-pointer underline shrink-0 font-bold"
                  >
                    Atur Ulang
                  </button>
                )}
              </div>

              {/* Categorization Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                  Saring Berdasarkan Kategori Rasa:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Semua', 'Tradisional Indonesia', 'Barat / Burger', 'Kopi & Dessert'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFoodCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        foodCategory === cat
                          ? 'bg-red-655 text-white font-black shadow-md shadow-red-500/10'
                          : 'bg-slate-50 text-slate-650 hover:bg-slate-100 border border-slate-150'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-b border-slate-100 my-2"></div>

              {/* Beautiful Restaurants Grid */}
              <div className="space-y-2">
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-red-655" />
                  <span>Daftar Restoran Mitra Unggulan Premium</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Semua restoran di bawah merupakan rekanan terpercaya dengan standar sanitasi tinggi & pengemasan higienis bebas tumpah.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {MOCK_RESTAURANTS.filter((rest) => {
                    const matchesCategory =
                      foodCategory === 'Semua' || rest.cuisine === foodCategory;
                    const matchesSearch =
                      rest.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                      rest.cuisine.toLowerCase().includes(foodSearchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).length === 0 ? (
                    <div className="col-span-2 text-center py-12 border border-dashed border-slate-200 rounded-3xl p-6">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-extrabold">Tidak ada restoran rekanan yang cocok dengan kriteria Anda.</p>
                      <button onClick={() => { setFoodCategory('Semua'); setFoodSearchQuery(''); }} className="mt-3 text-xs bg-slate-900 text-white font-bold px-4 py-1.5 rounded-xl">Lihat Semua Mitra</button>
                    </div>
                  ) : (
                    MOCK_RESTAURANTS.filter((rest) => {
                      const matchesCategory =
                        foodCategory === 'Semua' || rest.cuisine === foodCategory;
                      const matchesSearch =
                        rest.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                        rest.cuisine.toLowerCase().includes(foodSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    }).map((rest) => {
                      const isLiked = likedRestIds.includes(rest.id);
                      return (
                        <div
                          key={rest.id}
                          onClick={() => { setSelectedRestId(rest.id); setCart({}); setMenuSearchQuery(''); }}
                          className="group border border-slate-150 rounded-2xl overflow-hidden hover:border-red-500 hover:shadow-lg transition-all duration-350 cursor-pointer flex flex-col bg-white"
                        >
                          <div className="h-32 w-full relative bg-slate-100 overflow-hidden">
                            <img
                              src={rest.image}
                              alt={rest.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                              referrerPolicy="no-referrer"
                            />
                            {/* Star Badge Rating overlay */}
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1 text-[11px] font-black text-slate-900 shadow">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{rest.rating.toFixed(1)}</span>
                            </div>

                            {/* Love button overlay */}
                            <button
                              type="button"
                              onClick={(e) => toggleLikeRestaurant(e, rest.id)}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-450 hover:text-red-500 cursor-pointer shadow border border-slate-100"
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                          </div>

                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5 font-mono">
                                {rest.cuisine}
                              </span>
                              <h3 className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">{rest.name}</h3>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-3 text-slate-500 text-[10px] font-semibold">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {rest.deliveryTime}</span>
                              <span className="text-red-655 font-bold hover:underline flex items-center gap-1">Pesan Menu <ChevronRight className="w-3.5 h-3.5" /></span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Back to directory button header */}
              {(() => {
                const rest = MOCK_RESTAURANTS.find(r => r.id === selectedRestId)!;
                return (
                  <div className="space-y-5">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => { setSelectedRestId(null); setAppliedPromo(null); setPromoDiscount(0); }}
                        className="text-red-700 hover:text-red-800 text-xs font-black underline cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Undo2 className="w-4 h-4" /> &nbsp;Kembali ke Banner Restoran
                      </button>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono leading-none mb-1">Membuka Menu dari</span>
                        <span className="font-black text-xs text-red-950 font-sans block">{rest.name}</span>
                      </div>
                    </div>

                    {/* Menu internal searching */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={`Cari makanan/minuman lezat di ${rest.name}...`}
                        value={menuSearchQuery}
                        onChange={(e) => setMenuSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs border border-slate-200 focus:border-red-500 focus:outline-none rounded-xl font-medium"
                      />
                    </div>

                    {/* Menu items listing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rest.items.filter(item =>
                        item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <div className="md:col-span-2 text-center py-10 bg-slate-50 border rounded-2xl text-slate-400 text-xs font-semibold">
                          Oops! Menu makanan dicari tidak ditemukan. Silakan kosongkan kata pencarian.
                        </div>
                      ) : (
                        rest.items.filter(item =>
                          item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
                        ).map((item) => (
                          <div
                            key={item.id}
                            className="p-3 border border-slate-150 rounded-2xl flex gap-3 bg-white items-start justify-between hover:border-slate-200 transition-all shadow-sm"
                          >
                            <div className="flex-grow min-w-0">
                              <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 pr-1 font-medium leading-relaxed">{item.description}</p>
                              <span className="text-xs font-black text-red-700 font-mono mt-3.5 block">
                                IDR {item.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-xl border border-slate-100"
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Basket incremental buttons */}
                              {cart[item.id] ? (
                                <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2.5 py-1 text-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-0.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold font-mono">{cart[item.id]}</span>
                                  <button
                                    type="button"
                                    onClick={() => addToCart(item.id)}
                                    className="p-0.5 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addToCart(item.id)}
                                  className="w-full py-1.5 px-3 bg-red-655 hover:bg-red-700 text-[10px] font-black text-white rounded-xl transition-all cursor-pointer shadow"
                                >
                                  Pilih Menu
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Basket summaries, promo, checkouts */}
                    {getCartItemCount() > 0 && (
                      <div className="border-t border-slate-150 pt-5 mt-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-red-655" /> Ringkasan Keranjang Belanja Anda
                        </h3>

                        {/* Voucher apply box */}
                        <div className="p-4 bg-red-50/60 border border-red-200/60 rounded-2xl space-y-2">
                          <label className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">Gunakan Kode Kupon Belanja (Gunakan CUSHEMAT untuk diskon IDR 15.000!)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Masukkan contoh: CUSHEMAT"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className="px-3.5 py-2 text-xs bg-white border border-slate-200 focus:border-red-500 focus:outline-none rounded-xl uppercase flex-grow font-semibold"
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
                                  alert('Kode kupon promo tidak valid atau kadaluarsa.');
                                }
                              }}
                              className="px-4 bg-slate-900 hover:bg-slate-955 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                            >
                              Gunakan
                            </button>
                          </div>
                          {appliedPromo && (
                            <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1 animate-pulse">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" /> Kupon {appliedPromo} Aktif (Potongan IDR {promoDiscount.toLocaleString()})
                            </div>
                          )}
                        </div>

                        {/* Customer Delivery drop off indexes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Destinasi Pengantaran Kuliner
                            </label>
                            <select
                              value={destIndex}
                              onChange={(e) => setDestIndex(parseInt(e.target.value))}
                              className="w-full text-xs font-medium bg-white border border-slate-150 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              {PRESET_LOCATIONS.map((loc, idx) => (
                                <option key={idx} value={idx}>{loc.address}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Nomor Kamar & Catatan Kurir
                            </label>
                            <input
                              type="text"
                              className="w-full text-xs font-medium bg-white border border-slate-150 focus:border-red-500 focus:outline-none rounded-xl px-3 py-2.5"
                              placeholder="Contoh: Unit 45B, lobi lantai 2 taruh di drop-off."
                              value={foodNote}
                              onChange={(e) => setFoodNote(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* BILLING AND CHECKOUT CONTROLS */}
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">Kalkulasi Total Pembayaran</span>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-black text-slate-900 font-mono">
                                  IDR {currentFare.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  (Termasuk Ongkir IDR 12.000)
                                </span>
                              </div>
                            </div>

                            {/* Payment select */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-slate-450 uppercase font-mono block">Pembayaran:</span>
                              <div className="flex bg-slate-200/60 rounded-xl p-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('cuspay')}
                                  className={`px-3 py-1 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                                    paymentMethod === 'cuspay' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-650'
                                  }`}
                                >
                                  CusPay
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('cash')}
                                  className={`px-3 py-1 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                                    paymentMethod === 'cash' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-650'
                                  }`}
                                >
                                  Tunai
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCheckout}
                            className="w-full py-3.5 bg-gradient-to-r from-red-655 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4.5 h-4.5 text-yellow-300" /> &nbsp;Konfirmasi & Buat Pesanan Kuliner Sekarang!
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>
          )}

        </div>

      </div>

      {/* RIGHT SECTION: Active Order Dispatch Tracker, Chats & Live Simulated Map (5 cols) */}
      <div className="lg:col-span-5 space-y-6">

        {/* ACTIVE COURIER GPS TRACKER FRAME */}
        <div className="bg-white rounded-3xl border border-slate-150 shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between animate-fade-in">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5 leading-normal">
              <Compass className="w-4 h-4 text-red-655 animate-spin" /> GPS Pelacakan & Radar CusFood
            </h3>
            <span className="text-[10px] font-black bg-red-500/10 text-red-700 px-2.5 py-0.5 rounded-full font-mono">
              FOOD TRACKER
            </span>
          </div>

          <div className="p-4">
            <CityMap order={activeOrderDetails || undefined} />
          </div>

          <div className="p-5 border-t border-slate-100 space-y-4">
            {!activeOrderDetails ? (
              <div className="text-center py-12">
                <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-2 animate-bounce" />
                <h4 className="text-xs font-black text-slate-800 font-sans uppercase">Tidak Ada Pengiriman Kuliner Aktif</h4>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto mt-2 font-semibold leading-relaxed">
                  Silakan letakkan koordinat domisili Anda lalu pesan santapan kuliner favorit Anda di sebelah kiri untuk melihat simulasi real-time.
                </p>
              </div>
            ) : (
              <div>
                {/* Active order info bar */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded bg-red-655 text-white font-mono">
                      CusFood Kuliner
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">
                      Order ID: #{activeOrderDetails.id.slice(0, 10).toUpperCase()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-700 font-mono">
                      IDR {activeOrderDetails.fare.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-bold mt-1">Metode: {activeOrderDetails.paymentMethod === 'cuspay' ? 'CusPay eWallet' : 'Bayar Tunai'}</span>
                  </div>
                </div>

                <div className="border border-slate-100 p-3 bg-red-50/10 rounded-2xl mb-4 text-xs font-bold">
                  <span className="text-slate-400 text-[9px] uppercase font-mono block">Restoran Pengirim</span>
                  <p className="text-slate-800 font-extrabold mt-0.5">{activeOrderDetails.details.food?.restaurantName || 'Restoran Mitra Rekanan'}</p>
                  <span className="text-slate-400 text-[9px] uppercase font-mono mt-2 block">Daftar Menu Hidangan</span>
                  <div className="text-[10px] text-slate-650 font-semibold mt-1">
                    {activeOrderDetails.details.food?.items?.map((it, i) => (
                      <div key={i} className="flex justify-between border-b border-dashed border-slate-100 py-1">
                        <span>{it.name} &nbsp;x{it.quantity}</span>
                        <span>IDR {(it.price * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline visual milestones */}
                <div className="relative pl-6 space-y-4 py-2 border-l border-slate-200">
                  {/* Step 1: Placed */}
                  <div className="relative">
                    <div className="absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Pesanan Masuk</h5>
                    <p className="text-[10px] text-slate-500">Diterima oleh sistem radar kuliner & kitchen.</p>
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
                      Mitra Driver Ditugaskan
                    </h5>
                    {activeOrderDetails.courierName ? (
                      <p className="text-[10px] text-emerald-800 font-extrabold">{activeOrderDetails.courierName} ({activeOrderDetails.courierPhone})</p>
                    ) : (
                      <p className="text-[10px] text-slate-400">Menunggu mitra driver terdekat mengonfirmasi...</p>
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
                      Kurir Membawa Santapan Anda
                    </h5>
                    <p className="text-[10px] text-slate-500">Pesanan selesai dimasak dan sedang diantar kurir.</p>
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
                      Makanan Selesai Diserahkan
                    </h5>
                    <p className="text-[10px] text-slate-500">Santapan Anda telah sampai di lobi / lobi meja depan.</p>
                  </div>
                </div>

                {/* Cancel Booking Section */}
                {['pending', 'accepted'].includes(activeOrderDetails.status) && (
                  <button
                    onClick={() => onCancelOrder(activeOrderDetails.id)}
                    className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    Batalkan Pengantaran Kuliner ini
                  </button>
                )}

                {/* Courier details & Chat Panel */}
                {activeOrderDetails.courierId && (
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-red-800 text-white rounded-full flex items-center justify-center font-bold relative overflow-hidden flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60" alt="Courier Photo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h5 className="font-bold text-xs text-slate-900">{activeOrderDetails.courierName}</h5>
                        <p className="text-[10px] text-slate-550 font-semibold mt-0.5">Pengemudi Pengantar Makanan Anda</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-900 block font-mono">B 4118 ANT</span>
                        <span className="text-[9px] text-white font-mono font-bold block uppercase bg-red-655 px-1.5 py-0.5 rounded-md mt-0.5">CusScoot</span>
                      </div>
                    </div>

                    {/* Chat System screen box */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner">
                      <div className="bg-slate-100 px-4 py-2 flex items-center gap-1.5 border-b border-slate-150">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-550" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Hubungi Pengantar</span>
                      </div>

                      <div className="bg-slate-50 p-3 h-40 overflow-y-auto space-y-2 text-[11px] font-medium leading-relaxed">
                        {(!activeOrderDetails.chatMessages || activeOrderDetails.chatMessages.length === 0) ? (
                          <div className="text-center text-slate-400 py-10 font-normal">
                            Belum ada pesan obrolan. Berikan instruksi tambahan ke kurir Anda!
                          </div>
                        ) : (
                          activeOrderDetails.chatMessages.map((msg, idx) => {
                            const isMine = msg.sender === 'customer';
                            return (
                              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                                  isMine
                                    ? 'bg-red-655 text-white font-bold rounded-tr-none'
                                    : 'bg-slate-200 text-slate-800 rounded-tl-none font-semibold'
                                }`}>
                                  <p>{msg.message}</p>
                                  <span className={`text-[8px] mt-0.5 block ${isMine ? 'text-red-105 font-bold' : 'text-slate-450'} text-right`}>
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat box submission */}
                      <form onSubmit={(e) => handleSendMessageSubmit(e, activeOrderDetails.id)} className="flex border-t border-slate-150 p-2 bg-white gap-1">
                        <input
                          type="text"
                          className="flex-grow text-xs pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:border-red-500"
                          placeholder="Ketik pesan Anda ke driver di sini..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="px-4 bg-red-655 hover:bg-red-750 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                        >
                          Kirim
                        </button>
                      </form>
                    </div>

                  </div>
                )}

                {/* Rating review state for finished food orders */}
                {activeOrderDetails.status === 'completed' && (
                  <div className="mt-5 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-yellow-950 flex items-center gap-1">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-current" /> Suka Makanannya? Beri Rating Kurir!
                    </h4>
                    <p className="text-[10px] text-yellow-800 font-semibold">
                      Pesanan Anda terkonfirmasi sampai dengan utuh & aman. Beri ulasan positif untuk performa antar driver.
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
                      placeholder="Bagikan ulasan positif rasa makanan atau kecepatan hantar mitra..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />

                    <button
                      onClick={() => {
                        onRateCourier(activeOrderDetails.id, stars, reviewText);
                        setReviewText('');
                        setSelectedOrder(null);
                      }}
                      className="w-full py-2.5 bg-red-655 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Kirim Penilaian CusFood & Tutup
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* ORDER TICKETING HISTORY LEDGER (FOOD ONLY) */}
        {foodActiveOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-5 space-y-3">
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
              Antrean Pengantaran CusFood Anda ({foodActiveOrders.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {foodActiveOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    selectedOrder?.id === ord.id
                      ? 'border-red-500 bg-red-50/10'
                      : 'border-slate-100 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-mono">
                        CusFood
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                        #{ord.id.slice(0, 8)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                      {ord.details.food?.restaurantName || 'Restoran Mitra Kudapan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-900 block font-mono">
                      IDR {ord.fare.toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-extrabold ${
                      ord.status === 'completed'
                        ? 'text-emerald-600'
                        : 'text-red-600 animate-pulse'
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
