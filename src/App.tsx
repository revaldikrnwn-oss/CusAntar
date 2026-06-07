/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, CourierProfile, Order, ChatMessage, VehicleType, OrderType } from './types';
import { PRESET_LOCATIONS } from './data';
import AuthScreen from './components/AuthScreen';
import CustomerPanel from './components/CustomerPanel';
import CusFoodPage from './components/CusFoodPage';
import CourierPanel from './components/CourierPanel';
import BrandLogo from './components/BrandLogo';
import { LogOut, RefreshCw, User, ToggleLeft, ShieldCheck, Compass, HelpCircle, Sparkles, Navigation, Utensils } from 'lucide-react';

export default function App() {
  // 1. Unified Authentication State (linked with localStorage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('cusantar_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeCourier, setActiveCourier] = useState<CourierProfile | null>(() => {
    const saved = localStorage.getItem('cusantar_courier_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Controls whether we are currently viewing the Customer Portal, CusFood, or Courier Hub
  const [activeView, setActiveView] = useState<'customer' | 'cusfood' | 'courier'>(() => {
    const saved = localStorage.getItem('cusantar_active_view');
    return (saved as 'customer' | 'cusfood' | 'courier') || 'customer';
  });

  // 2. Global Orders Database
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cusantar_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [enableAutoCourier, setEnableAutoCourier] = useState(true);

  // Sync state with localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cusantar_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cusantar_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeCourier) {
      localStorage.setItem('cusantar_courier_profile', JSON.stringify(activeCourier));
    } else {
      localStorage.removeItem('cusantar_courier_profile');
    }
  }, [activeCourier]);

  useEffect(() => {
    localStorage.setItem('cusantar_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('cusantar_orders', JSON.stringify(orders));
  }, [orders]);

  // Auth Operations
  const handleLoginSuccess = (user: UserAccount, courier?: CourierProfile) => {
    setCurrentUser(user);
    if (courier) {
      setActiveCourier(courier);
      setActiveView('courier');
    } else {
      setActiveCourier(null);
      setActiveView('customer');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCourier(null);
    localStorage.removeItem('cusantar_user');
    localStorage.removeItem('cusantar_courier_profile');
    localStorage.removeItem('cusantar_active_view');
  };

  // Wallet operations
  const handleTopUpWallet = (amount: number) => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return null;
      return { ...prev, balance: prev.balance + amount };
    });
  };

  // 3. Automated Courier AI simulation dispatch loops (Runs when user is Client and AUTO is enabled)
  useEffect(() => {
    if ((activeView !== 'customer' && activeView !== 'cusfood') || !enableAutoCourier) return;

    // Look for pending orders placed by this customer that don't have driver assigned
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) return;

    const timer = setTimeout(() => {
      const order = pendingOrders[0];

      // Assign satria courier profile automatically
      const assignedCourier: CourierProfile = {
        id: 'cour-preset-1',
        name: 'Satria Antar',
        phone: '+62 821-9988-7711',
        photo: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60',
        vehicleType: order.type === 'passenger' ? 'car' : 'scooter',
        vehicleModel: order.type === 'passenger' ? 'Toyota Avanza' : 'Honda PCX Black',
        vehiclePlate: order.type === 'passenger' ? 'B 3571 CUS' : 'B 4118 ANT',
        isOnline: true,
        rating: 4.9,
        totalDeliveries: 42,
        earnings: 125000,
      };

      // Transition order status to 'accepted' with courier credentials
      updateOrderStatusAndNotify(order.id, 'accepted', {
        courierId: assignedCourier.id,
        courierName: assignedCourier.name,
        courierPhone: assignedCourier.phone,
      });

      // Post first courier introduction message
      postChatMessage(order.id, 'courier', `Halo ${order.customerName}! Nama saya Satria, saya adalah kurir CusAntar yang ditugaskan untuk pesanan Anda. Saya sedang menuju ke lokasi Anda sekarang ya.`);
    }, 4000);

    return () => clearTimeout(timer);
  }, [orders, activeView, enableAutoCourier]);

  // Secondary simulation transitions for assigned AI couriers
  useEffect(() => {
    if ((activeView !== 'customer' && activeView !== 'cusfood') || !enableAutoCourier) return;

    const aiOrders = orders.filter(
      o => o.courierId === 'cour-preset-1' && !['completed', 'cancelled'].includes(o.status)
    );
    if (aiOrders.length === 0) return;

    const currentOrder = aiOrders[0];

    const pipelineTimer = setTimeout(() => {
      const stageMessageMap: { [key: string]: { nextStatus: string, msg: string } } = {
        'accepted': {
          nextStatus: 'picking_up',
          msg: "Saya sudah sampai di gerbang penjemputan/restoran ya! Saya menunggu dekat lobi utama."
        },
        'picking_up': {
          nextStatus: 'in_transit',
          msg: currentOrder.type === 'passenger'
            ? "Penumpang sudah naik ke dalam kendaraan! Kami siap berangkat menyusuri rute terbaik."
            : "Barang sudah termuat dengan aman dan kokoh! Sekarang saatnya meluncur ke alamat tujuan Anda."
        },
        'in_transit': {
          nextStatus: 'arrived',
          msg: "Saya telah sampai dengan selamat di lokasi pengantaran Anda! Saya berada di dekat pos checkpoint lobi."
        },
        'arrived': {
          nextStatus: 'completed',
          msg: "Pesanan telah sukses diserahkan! Semoga Anda sehat selalu. Silakan berikan ulasan bintang 5 di dashboard ya!"
        }
      };

      const handler = stageMessageMap[currentOrder.status];
      if (handler) {
        updateOrderStatusAndNotify(currentOrder.id, handler.nextStatus);
        postChatMessage(currentOrder.id, 'courier', handler.msg);

        // If completed, charge wallet of customer (if CusPay is chosen)
        if (handler.nextStatus === 'completed' && currentOrder.paymentMethod === 'cuspay') {
          setCurrentUser(prev => {
            if (!prev) return null;
            return { ...prev, balance: Math.max(0, prev.balance - currentOrder.fare) };
          });
        }
      }
    }, 15000); // Progress stages every 15 seconds automatically!

    return () => clearTimeout(pipelineTimer);
  }, [orders, activeView, enableAutoCourier]);

  // Placed Custom Brand Booking Or simulated Sandbox order
  const handlePlaceOrder = (orderData: Partial<Order>) => {
    if (!currentUser) return;

    const newOrder: Order = {
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      type: orderData.type || 'goods',
      details: orderData.details || {},
      origin: orderData.origin || PRESET_LOCATIONS[0],
      destination: orderData.destination || PRESET_LOCATIONS[1],
      fare: orderData.fare || 15000,
      paymentMethod: orderData.paymentMethod || 'cash',
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatMessages: [],
    };

    setOrders(prev => [newOrder, ...prev]);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'cancelled' as const };
      }
      return o;
    }).filter(o => o.status !== 'cancelled')); // Filter out cancelled ones or store them
  };

  // Helper statuses
  const updateOrderStatusAndNotify = (orderId: string, newStatus: any, extraData: Partial<Order> = {}) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus, ...extraData };
      }
      return o;
    }));
  };

  // Courier panels status state increments
  const handleCourierUpdateStatus = (orderId: string, newStatus: any) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    updateOrderStatusAndNotify(orderId, newStatus);

    // Dynamic messaging base on changes
    const systemMessages: { [key: string]: string } = {
      'picking_up': "Halo! Saya sudah sampai di sekitar titik penjemputan/restoran Anda ya, saya siap menerima muatan.",
      'in_transit': "Barang/Penumpang telah aman bersama saya. Rute pengantaran pintar telah diatur. Berangkat sekarang!",
      'arrived': "Saya telah tiba di lokasi tujuan pengantaran Anda! Mohon periksa lobi atau pintu depan ya.",
      'completed': "Pesanan sukses diserahkan! Transaksi pembayaran diselesaikan dengan aman. Terima kasih telah menggunakan CusAntar!"
    };

    if (systemMessages[newStatus]) {
      postChatMessage(orderId, 'courier', systemMessages[newStatus]);
    }

    // Ledger balance operations if completed
    if (newStatus === 'completed') {
      const commissionGain = Math.round(order.fare * 0.9);
      // Add payouts to driver
      if (activeCourier) {
        setActiveCourier(prev => {
          if (!prev) return null;
          return {
            ...prev,
            earnings: prev.earnings + commissionGain,
            totalDeliveries: prev.totalDeliveries + 1,
          };
        });
      }
      // Deduct customer wallet
      if (order.paymentMethod === 'cuspay') {
        setCurrentUser(prev => {
          if (!prev) return null;
          return { ...prev, balance: Math.max(0, prev.balance - order.fare) };
        });
      }
    }
  };

  // Edit vehicle setup profiles
  const handleCourierUpdateProfile = (updated: Partial<CourierProfile>) => {
    if (activeCourier) {
      setActiveCourier(prev => {
        if (!prev) return null;
        return { ...prev, ...updated };
      });
    }
  };

  // Messages handling
  const postChatMessage = (orderId: string, sender: 'customer' | 'courier', text: string) => {
    const freshMessage: ChatMessage = {
      id: Math.random().toString(),
      sender,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          chatMessages: [...(o.chatMessages || []), freshMessage]
        };
      }
      return o;
    }));
  };

  // Direct custom feedback ratings
  const handleRateCourier = (orderId: string, rating: number, review: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (activeCourier && order.courierId === activeCourier.id) {
      // Recalculate average stars
      setActiveCourier(prev => {
        if (!prev) return null;
        const count = prev.totalDeliveries || 1;
        const newRating = ((prev.rating * (count - 1)) + rating) / count;
        return { ...prev, rating: Math.min(5, Math.max(1, newRating)) };
      });
    }

    // Remove the completed transaction from the active grid
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Sandbox Synthetic Job Injector
  const handleGenerateSimulatedJob = () => {
    const categories: OrderType[] = ['goods', 'food', 'passenger'];
    const selectedType = categories[Math.floor(Math.random() * categories.length)];

    const randomId = `sim-${Math.random().toString(36).substr(2, 9)}`;
    const randPickup = PRESET_LOCATIONS[Math.floor(Math.random() * PRESET_LOCATIONS.length)];
    let randDropoff = PRESET_LOCATIONS[Math.floor(Math.random() * PRESET_LOCATIONS.length)];

    while (randDropoff.address === randPickup.address) {
      randDropoff = PRESET_LOCATIONS[Math.floor(Math.random() * PRESET_LOCATIONS.length)];
    }

    let details: any = {};
    if (selectedType === 'goods') {
      details = {
        goods: {
          parcelName: 'Document Folders & Keys',
          weight: 2,
          description: 'A urgent paper bundle for corporate signature.',
          recipientName: 'Vania Amanda',
          recipientPhone: '+62 813-2211-5050'
        }
      };
    } else if (selectedType === 'passenger') {
      details = {
        passenger: {
          vehicleTier: 'standard',
          passengerCount: 1,
          specialNotes: 'Wait under the building shelter'
        }
      };
    } else {
      details = {
        food: {
          restaurantName: 'Burger Antar Special',
          items: [{ name: 'CusAntar Double Cheese', quantity: 1, price: 45000 }],
          deliveryNote: 'Include extra chili sachets please'
        }
      };
    }

    const simOrder: Order = {
      id: randomId,
      customerId: 'cust-preset-99',
      customerName: 'Ahmad Rafli (Simulated Client)',
      customerPhone: '+62 819-2828-4499',
      type: selectedType,
      details,
      origin: randPickup,
      destination: randDropoff,
      fare: Math.round(12000 + Math.random() * 25000),
      paymentMethod: Math.random() > 0.5 ? 'cuspay' : 'cash',
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chatMessages: [],
    };

    setOrders(prev => [simOrder, ...prev]);
  };

  // Auth Guard
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="cusantar-workspace" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* GLOBAL SYSTEM HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-3.5 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Brand Logo Group */}
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div className="h-4 w-px bg-slate-800 hidden md:block" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 hidden md:block">
              Solusi Logistik Premium
            </span>
          </div>

          {/* Core Interactive Switching Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveView('customer')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'customer'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-4 h-4" /> Portal Pelanggan
            </button>

            <button
              onClick={() => setActiveView('cusfood')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'cusfood'
                  ? 'bg-red-650 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={{ backgroundColor: activeView === 'cusfood' ? '#dc2626' : undefined }}
            >
              <Utensils className="w-4 h-4" /> CusFood (Pesan Kuliner)
            </button>

            <button
              onClick={() => {
                // If they don't have driver profile, set up an active courier profile!
                if (!activeCourier) {
                  const autoProfile: CourierProfile = {
                    id: currentUser.id,
                    name: currentUser.name,
                    phone: currentUser.phone,
                    photo: currentUser.avatar,
                    vehicleType: 'scooter',
                    vehicleModel: 'Yamaha Lexi 2024',
                    vehiclePlate: 'B 3118 CUS',
                    isOnline: true,
                    rating: 5.0,
                    totalDeliveries: 0,
                    earnings: 0,
                  };
                  setActiveCourier(autoProfile);
                }
                setActiveView('courier');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'courier'
                  ? 'bg-teal-700 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Pusat Kurir & Driver
            </button>
          </div>

          {/* User profile actions & logout */}
          <div className="flex items-center gap-4">
            {/* Auto dispatcher trigger for customer viewing */}
            {(activeView === 'customer' || activeView === 'cusfood') && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px]">
                <span className="text-slate-400 font-mono font-bold uppercase tracking-wider">Autopilot Kurir AI:</span>
                <button
                  type="button"
                  onClick={() => setEnableAutoCourier(!enableAutoCourier)}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                    enableAutoCourier ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {enableAutoCourier ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-755">
                <img src={currentUser.avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-bold text-slate-100 block">{currentUser.name}</span>
                <span className="text-[10px] text-slate-450 block font-semibold">{currentUser.role === 'customer' ? 'Pelanggan' : 'Kurir Profesional'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 bg-slate-950 hover:bg-red-950 hover:text-red-400 border border-slate-800 rounded-xl text-slate-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Logout Account"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* QUICK SYSTEM HELP NOTIFIER SUB-HEADER */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-950 py-2.5 px-6 shrink-0 leading-normal">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-2 items-center justify-between text-xs">
          <p className="font-medium text-center md:text-left flex items-center gap-1">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-current" />
            <span>
              <strong>Ruang Kerja Simulasi CusAntar:</strong> Beralihlah antara Portal Pelanggan dan Pusat Kurir di bagian atas kapan saja untuk menyimulasikan siklus pencocokan pesanan.
            </span>
          </p>
          {(activeView === 'customer' || activeView === 'cusfood') && (
            <span className="text-[11px] text-amber-800">
              {enableAutoCourier
                ? '🤖 Autopilot Pengemudi AKTIF (Kurir AI Satria akan otomatis menerima & memproses pesanan)'
                : '🚘 Mode Manual AKTIF (Anda harus menjalankan tugas kurir secara manual dari Pusat Kurir)'}
            </span>
          )}
        </div>
      </div>

      {/* MAIN VIEW CONTROLLER BODY */}
      <main className="flex-grow py-4">
        {activeView === 'customer' ? (
          <CustomerPanel
            user={currentUser}
            activeOrders={orders}
            onPlaceOrder={handlePlaceOrder}
            onCancelOrder={handleCancelOrder}
            onTopUpWallet={handleTopUpWallet}
            onSendMessage={(orderId, text) => postChatMessage(orderId, 'customer', text)}
            onRateCourier={handleRateCourier}
          />
        ) : activeView === 'cusfood' ? (
          <CusFoodPage
            user={currentUser}
            activeOrders={orders}
            onPlaceOrder={handlePlaceOrder}
            onCancelOrder={handleCancelOrder}
            onTopUpWallet={handleTopUpWallet}
            onSendMessage={(orderId, text) => postChatMessage(orderId, 'customer', text)}
            onRateCourier={handleRateCourier}
          />
        ) : (
          <CourierPanel
            courier={activeCourier || {
              id: currentUser.id,
              name: currentUser.name,
              phone: currentUser.phone,
              photo: currentUser.avatar,
              vehicleType: 'scooter',
              vehicleModel: 'Yamaha Lexi 2024',
              vehiclePlate: 'B 3118 CUS',
              isOnline: true,
              rating: 5.0,
              totalDeliveries: 0,
              earnings: 0,
            }}
            activeOrders={orders}
            onUpdateStatus={handleCourierUpdateStatus}
            onUpdateProfile={handleCourierUpdateProfile}
            onSendMessage={(orderId, text) => postChatMessage(orderId, 'courier', text)}
            onGenerateSimulatedJob={handleGenerateSimulatedJob}
          />
        )}
      </main>

      {/* BRAND FOOTER ACCENT */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono">© 2026 Jaringan Transportasi Pengiriman CusAntar. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex gap-4">
            <a href="#city-map" className="hover:text-amber-500 font-semibold transition-all">Peta Radar Interaktif</a>
            <span>•</span>
            <span className="text-slate-400 font-mono font-bold">UTC: 2026-06-07 06:16Z</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
