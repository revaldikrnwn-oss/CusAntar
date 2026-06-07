/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CourierProfile, Order, VehicleType } from '../types';
import CityMap from './CityMap';
import {
  TrendingUp,
  Award,
  Power,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  AlertOctagon,
  Car,
  User,
  Star,
  ChevronRight,
  Database,
  Navigation,
  Sparkles
} from 'lucide-react';

interface CourierPanelProps {
  courier: CourierProfile;
  activeOrders: Order[];
  onUpdateStatus: (orderId: string, status: any) => void;
  onUpdateProfile: (updated: Partial<CourierProfile>) => void;
  onSendMessage: (orderId: string, text: string) => void;
  onGenerateSimulatedJob: () => void;
}

export default function CourierPanel({
  courier,
  activeOrders,
  onUpdateStatus,
  onUpdateProfile,
  onSendMessage,
  onGenerateSimulatedJob,
}: CourierPanelProps) {
  const [chatInputs, setChatInputs] = useState<{ [orderId: string]: string }>({});
  const [editVehicle, setEditVehicle] = useState(false);

  // Profile fields editing state
  const [vType, setVType] = useState<VehicleType>(courier.vehicleType);
  const [vModel, setVModel] = useState(courier.vehicleModel);
  const [vPlate, setVPlate] = useState(courier.vehiclePlate);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      vehicleType: vType,
      vehicleModel: vModel,
      vehiclePlate: vPlate.toUpperCase(),
    });
    setEditVehicle(false);
  };

  const handleChatSubmit = (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    const txt = chatInputs[orderId] || '';
    if (txt.trim()) {
      onSendMessage(orderId, txt.trim());
      setChatInputs(prev => ({ ...prev, [orderId]: '' }));
    }
  };

  const sendQuickReply = (orderId: string, text: string) => {
    onSendMessage(orderId, text);
  };

  // Find incoming matching orders
  // 1) "Requested" orders wait to be accepted
  // 2) Active orders are currently accepted by this courier
  const pendingRequests = activeOrders.filter(o => o.status === 'pending');
  const myActiveOrder = activeOrders.find(
    o => o.courierId === courier.id && o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div id="courier-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto">
      {/* COURIER PROFILE / MANAGEMENT PANEL (4 columns) */}
      <div className="lg:col-span-4 space-y-6">

        {/* COURIER PRIMARY CARD */}
        <div className="bg-gradient-to-br from-teal-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-teal-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full border-2 border-teal-400 overflow-hidden relative flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold font-sans tracking-tight">{courier.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${courier.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs text-teal-200 uppercase font-bold tracking-wider font-mono">
                  {courier.isOnline ? 'Active Dispatcher' : 'Offline / Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* Core Driver Key Statistics */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-teal-900/60 rounded-2xl p-3 border border-teal-800/40">
              <span className="text-[9px] uppercase font-mono text-teal-300 font-bold tracking-wide">Total Earnings</span>
              <span className="text-sm font-black font-sans block text-yellow-400 mt-1">
                IDR {courier.earnings.toLocaleString()}
              </span>
            </div>

            <div className="bg-teal-900/60 rounded-2xl p-3 border border-teal-800/40">
              <span className="text-[9px] uppercase font-mono text-teal-300 font-bold tracking-wide">Courier Rating</span>
              <span className="text-sm font-black font-sans flex items-center gap-1 text-teal-200 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" /> {courier.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-teal-900 flex justify-between items-center gap-4">
            <span className="text-xs font-semibold text-teal-100">Toggle Dispatch State</span>
            <button
              onClick={() => onUpdateProfile({ isOnline: !courier.isOnline })}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                courier.isOnline
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {courier.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* DRIVER ACTIVE VEHICLE SETUP */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-teal-700" /> Active Fleet Profile
            </h3>
            {!editVehicle && (
              <button
                type="button"
                onClick={() => setEditVehicle(true)}
                className="text-teal-700 hover:text-teal-900 text-xs font-bold underline cursor-pointer"
              >
                Change Profile
              </button>
            )}
          </div>

          {!editVehicle ? (
            <div className="space-y-4">
              <div className="flex justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl items-center text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Vehicle Tier</span>
                  <span className="font-bold text-slate-900 uppercase">{courier.vehicleType}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Model</span>
                  <span className="font-medium text-slate-700">{courier.vehicleModel}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Reg Plate</span>
                  <span className="font-mono font-bold text-teal-800 bg-teal-100/50 px-2.5 py-0.5 rounded-md">
                    {courier.vehiclePlate}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-teal-50/50 rounded-2xl text-[11px] text-teal-850 border border-teal-100 leading-relaxed">
                Registered couriers keep 90% commission of every completed parcel or passenger transit fare! Change plates or vehicle tiers anytime prior to accepting bookings.
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Fleet Tier</label>
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value as VehicleType)}
                  className="w-full text-xs font-medium border border-slate-200 px-3 py-2 bg-white rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                >
                  <option value="scooter">CusAntar Scooter (Eco)</option>
                  <option value="bike">CusAntar Bicycle (Courier-Mesh)</option>
                  <option value="car">CusAntar Car (CusRide Sedan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Model Description</label>
                  <input
                    type="text"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Plate Registration</label>
                  <input
                    type="text"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Active Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditVehicle(false)}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* MOCK JOB GENERATION TEST TOOL */}
        <div className="bg-amber-50/40 rounded-3xl border border-dashed border-amber-300 p-5 space-y-3.5">
          <div className="flex items-center gap-1.5">
            <Database className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wide">Developer Sandbox Tools</h3>
          </div>
          <p className="text-[11px] text-amber-850 leading-relaxed font-sans">
            Need to test the Courier dashboard instantly? Click below to inject a simulated on-demand order (goods, food, or passenger journey) directly onto the grid.
          </p>
          <button
            onClick={onGenerateSimulatedJob}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" /> Generate Synthetic Customer Request
          </button>
        </div>
      </div>

      {/* COURIER ACTIVE DISPATCH / JOB radar (8 columns) */}
      <div className="lg:col-span-8 space-y-6">

        {/* LIVE WORK STATION MAP */}
        <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-4">
          <CityMap order={myActiveOrder || undefined} courierOnline={courier.isOnline} />
        </div>

        {/* SCENARIO A: COURIER IS OFFLINE */}
        {!courier.isOnline && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
            <AlertOctagon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">You Are Offline</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5">
              Turn on your GPS "Go Online" slider in the profile card on the left panel to begin scanning for customer delivery requests!
            </p>
          </div>
        )}

        {/* SCENARIO B: ONLINE & UNDERGOING TRANSIT SIMULATION */}
        {courier.isOnline && myActiveOrder && (
          <div className="bg-white rounded-3xl border border-teal-150 shadow-md overflow-hidden animate-fade-in">
            {/* Header notification bar of status */}
            <div className="bg-teal-700 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-mono bg-white/20 px-2 py-0.5 rounded-full tracking-wider font-bold">
                  ACTIVE COMMITTED DISPATCH
                </span>
                <h3 className="text-base font-bold font-sans mt-1.5">
                  Task ID: #{myActiveOrder.id.slice(0, 10).toUpperCase()}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-teal-200 font-mono block">YOUR COMMISSION TAKE</span>
                <span className="text-xl font-black text-yellow-400 font-mono">
                  IDR {Math.round(myActiveOrder.fare * 0.9).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Specific Info */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-150 pb-1">
                    Booking Specifications
                  </h4>

                  <div>
                    <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Service category</span>
                    <span className="font-bold text-slate-900 capitalize text-xs mt-0.5 block">{myActiveOrder.type} Delivery</span>
                  </div>

                  <div>
                    <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Origin Location</span>
                    <span className="font-semibold text-slate-800 block mt-0.5 leading-snug">{myActiveOrder.origin.address}</span>
                  </div>

                  <div>
                    <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Drop-off destination</span>
                    <span className="font-semibold text-slate-800 block mt-0.5 leading-snug">{myActiveOrder.destination.address}</span>
                  </div>

                  {myActiveOrder.type === 'goods' && (
                    <div>
                      <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Cargo Weight / Item</span>
                      <p className="font-medium text-slate-705 mt-0.5">
                        {myActiveOrder.details.goods?.parcelName} ({myActiveOrder.details.goods?.weight} kg)
                      </p>
                    </div>
                  )}

                  {myActiveOrder.type === 'food' && (
                    <div>
                      <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Merchant Kitchen</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {myActiveOrder.details.food?.restaurantName}
                      </p>
                      <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-amber-500">
                        {myActiveOrder.details.food?.items.map((it, idx) => (
                          <div key={idx} className="text-[10px] text-slate-600">
                            {it.quantity}x {it.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {myActiveOrder.type === 'passenger' && (
                    <div>
                      <span className="font-bold block text-slate-400 uppercase text-[9px] font-mono">Rider count & Class</span>
                      <p className="font-medium text-slate-705 mt-0.5">
                        {myActiveOrder.details.passenger?.passengerCount} Passenger(s) • CusRide {myActiveOrder.details.passenger?.vehicleTier}
                      </p>
                    </div>
                  )}
                </div>

                {/* ADVANCED STEP SIMULATOR CONTROLS */}
                <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-3 text-xs">
                  <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[10px]">
                    Step-by-Step Delivery Actions
                  </h4>

                  {myActiveOrder.status === 'accepted' && (
                    <button
                      onClick={() => onUpdateStatus(myActiveOrder.id, 'picking_up')}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Step 1: Arrive at pick-up location
                    </button>
                  )}

                  {myActiveOrder.status === 'picking_up' && (
                    <button
                      onClick={() => onUpdateStatus(myActiveOrder.id, 'in_transit')}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Step 2: Cargo On-board / Commencing Transit
                    </button>
                  )}

                  {myActiveOrder.status === 'in_transit' && (
                    <button
                      onClick={() => onUpdateStatus(myActiveOrder.id, 'arrived')}
                      className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Step 3: Arrived at Drop-off Position
                    </button>
                  )}

                  {myActiveOrder.status === 'arrived' && (
                    <button
                      onClick={() => onUpdateStatus(myActiveOrder.id, 'completed')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Step 4: Confirm Delivery Finish & Collect Payment
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400 mt-1 block leading-tight text-center">
                    Updating the dispatch state will post simulated coordinates and automated notification alerts to the customer.
                  </span>
                </div>
              </div>

              {/* Courier-to-Customer Chat view */}
              <div className="space-y-4">
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-inner flex flex-col h-full">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-1.5 border-b border-slate-150 justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono">
                      CHAT WITH customer: {myActiveOrder.customerName}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Messages container */}
                  <div className="bg-slate-50 p-4 flex-grow h-52 overflow-y-auto space-y-2.5 text-[11px] font-medium leading-relaxed">
                    {(!myActiveOrder.chatMessages || myActiveOrder.chatMessages.length === 0) ? (
                      <div className="text-center text-slate-400 py-16 font-normal">
                        Communication open. Select a quick reply or type custom message below to establish contact.
                      </div>
                    ) : (
                      myActiveOrder.chatMessages.map((msg, idx) => {
                        const isMine = msg.sender === 'courier';
                        return (
                          <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                              isMine
                                ? 'bg-teal-700 text-white rounded-tr-none'
                                : 'bg-slate-200 text-slate-800 rounded-tl-none'
                            }`}>
                              <p>{msg.message}</p>
                              <span className={`text-[8px] mt-0.5 block ${isMine ? 'text-teal-100' : 'text-slate-400'} text-right`}>
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Answers Chips */}
                  <div className="p-2.5 bg-slate-100/50 border-t border-slate-150 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => sendQuickReply(myActiveOrder.id, "Hi there! I am on my way to deliver your items.")}
                      className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      "On my way!"
                    </button>
                    <button
                      type="button"
                      onClick={() => sendQuickReply(myActiveOrder.id, "I have arrived at the designated pick-up entrance!")}
                      className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      "Arrived at pick-up!"
                    </button>
                    <button
                      type="button"
                      onClick={() => sendQuickReply(myActiveOrder.id, "Package securely packed. COMMENCING TRANSIT Now.")}
                      className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      "Commencing Transit!"
                    </button>
                    <button
                      type="button"
                      onClick={() => sendQuickReply(myActiveOrder.id, "Deliver finished at your door boundary. Thanks for selecting CusAntar!")}
                      className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      "Delivery complete!"
                    </button>
                  </div>

                  {/* Chat Input form */}
                  <form onSubmit={(e) => handleChatSubmit(e, myActiveOrder.id)} className="flex border-t border-slate-150 p-2 bg-white gap-1.5">
                    <input
                      type="text"
                      className="flex-grow text-xs pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-700 focus:outline-none"
                      placeholder="Type custom dispatch message..."
                      value={chatInputs[myActiveOrder.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatInputs(prev => ({ ...prev, [myActiveOrder.id]: val }));
                      }}
                    />
                    <button
                      type="submit"
                      className="px-4 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO C: ONLINE & IDLE - WAITING FOR CUSTOMER ORDERS */}
        {courier.isOnline && !myActiveOrder && (
          <div className="space-y-6 animate-fade-in">
            {/* GPS Pulse Animation area */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden text-white shadow-xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/10 rounded-full animate-ping pointer-events-none"></div>

              <Truck className="w-12 h-12 text-teal-400 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-black font-mono tracking-widest text-teal-400 uppercase">
                ACTIVE GPS RADAR DISPATCH ON
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                Scanning the city grid block for incoming restaurant, parcel, or taxi cab bookings. Try booking from the Customer Portal above or tap "Generate Synthetic Customer Request" on the left sidebar to simulate!
              </p>
            </div>

            {/* PENDING CUSTOMER BOOKINGS LIST */}
            <div className="bg-white rounded-3xl border border-slate-150 p-6 space-y-4 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold font-mono text-slate-850 uppercase tracking-widest">
                  Live Terminal Requests ({pendingRequests.length})
                </h3>
                <span className="text-[10px] text-teal-700 font-mono font-bold animate-pulse">● LIVE SCANNING</span>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No pending bookings found on the grid right now.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {pendingRequests.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 border border-slate-100 rounded-2xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-teal-500 transition-all shadow-sm"
                    >
                      <div className="space-y-1.5 min-w-0 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500 text-white font-mono">
                            {ord.type}
                          </span>
                          <span className="text-[11px] text-slate-500 block font-mono font-bold">
                            #{ord.id.slice(0, 12).toUpperCase()}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-800">
                          <span className="text-slate-400 text-[10px] block uppercase font-mono tracking-wider">Pickup destination</span>
                          <span className="font-bold text-slate-900 block truncate max-w-sm mt-0.5">{ord.origin.address}</span>
                          <span className="text-slate-400 text-[10px] block uppercase font-mono tracking-wider mt-1.5">Drop-off destination</span>
                          <span className="font-bold text-slate-900 block truncate max-w-sm mt-0.5">{ord.destination.address}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-dashed border-slate-150 md:border-t-0">
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono block uppercase">Est. Commission Share</span>
                          <span className="text-base font-bold text-teal-800 font-mono block">
                            IDR {Math.round(ord.fare * 0.9).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => onUpdateStatus(ord.id, 'accepted')}
                          className="w-full md:w-auto px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Accept Booking Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
