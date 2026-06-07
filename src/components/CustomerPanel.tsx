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

  // 3. CusRide (Passenger) States
  const [rideTier, setRideTier] = useState<'standard' | 'premium'>('standard');
  const [passengerCount, setPassengerCount] = useState(1);
  const [rideNote, setRideNote] = useState('Waiting at the main lobby near the fountain.');

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
      baseFare = foodTotal + 12000; // IDR 12,000 standard delivery
    }
    return Math.round(baseFare);
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

  const getCartTotal = () => {
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
  };

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
      alert('Insufficient CusPay wallet balance. Please top up your wallet first!');
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
        ? { address: 'Partner Merchant Restaurant Kitchen', lat: -6.1955, lng: 106.8201 }
        : { address: originLoc.address, lat: originLoc.lat, lng: originLoc.lng },
      destination: { address: destLoc.address, lat: destLoc.lat, lng: destLoc.lng },
      fare: currentFare,
      paymentMethod,
      details,
    });

    // Reset localized fields
    setCart({});
    setSelectedRestId(null);
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
                CusPay Authorized Member
              </span>
              <h1 className="text-2xl font-bold font-sans tracking-tight mt-1">Hello, {user.name}!</h1>
              <span className="text-xs text-slate-400 mt-0.5 block">{user.email} • {user.phone}</span>
            </div>
            {/* Wallet Quick Balance Badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-right flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center text-white font-bold opacity-90 shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">CusPay Balance</span>
                <span className="text-lg font-bold text-yellow-500 font-sans">
                  IDR {user.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Wallet Top Up trigger */}
          <form onSubmit={handleWalletTopUp} className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1">
              Top Up CusPay:
            </span>
            <select
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-slate-100 font-medium"
            >
              <option value="25000">IDR 25,000</option>
              <option value="50000">IDR 50,000 (Popular)</option>
              <option value="100000">IDR 100,000</option>
              <option value="250000">IDR 250,000</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-xs text-slate-950 font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Instant Add
            </button>
            {showTopUpMsg && (
              <span className="text-[11px] font-semibold text-emerald-500 animate-pulse font-sans flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Top-up Success!
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
              <span>CusSend (Goods)</span>
              {activeTab === 'goods' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>

            <button
              onClick={() => { setActiveTab('food'); }}
              className={`py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
                activeTab === 'food' ? 'text-amber-600 bg-amber-50/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Utensils className="w-5 h-5 mb-0.5" />
              <span>CusFood (Food)</span>
              {activeTab === 'food' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>

            <button
              onClick={() => { setActiveTab('passenger'); setSelectedRestId(null); }}
              className={`py-4 flex flex-col items-center gap-1 text-xs font-bold transition-all relative ${
                activeTab === 'passenger' ? 'text-amber-600 bg-amber-50/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Car className="w-5 h-5 mb-0.5" />
              <span>CusRide (Passengers)</span>
              {activeTab === 'passenger' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
            </button>
          </div>

          <div className="p-6">
            {/* GENERAL ROUTE SELECTORS: HIDDEN FOR FOOD SINCE ORIGIN IS RESTAURANT */}
            {activeTab !== 'food' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Pick-up Address
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
                    Drop-off Address
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
                  <span>Parcel delivers instantly using optimized smart-routing with full tracking insurance.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">What are you sending?</label>
                    <input
                      type="text"
                      className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5"
                      value={parcelName}
                      onChange={(e) => setParcelName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Estimated Weight (kg)</label>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Recipient Name</label>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Recipient Phone Contact</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Courier Dispatch Notes / Address Details</label>
                  <textarea
                    rows={2}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl p-3"
                    placeholder="e.g. Leave package with reception on 12th floor."
                    value={parcelNote}
                    onChange={(e) => setParcelNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* B) CUSFOOD INTEGRATED PLATFORM */}
            {activeTab === 'food' && (
              <div className="space-y-4">
                {!selectedRestId ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 block">Top Recommended Local Merchants</h3>
                    <div className="space-y-3">
                      {MOCK_RESTAURANTS.map((rest) => (
                        <div
                          key={rest.id}
                          className="flex items-center gap-4 p-3 border border-slate-100 rounded-2xl hover:border-amber-400 hover:bg-amber-50/10 cursor-pointer transition-all"
                          onClick={() => { setSelectedRestId(rest.id); setCart({}); }}
                        >
                          <img
                            src={rest.image}
                            alt={rest.name}
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-grow min-w-0">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-1 font-mono">
                              {rest.cuisine}
                            </span>
                            <h4 className="font-bold text-sm text-slate-950 truncate">{rest.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-slate-500 text-[11px] font-semibold">
                              <span className="flex items-center gap-0.5 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /> {rest.rating}</span>
                              <span>•</span>
                              <span>Express Delivery: {rest.deliveryTime}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* View Restaurant Menu */}
                    {(() => {
                      const rest = MOCK_RESTAURANTS.find(r => r.id === selectedRestId)!;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-2xl">
                            <button
                              type="button"
                              onClick={() => setSelectedRestId(null)}
                              className="text-amber-700 hover:text-amber-800 text-xs font-bold underline cursor-pointer"
                            >
                              ← Pick Another Restaurant
                            </button>
                            <span className="text-slate-400">/</span>
                            <span className="font-bold text-xs text-slate-700 font-mono">{rest.name} Menu</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rest.items.map((item) => (
                              <div key={item.id} className="p-3 border border-slate-100 rounded-xl flex gap-3 items-start justify-between hover:border-slate-200 transition-all">
                                <div className="flex-grow min-w-0">
                                  <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 pr-2">{item.description}</p>
                                  <span className="text-xs font-bold text-amber-600 font-mono mt-2 block">IDR {item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                  <img src={item.image} className="w-14 h-14 object-cover rounded-xl" referrerPolicy="no-referrer" />
                                  {cart[item.id] ? (
                                    <div className="flex items-center gap-2.5 bg-slate-100 rounded-lg px-2 py-1">
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
                                      className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-[10px] font-bold text-white rounded-lg transition-all cursor-pointer shadow-sm"
                                    >
                                      Add to Cart
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Food Destination and delivery details */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 mt-4">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              Deliver To:
                            </h4>
                            <select
                              value={destIndex}
                              onChange={(e) => setDestIndex(parseInt(e.target.value))}
                              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5"
                            >
                              {PRESET_LOCATIONS.map((loc, idx) => (
                                <option key={idx} value={idx}>{loc.address}</option>
                              ))}
                            </select>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kitchen Directions / Room Notes</label>
                              <input
                                type="text"
                                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2.5"
                                placeholder="e.g. Delivery at unit 14C. Ring doorbell once."
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
                  <span>Licensed drivers checked for clean credentials & vehicle inspections.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Select Ride Category</label>
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
                        <span className="block text-xs">CusRide Bike</span>
                        <span className="text-[9px] text-slate-500 font-normal">Fastest Solo Route</span>
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
                        <span className="block text-xs">CusRide Car</span>
                        <span className="text-[9px] text-slate-500 font-normal">Spacious AC Cabin</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Number of Passengers</label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                      className="w-full text-xs font-medium border border-slate-200 focus:outline-none rounded-xl px-3 py-3"
                    >
                      <option value="1">1 Passenger (Solo Rider)</option>
                      {rideTier === 'premium' && (
                        <>
                          <option value="2">2 Passengers</option>
                          <option value="3">3 Passengers</option>
                          <option value="4">4 Passengers (Max Hatchback)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Pickup Standing Landmark notes</label>
                  <textarea
                    rows={2}
                    className="w-full text-xs font-medium border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl p-3"
                    placeholder="e.g. Standing opposite the main elevator lobby, wearing cream shirt."
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
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">estimated total payment</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
                      IDR {currentFare.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      (incl. VAT & system fee)
                    </span>
                  </div>
                  {activeTab !== 'food' && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Distance: <strong className="text-slate-600">{routeDistance.toFixed(1)} km</strong> • Basic routing rate applied.
                    </span>
                  )}
                </div>

                {/* Checkout selection with payment validation */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cuspay')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                        paymentMethod === 'cuspay' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      CusPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                        paymentMethod === 'cash' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Cash
                    </button>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Book {activeTab === 'goods' ? 'CusSend Parcel' : activeTab === 'food' ? 'CusFood Order' : 'CusRide Cab'}
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
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-slate-500" /> GPS Dispatch Dispatcher
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full font-mono">
              REAL-TIME MAP
            </span>
          </div>

          <div className="p-4">
            <CityMap order={activeOrderDetails || undefined} />
          </div>

          <div className="p-5 border-t border-slate-100 space-y-4">
            {!activeOrderDetails ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Active Dispatches</h4>
                <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto mt-1">
                  Place an order above for goods, food, or passenger rides to observe the simulation.
                </p>
              </div>
            ) : (
              <div>
                {/* Active order info bar */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500 text-white font-mono">
                      {activeOrderDetails.type.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5">
                      Order ID: {activeOrderDetails.id.slice(0, 10).toUpperCase()}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      IDR {activeOrderDetails.fare.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Via {activeOrderDetails.paymentMethod.toUpperCase()}</span>
                  </div>
                </div>

                {/* Pipeline visual milestones */}
                <div className="relative pl-6 space-y-4 py-2 border-l border-slate-200">
                  {/* Step 1: Placed */}
                  <div className="relative">
                    <div className="absolute -left-9 top-0.5 w-6.5 h-6.5 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Order Dispatched</h5>
                    <p className="text-[10px] text-slate-500">Wait for courier matching on grid.</p>
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
                      Courier Matched
                    </h5>
                    {activeOrderDetails.courierName ? (
                      <p className="text-[10px] text-slate-500">{activeOrderDetails.courierName} ({activeOrderDetails.courierPhone})</p>
                    ) : (
                      <p className="text-[10px] text-slate-400">Waiting for driver dispatch...</p>
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
                      In Route (Transit)
                    </h5>
                    <p className="text-[10px] text-slate-500">Package undergoing transport on board.</p>
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
                      Successfully Delivered
                    </h5>
                    <p className="text-[10px] text-slate-500">Completed. Safe and sound.</p>
                  </div>
                </div>

                {/* Quick Simulation Help Banner */}
                {activeOrderDetails.status === 'pending' && (
                  <div className="mt-4 p-3 bg-teal-50 text-teal-800 text-[11px] rounded-xl border border-teal-100 font-sans flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Simulator Protip:</strong> Switch to the <strong>"Courier Hub"</strong> at the top header to accept and drive this pending order manually from the cargo deck!
                    </span>
                  </div>
                )}

                {/* Cancel Ticket Section */}
                {['pending', 'accepted'].includes(activeOrderDetails.status) && (
                  <button
                    onClick={() => onCancelOrder(activeOrderDetails.id)}
                    className="mt-4 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    Cancel Booking Request
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
                        <p className="text-[10px] text-slate-500 mt-0.5">Licensed Custom Courier | 4.9 Rating</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-900 block font-mono">B 4118 ANT</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase bg-slate-200/80 px-1.5 py-0.5 rounded-md mt-0.5">Scooter</span>
                      </div>
                    </div>

                    {/* Chat System interface mock */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner">
                      <div className="bg-slate-100 px-4 py-2 flex items-center gap-1.5 border-b border-slate-150">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-550" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Direct Communication Channel</span>
                      </div>

                      {/* Chat messages viewport */}
                      <div className="bg-slate-50 p-3 h-40 overflow-y-auto space-y-2 text-[11px] font-medium leading-relaxed">
                        {(!activeOrderDetails.chatMessages || activeOrderDetails.chatMessages.length === 0) ? (
                          <div className="text-center text-slate-400 py-10 font-normal">
                            No messages logged yet. Send directions to your Courier below!
                          </div>
                        ) : (
                          activeOrderDetails.chatMessages.map((msg, idx) => {
                            const isMine = msg.sender === 'customer';
                            return (
                              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                                  isMine
                                    ? 'bg-amber-500 text-white rounded-tr-none'
                                    : 'bg-slate-200 text-slate-800 rounded-tl-none'
                                }`}>
                                  <p>{msg.message}</p>
                                  <span className={`text-[8px] mt-0.5 block ${isMine ? 'text-amber-100' : 'text-slate-400'} text-right`}>
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
                          placeholder="Type directions here..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Rating review state for finished orders */}
                {activeOrderDetails.status === 'completed' && (
                  <div className="mt-5 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-yellow-950 flex items-center gap-1">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-current" /> Rate Professional Driver Service
                    </h4>
                    <p className="text-[10px] text-yellow-800">
                      Your courier successfully delivered. Rate the service and drop a constructive review.
                    </p>

                    <div className="flex gap-1.5 items-center justify-center py-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStars(s)}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star className={`w-6 h-6 ${s <= stars ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      className="w-full text-xs font-medium bg-white border border-slate-200 focus:outline-none rounded-xl p-3"
                      placeholder="Add an optional comment..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />

                    <button
                      onClick={() => {
                        onRateCourier(activeOrderDetails.id, stars, reviewText);
                        setReviewText('');
                        setSelectedOrder(null);
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Submit Feedback Review & Clear
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
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
              Dispatched Transactions ({activeOrders.length})
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
                        {ord.type}
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
                    <span className={`text-[9px] font-bold ${
                      ord.status === 'completed'
                        ? 'text-emerald-600'
                        : ord.status === 'pending'
                        ? 'text-blue-500 animate-pulse'
                        : 'text-amber-600'
                    }`}>
                      {ord.status.toUpperCase()}
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
