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
    cuisine: 'Tradisional Indonesia',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '20-25 Menit',
    items: [
      {
        id: 'food-1-1',
        name: 'Nasi Goreng Wagyu',
        description: 'Nasi goreng harum yang dioseng wajan dengan potongan daging sapi Wagyu premium yang empuk dan bumbu rempah pilihan.',
        price: 52000,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-1-2',
        name: 'Sate Ayam Madura (5 tusuk)',
        description: 'Sate ayam empuk yang dipanggang arang tradisional, disiram bumbu kacang manis buatan rumah yang gurih melimpah.',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-1-3',
        name: 'Kerupuk Udang Jumbo',
        description: 'Kerupuk udang raksasa yang renyah dan gurih. Teman makan nasi goreng yang sangat pas.',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&auto=format&fit=crop&q=60',
      }
    ]
  },
  {
    id: 'rest-2',
    name: 'Burger Antar Special',
    cuisine: 'Barat / Burger',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '15-20 Menit',
    items: [
      {
        id: 'food-2-1',
        name: 'CusAntar Double Cheese',
        description: 'Dua daging sapi panggang api yang juicy, keju cheddar meleleh, bawang bombay karamel manis, dan saus rahasia khusus.',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-2-2',
        name: 'Truffle Fries Gurih',
        description: 'Kentang goreng potong tebal yang disiram minyak truffle putih mewah asli dan taburan keju parmesan impor.',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-2-3',
        name: 'Cold-Brew Ice Latte',
        description: 'Kopi dingin (cold brew) Arabika pekat yang dimaniskan dengan madu organik alami dan susu full-cream yang lembut.',
        price: 18000,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&auto=format&fit=crop&q=60',
      }
    ]
  },
  {
    id: 'rest-3',
    name: 'Kopi & Roti Kenangan Indah',
    cuisine: 'Kopi & Dessert',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60',
    deliveryTime: '10-15 Menit',
    items: [
      {
        id: 'food-3-1',
        name: 'Kopi Susu Aren Legend',
        description: 'Kopi susu es legendaris yang diseduh dari biji kopi pilihan (single-origin) dan gula aren cair organik asli.',
        price: 19000,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-3-2',
        name: 'Roti Bakar Srikaya Butter',
        description: 'Roti brioche premium panggang yang diisi selai srikaya kental buatan sendiri dan potongan mentega asin dingin melimpah.',
        price: 22000,
        image: 'https://images.unsplash.com/photo-1587960389236-47b253991984?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'food-3-3',
        name: 'Choco Croissant Crunch',
        description: 'Croissant khas Prancis renyah berwarna cokelat keemasan berisi cokelat ganache meleleh dan remahan kacang hazelnut garing.',
        price: 26000,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60',
      }
    ]
  }
];
