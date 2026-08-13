import { UserProfile, ServiceRecord, InventoryItem } from './types';
import { createFallbackQrSvg } from './utils/qrHelper';

export const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#14b8a6"/>
        <stop offset="100%" stop-color="#0891b2"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#avatarGrad)"/>
    <circle cx="100" cy="80" r="40" fill="#fef08a"/>
    <path d="M40 180c0-35 25-55 60-55s60 20 60 55" fill="#334155"/>
  </svg>
`);

export const INITIAL_PROFILE: UserProfile = {
  name: 'Denice Angel Reyes',
  email: 'deniceangelreyes@gmail.com',
  username: 'denicereyes',
  password: 'password123',
  phone: '0917 123 4567',
  photo: DEFAULT_AVATAR
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  // AIRCON UNITS
  {
    id: 1,
    name: 'Unit A',
    itemName: 'AUX Inverter Split-Type 1.0HP',
    model: 'AUX-09INV-JS',
    category: 'Aircon Units',
    qty: 18,
    location: 'Unit Bay A-1',
    price: '₱24,500.00',
    qrCode: 'AUX-UNIT-09JS-001',
    qrDataUrl: createFallbackQrSvg('AUX-UNIT-09JS-001')
  },
  {
    id: 2,
    name: 'Unit B',
    itemName: 'AUX Inverter Split-Type 1.5HP',
    model: 'AUX-12INV-HG',
    category: 'Aircon Units',
    qty: 24,
    location: 'Unit Bay A-2',
    price: '₱28,900.00',
    qrCode: 'AUX-UNIT-12HG-002',
    qrDataUrl: createFallbackQrSvg('AUX-UNIT-12HG-002')
  },
  {
    id: 3,
    name: 'Unit C',
    itemName: 'AUX Inverter Split-Type 2.0HP',
    model: 'AUX-18INV-FS',
    category: 'Aircon Units',
    qty: 12,
    location: 'Unit Bay B-1',
    price: '₱36,800.00',
    qrCode: 'AUX-UNIT-18FS-003',
    qrDataUrl: createFallbackQrSvg('AUX-UNIT-18FS-003')
  },
  {
    id: 4,
    name: 'Unit D',
    itemName: 'AUX Window Type Aircon 1.0HP',
    model: 'AUX-W09M',
    category: 'Aircon Units',
    qty: 8,
    location: 'Unit Bay C-1',
    price: '₱14,200.00',
    qrCode: 'AUX-UNIT-W09M-004',
    qrDataUrl: createFallbackQrSvg('AUX-UNIT-W09M-004')
  },
  {
    id: 5,
    name: 'Unit E',
    itemName: 'AUX Floor Standing Aircon 3.0HP',
    model: 'AUX-28FS-INV',
    category: 'Aircon Units',
    qty: 4,
    location: 'Heavy Storage Bay D',
    price: '₱68,500.00',
    qrCode: 'AUX-UNIT-28FS-005',
    qrDataUrl: createFallbackQrSvg('AUX-UNIT-28FS-005')
  },
  // SPARE PARTS & ACCESSORIES
  {
    id: 6,
    name: 'Part A',
    itemName: 'Aircon Washable Filter Net Grid',
    model: 'AUX-F220',
    category: 'Spare Parts',
    qty: 50,
    location: 'Shelf B upper side',
    price: '₱450.00',
    qrCode: 'AUX-PART-F220-006',
    qrDataUrl: createFallbackQrSvg('AUX-PART-F220-006')
  },
  {
    id: 7,
    name: 'Part B',
    itemName: 'Copper Pipe Coil 1/4 & 3/8 (15m)',
    model: 'AUX-C38',
    category: 'Spare Parts',
    qty: 15,
    location: 'Shelf A lower side',
    price: '₱3,200.00',
    qrCode: 'AUX-PART-C38-007',
    qrDataUrl: createFallbackQrSvg('AUX-PART-C38-007')
  },
  {
    id: 8,
    name: 'Part C',
    itemName: 'AUX Inverter Compressor 1.5HP R32',
    model: 'AUX-CMP-12R32',
    category: 'Spare Parts',
    qty: 6,
    location: 'Heavy Rack 2',
    price: '₱11,800.00',
    qrCode: 'AUX-PART-CMP12-008',
    qrDataUrl: createFallbackQrSvg('AUX-PART-CMP12-008')
  },
  {
    id: 9,
    name: 'Part D',
    itemName: 'Condenser Fan Motor 35W',
    model: 'AUX-CF12',
    category: 'Spare Parts',
    qty: 72,
    location: 'Shelf D lower side',
    price: '₱1,850.00',
    qrCode: 'AUX-PART-CF12-009',
    qrDataUrl: createFallbackQrSvg('AUX-PART-CF12-009')
  },
  {
    id: 10,
    name: 'Acc A',
    itemName: 'AUX Universal Smart AC Remote Control',
    model: 'AUX-R51',
    category: 'Accessories',
    qty: 45,
    location: 'Shelf C middle',
    price: '₱650.00',
    qrCode: 'AUX-ACC-R51-010',
    qrDataUrl: createFallbackQrSvg('AUX-ACC-R51-010')
  },
  {
    id: 14,
    name: 'Acc B',
    itemName: 'Heavy-Duty Aircon Wall Bracket Set (1.0HP-2.5HP)',
    model: 'AUX-BRK-HD',
    category: 'Accessories',
    qty: 30,
    location: 'Shelf C upper',
    price: '₱850.00',
    qrCode: 'AUX-ACC-BRK-014',
    qrDataUrl: createFallbackQrSvg('AUX-ACC-BRK-014')
  },
  {
    id: 15,
    name: 'Acc C',
    itemName: 'Vinyl Pipe Insulation Tape & Drainage Tube Kit',
    model: 'AUX-INS-KIT',
    category: 'Accessories',
    qty: 55,
    location: 'Shelf C lower',
    price: '₱380.00',
    qrCode: 'AUX-ACC-INS-015',
    qrDataUrl: createFallbackQrSvg('AUX-ACC-INS-015')
  },
  {
    id: 11,
    name: 'Part E',
    itemName: 'Inverter Main Control PCB Board',
    model: 'AUX-PCB-INV912',
    category: 'Spare Parts',
    qty: 9,
    location: 'Electronics Shelf E',
    price: '₱4,500.00',
    qrCode: 'AUX-PART-PCB912-011',
    qrDataUrl: createFallbackQrSvg('AUX-PART-PCB912-011')
  },
  {
    id: 12,
    name: 'Part F',
    itemName: 'Refrigerant Gas R410A Tank (11.3kg)',
    model: 'AUX-R410A-TNK',
    category: 'Spare Parts',
    qty: 16,
    location: 'Chemical Depot A',
    price: '₱3,800.00',
    qrCode: 'AUX-PART-R410A-012',
    qrDataUrl: createFallbackQrSvg('AUX-PART-R410A-012')
  },
  {
    id: 13,
    name: 'Part G',
    itemName: 'Capacitor 35uF 450VAC Heavy Duty',
    model: 'AUX-CAP-35',
    category: 'Spare Parts',
    qty: 60,
    location: 'Bin 12',
    price: '₱320.00',
    qrCode: 'AUX-PART-CAP35-013',
    qrDataUrl: createFallbackQrSvg('AUX-PART-CAP35-013')
  }
];

export const INITIAL_REPORTS: ServiceRecord[] = [
  {
    id: 'BUY-2001',
    reportType: 'buyer_sale',
    customer: 'Juan Dela Cruz',
    phone: '0918 888 7777',
    address: 'In-Store Pick Up',
    purchaseDate: '2026-01-16',
    fulfillmentType: 'In-Store Pick Up',
    item: 'Direct Counter Purchase (2 Items)',
    category: 'Direct Purchase',
    status: 'Completed',
    technician: 'N/A (Direct Sale)',
    notes: 'In-store walk-in buyer direct purchase via store counter.',
    paymentStatus: 'Paid',
    amount: '₱25,300.00',
    paymentMethod: 'GCash',
    cashierName: 'John Cruz',
    serviceDate: '2026-01-16',
    startTime: '10:15 AM',
    endTime: '10:20 AM',
    created: '2026-01-16',
    updated: '2026-01-16',
    totalQtySold: 2,
    buyerItems: [
      { itemId: 1, itemName: 'AUX Inverter Split-Type Aircon 1.0HP', model: 'AUX-09JS-01', category: 'Aircon Units', qty: 1, unitPrice: 22500, totalPrice: 22500 },
      { itemId: 12, itemName: 'Refrigerant Gas R410A Tank (11.3kg)', model: 'AUX-R410A-TNK', category: 'Spare Parts', qty: 1, unitPrice: 2800, totalPrice: 2800 }
    ]
  },
  {
    id: 'RPT-1001',
    reportType: 'service',
    customer: 'Maria Santos',
    phone: '0917 234 5678',
    address: '12 Mabini St, Pulilan, Bulacan',
    item: 'AUX Inverter Split-Type 1.0HP',
    category: 'Replacement',
    status: 'Completed',
    technician: 'John Cruz',
    notes: 'Replaced damaged air filter and refilled R410A refrigerant gas.',
    paymentStatus: 'Paid',
    amount: '₱4,250.00',
    serviceDate: '2026-01-15',
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    created: '2026-01-10',
    updated: '2026-01-15',
    itemsUsed: [
      { itemId: 6, itemName: 'Aircon Washable Filter Net Grid', model: 'AUX-F220', qty: 2, unitPrice: '₱450.00' },
      { itemId: 12, itemName: 'Refrigerant Gas R410A Tank', model: 'AUX-R410A-TNK', qty: 1, unitPrice: '₱3,350.00' }
    ]
  },
  {
    id: 'RPT-1002',
    customer: 'Ramon Dela Cruz',
    phone: '0928 111 2222',
    address: '45 Rizal Ave, Malolos, Bulacan',
    item: 'Copper Pipe Coil 1/4 & 3/8',
    category: 'Repair',
    status: 'In Progress',
    technician: 'John Cruz',
    notes: 'Replaced a leaked section of copper tubes and tested line pressure.',
    paymentStatus: 'Pending',
    amount: '₱5,000.00',
    serviceDate: '2026-01-15',
    startTime: '11:00 AM',
    endTime: '—',
    created: '2026-01-12',
    updated: '2026-01-15',
    itemsUsed: [
      { itemId: 7, itemName: 'Copper Pipe Coil 1/4 & 3/8 (15m)', model: 'AUX-C38', qty: 1, unitPrice: '₱3,200.00' },
      { itemId: 13, itemName: 'Capacitor 35uF 450VAC', model: 'AUX-CAP-35', qty: 1, unitPrice: '₱320.00' }
    ]
  },
  {
    id: 'RPT-1003',
    customer: 'Liza Fernandez',
    phone: '0917 555 3333',
    address: '8 Bonifacio St, Baliuag, Bulacan',
    item: 'AUX Inverter Split-Type 1.5HP',
    category: 'Maintenance',
    status: 'Scheduled',
    technician: 'John Cruz',
    notes: 'Scheduled comprehensive chemical cleaning and filter check.',
    paymentStatus: 'Unpaid',
    amount: '₱2,100.00',
    serviceDate: '2026-01-18',
    startTime: '2:00 PM',
    endTime: '—',
    created: '2026-01-13',
    updated: '2026-01-13',
    itemsUsed: [
      { itemId: 6, itemName: 'Aircon Washable Filter Net Grid', model: 'AUX-F220', qty: 1, unitPrice: '₱450.00' }
    ]
  },
  {
    id: 'RPT-1004',
    customer: 'Carlos Reyes',
    phone: '0919 888 4444',
    address: '23 Del Pilar St, Pulilan, Bulacan',
    item: 'AUX Inverter Compressor 1.5HP R32',
    category: 'Installation',
    status: 'Completed',
    technician: 'John Cruz',
    notes: 'Replaced old outdoor compressor unit and vacuumed line.',
    paymentStatus: 'Paid',
    amount: '₱16,300.00',
    serviceDate: '2026-01-19',
    startTime: '9:30 AM',
    endTime: '12:00 PM',
    created: '2026-01-13',
    updated: '2026-01-19',
    itemsUsed: [
      { itemId: 8, itemName: 'AUX Inverter Compressor 1.5HP R32', model: 'AUX-CMP-12R32', qty: 1, unitPrice: '₱11,800.00' },
      { itemId: 11, itemName: 'Inverter Main Control PCB Board', model: 'AUX-PCB-INV912', qty: 1, unitPrice: '₱4,500.00' }
    ]
  },
  {
    id: 'RPT-1005',
    customer: 'Andrea Mendoza',
    phone: '0917 777 6666',
    address: '56 Luna St, Plaridel, Bulacan',
    item: 'Condenser Fan Motor 35W',
    category: 'Maintenance',
    status: 'Scheduled',
    technician: 'John Cruz',
    notes: 'Regular fan motor inspection and blade replacement.',
    paymentStatus: 'Unpaid',
    amount: '₱2,800.00',
    serviceDate: '2026-01-20',
    startTime: '1:00 PM',
    endTime: '—',
    created: '2026-01-14',
    updated: '2026-01-14',
    itemsUsed: [
      { itemId: 9, itemName: 'Condenser Fan Motor 35W', model: 'AUX-CF12', qty: 1, unitPrice: '₱1,850.00' }
    ]
  },
  {
    id: 'RPT-1006',
    customer: 'Julius Bautista',
    phone: '0928 222 9999',
    address: '3 Aguinaldo St, Guiguinto, Bulacan',
    item: 'AUX Universal Smart AC Remote Control',
    category: 'Replacement',
    status: 'Cancelled',
    technician: 'John Cruz',
    notes: 'Customer canceled remote controller replacement request.',
    paymentStatus: 'Unpaid',
    amount: '₱650.00',
    serviceDate: '2026-01-16',
    startTime: '10:00 AM',
    endTime: '—',
    created: '2026-01-11',
    updated: '2026-01-16',
    itemsUsed: [
      { itemId: 10, itemName: 'AUX Universal Smart AC Remote Control', model: 'AUX-R51', qty: 1, unitPrice: '₱650.00' }
    ]
  },
  {
    id: 'RPT-1007',
    customer: 'Ferdinand Marcos Jr.',
    phone: '0918 999 1234',
    address: '88 MacArthur Highway, Malolos, Bulacan',
    item: 'AUX Floor Standing Aircon 3.0HP',
    category: 'Installation',
    status: 'Completed',
    technician: 'John Cruz',
    notes: 'Full installation of 3.0HP commercial floor standing aircon with 10m piping.',
    paymentStatus: 'Paid',
    amount: '₱76,500.00',
    serviceDate: '2026-01-10',
    startTime: '8:00 AM',
    endTime: '3:00 PM',
    created: '2026-01-05',
    updated: '2026-01-10',
    itemsUsed: [
      { itemId: 5, itemName: 'AUX Floor Standing Aircon 3.0HP', model: 'AUX-28FS-INV', qty: 1, unitPrice: '₱68,500.00' },
      { itemId: 7, itemName: 'Copper Pipe Coil 1/4 & 3/8', model: 'AUX-C38', qty: 2, unitPrice: '₱3,200.00' }
    ]
  }
];

// Combine sales forecasting
export const SALES_FORECAST_TOTAL: Record<number, number[]> = {
  2022: [60, 80, 70, 120, 95, 80, 90, 100, 85, 70, 55, 45],
  2023: [75, 95, 85, 140, 110, 95, 105, 115, 100, 85, 65, 50],
  2024: [90, 110, 100, 160, 125, 110, 120, 130, 115, 95, 75, 60],
  2025: [100, 120, 115, 180, 140, 120, 135, 145, 125, 105, 85, 68],
  2026: [110, 95, 150, 300, 105, 90, 120, 130, 105, 90, 75, 55],
  2027: [120, 130, 135, 210, 160, 140, 150, 165, 140, 120, 95, 78],
  2028: [130, 145, 150, 230, 175, 150, 165, 180, 150, 130, 105, 85],
  2029: [140, 160, 165, 250, 190, 165, 180, 195, 165, 140, 115, 92],
  2030: [150, 175, 180, 270, 205, 180, 195, 210, 180, 150, 125, 100]
};

// Aircon Units Specific Forecasting
export const SALES_FORECAST_UNITS: Record<number, number[]> = {
  2022: [25, 35, 30, 55, 40, 30, 35, 40, 35, 30, 20, 15],
  2023: [30, 40, 35, 65, 45, 35, 40, 45, 40, 35, 25, 20],
  2024: [35, 45, 40, 75, 50, 40, 45, 50, 45, 38, 28, 22],
  2025: [40, 50, 48, 85, 60, 50, 55, 60, 50, 42, 32, 25],
  2026: [45, 40, 65, 140, 42, 35, 50, 55, 42, 35, 28, 20],
  2027: [50, 55, 58, 95, 70, 60, 65, 70, 60, 50, 38, 30],
  2028: [55, 62, 65, 105, 78, 65, 72, 78, 65, 55, 42, 35],
  2029: [60, 70, 72, 115, 85, 72, 80, 85, 72, 60, 48, 38],
  2030: [65, 78, 80, 125, 92, 80, 88, 95, 80, 65, 52, 42]
};

// Spare Parts & Components Specific Forecasting
export const SALES_FORECAST_PARTS: Record<number, number[]> = {
  2022: [35, 45, 40, 65, 55, 50, 55, 60, 50, 40, 35, 30],
  2023: [45, 55, 50, 75, 65, 60, 65, 70, 60, 50, 40, 30],
  2024: [55, 65, 60, 85, 75, 70, 75, 80, 70, 57, 47, 38],
  2025: [60, 70, 67, 95, 80, 70, 80, 85, 75, 63, 53, 43],
  2026: [65, 55, 85, 160, 63, 55, 70, 75, 63, 55, 47, 35],
  2027: [70, 75, 77, 115, 90, 80, 85, 95, 80, 70, 57, 48],
  2028: [75, 83, 85, 125, 97, 85, 93, 102, 85, 75, 63, 50],
  2029: [80, 90, 93, 135, 105, 93, 100, 110, 93, 80, 67, 54],
  2030: [85, 97, 100, 145, 113, 100, 107, 115, 100, 85, 73, 58]
};

// Accessories Specific Forecasting
export const SALES_FORECAST_ACCESSORIES: Record<number, number[]> = {
  2022: [20, 25, 22, 35, 30, 25, 28, 32, 28, 22, 18, 15],
  2023: [25, 30, 28, 42, 35, 30, 32, 38, 32, 26, 22, 18],
  2024: [28, 35, 32, 48, 40, 35, 38, 42, 36, 30, 25, 20],
  2025: [32, 40, 38, 55, 45, 38, 42, 48, 40, 32, 28, 22],
  2026: [35, 30, 48, 90, 38, 32, 40, 45, 35, 30, 24, 18],
  2027: [38, 45, 42, 62, 50, 42, 46, 52, 44, 36, 30, 24],
  2028: [42, 50, 46, 68, 55, 46, 50, 58, 48, 40, 33, 26],
  2029: [45, 55, 50, 75, 60, 50, 55, 62, 52, 44, 36, 28],
  2030: [48, 60, 54, 82, 65, 54, 60, 68, 56, 48, 39, 30]
};

// Item-specific monthly sales forecast computer based on item ID and category weights
export function getItemMonthlyForecast(item: InventoryItem, year: number = 2026): number[] {
  let baseArray: number[] = [];
  if (item.category === 'Aircon Units') {
    baseArray = SALES_FORECAST_UNITS[year] || SALES_FORECAST_UNITS[2026];
  } else if (item.category === 'Accessories') {
    baseArray = SALES_FORECAST_ACCESSORIES[year] || SALES_FORECAST_ACCESSORIES[2026];
  } else {
    baseArray = SALES_FORECAST_PARTS[year] || SALES_FORECAST_PARTS[2026];
  }

  // Weight scale factor based on item ID so every item has distinct realistic values
  const factor = 0.2 + ((item.id * 17) % 11) * 0.08;
  return baseArray.map(val => Math.max(1, Math.round(val * factor)));
}

export const SALES_FORECAST_DATA = SALES_FORECAST_TOTAL;

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const STATUS_OPTIONS = ['All Status', 'Completed', 'In Progress', 'Scheduled', 'Cancelled'];
export const ITEM_OPTIONS = ['All Items', 'Aircon Units', 'Aircon Filter', 'Copper Pipe Coil', 'Compressor Unit', 'Condenser Fan', 'Remote Control', 'Control PCB'];
export const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Highest Cost', 'Lowest Cost'];
export const CATEGORY_OPTIONS = ['Installation', 'Maintenance', 'Repair', 'Replacement'];
