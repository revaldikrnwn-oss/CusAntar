/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'courier';

export type VehicleType = 'bike' | 'scooter' | 'car';

export type OrderType = 'goods' | 'food' | 'passenger';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'picking_up'
  | 'in_transit'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  balance: number; // CusPay balance
  rating?: number;
}

export interface CourierProfile {
  id: string;
  name: string;
  phone: string;
  photo: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehiclePlate: string;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  earnings: number;
}

export interface FoodOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  goods?: {
    parcelName: string;
    weight: number; // in kg
    description: string;
    recipientName: string;
    recipientPhone: string;
  };
  food?: {
    restaurantName: string;
    items: FoodOrderItem[];
    deliveryNote: string;
  };
  passenger?: {
    vehicleTier: 'standard' | 'premium';
    passengerCount: number;
    specialNotes: string;
  };
}

export interface LocationCoordinates {
  address: string;
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  type: OrderType;
  details: OrderDetails;
  origin: LocationCoordinates;
  destination: LocationCoordinates;
  fare: number;
  paymentMethod: 'cuspay' | 'cash';
  status: OrderStatus;
  createdAt: string;
  courierLocation?: { lat: number; lng: number };
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'courier';
  message: string;
  timestamp: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  image: string;
  deliveryTime: string;
  items: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  }[];
}
