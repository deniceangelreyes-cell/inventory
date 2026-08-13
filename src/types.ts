/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  photo: string;
}

export type ServiceStatus = 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';

export type ReportType = 'service' | 'buyer_sale';

export interface ServiceItemUsed {
  itemId: number;
  itemName: string;
  model: string;
  qty: number;
  unitPrice: string;
}

export interface BuyerSaleItem {
  itemId: number;
  itemName: string;
  model: string;
  category: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ServiceRecord {
  id: string;
  reportType?: ReportType;
  customer: string;
  phone: string;
  address: string;
  item: string;
  category: string;
  status: ServiceStatus;
  technician: string;
  notes: string;
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  amount: string;
  serviceDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  created: string;
  updated: string;
  itemsUsed?: ServiceItemUsed[];

  // Buyer sale specific fields
  paymentMethod?: string;
  buyerItems?: BuyerSaleItem[];
  totalQtySold?: number;
  cashierName?: string;
  purchaseDate?: string;
  fulfillmentType?: 'In-Store Pick Up' | 'For Delivery';
}

export interface InventoryItem {
  id: number;
  name: string;
  itemName: string; // e.g. "AUX Inverter Split-Type 1.5HP"
  model: string;
  category: string; // e.g. "Aircon Units", "Spare Parts", "Accessories"
  qty: number;
  location: string;
  price?: string;
  qrCode?: string;
  qrDataUrl?: string;
  isArchived?: boolean;
}

export type ActiveTab = 'dashboard' | 'inventory' | 'scan' | 'reports' | 'profile';

export type AppScreen = 'splash' | 'loading' | 'auth' | 'main';

export type AuthSubScreen = 'signup' | 'login' | 'forgot';
