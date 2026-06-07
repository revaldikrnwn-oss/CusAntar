/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Restaurant } from './types';

export const PRESET_LOCATIONS = [
  { address: 'Evergreen Heights Apartments, Tower A', lat: -6.2088, lng: 106.8456 },
  { address: 'Grand Nusantara Office Hub, Block C', lat: -6.2012, lng: 106.8201 },
  { address: 'Sudirman Central Plaza, Lobby West', lat: -6.2297, lng: 106.8158 },
  { address: 'Kemang Food Street, Stall #12', lat: -6.2731, lng: 106.8206 },
  { address: 'Menteng Heritage Residence, No. 44', lat: -6.1892, lng: 106.8322 },
  { address: 'Pacific Mall Galleria, Level 2 Entrance', lat: -6.2241, lng: 106.8093 },
  { address: 'Golden Star Garden Residences, Block B', lat: -6.1754, lng: 106.8271 },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Nasi Goreng Nusantara Premium',
    cuisine: 'Traditional Indonesian',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '20-25 mins',
    items: [
      {
        id: 'food-1-1',
        name: 'Nasi Goreng Wagyu',
        description: 'Fragrant fried rice wok-tossed with tender premium Wagyu beef slices and aromatic spices.',
        price: 52000,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-1-2',
        name: 'Sate Ayam Madura (5 pcs)',
        description: 'Tender chicken skewers grilled on charcoal, topped with rich homemade sweet peanut sauce.',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-1-3',
        name: 'Kerupuk Udang Jumbo',
        description: 'Giant, crispy, savory prawn crackers. The perfect crunchy companion.',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&auto=format&fit=crop&q=60',
      }
    ]
  },
  {
    id: 'rest-2',
    name: 'Burger Antar Special',
    cuisine: 'Gourmet American',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '15-20 mins',
    items: [
      {
        id: 'food-2-1',
        name: 'CusAntar Double Cheese',
        description: 'Double flame-broiled beef patties, melted cheddar, sweet caramelized onions, and signature secret sauce.',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-2-2',
        name: 'Truflle Fries',
        description: 'Thick cut potato fires drizzled with real white truffle oil and dusted with imported parmesan cheese.',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-2-3',
        name: 'Cold-Brew Ice Latte',
        description: 'Rich Arabica cold brew sweetened with organic honey and topped with smooth full-cream milk.',
        price: 18000,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&auto=format&fit=crop&q=60',
      }
    ]
  },
  {
    id: 'rest-3',
    name: 'Kopi & Roti Kenangan Indah',
    cuisine: 'Coffee & Dessert',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '10-15 mins',
    items: [
      {
        id: 'food-3-1',
        name: 'Kopi Susu Aren Legend',
        description: 'Award-winning iced milk coffee brewed with single-origin beans and liquid organic palm sugar (gula aren).',
        price: 19000,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-3-2',
        name: 'Roti Bakar Srikaya Butter',
        description: 'Toasted premium brioche bread stuffed with fresh creamy srikaya jam and cold salted premium butter blocks.',
        price: 22000,
        image: 'https://images.unsplash.com/photo-1587960389236-47b253991984?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-3-3',
        name: 'Choco Croissant Crunch',
        description: 'Golden flaky French croissant loaded with melted chocolate ganache and crispy hazelnut crumbs.',
        price: 26000,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60',
      }
    ]
  }
];
