export interface Member {
  id: string;
  name: string;
  phone?: string;
  avatarColor?: string; // Tailwind class for avatar background (e.g., 'bg-rose-500')
}

export type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares';

// Representing an item consumed from the customizable/pre-created menu
export interface MenuItemInstance {
  id: string;
  name: string;
  price: number;
  quantity: number;
  consumers: string[]; // member IDs who consumed this item (cost is split equally among them)
}

// Representing an item added to the party bill, split by group or individual members
export interface PartyItemInstance {
  id: string;
  name: string;
  price: number;
  type: 'group' | 'individual'; // split equally among the group, or assigned to a specific member
  targetId?: string; // Member ID if 'individual'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string; // e.g., 'Food', 'Travel', 'Lodging', 'Entertainment', 'Utilities', 'Other'
  note?: string;
  billImage?: string; // Optional attached bill/receipt image (base64 or URL)
  
  // To handle multiple payers elegantly:
  // Key: Member ID, Value: Amount they paid (sums to total amount)
  payers: { [memberId: string]: number };
  
  splitType: SplitType;
  // Depending on splitType:
  // - 'equal': list of member IDs who participate (value is ignored or can be 1)
  // - 'unequal': Key: Member ID, Value: Exact split amount
  // - 'percentage': Key: Member ID, Value: Split percentage (sums to 100)
  // - 'shares': Key: Member ID, Value: Split shares (e.g., 2 shares, 1 share)
  splits: { [memberId: string]: number };

  // New billing properties
  billType?: 'daily' | 'party'; // Optional, default is general/equal if not specified
  menuItems?: MenuItemInstance[];
  partyItems?: PartyItemInstance[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  members: Member[];
  expenses: Expense[];
  customMenu?: MenuItem[]; // Customizable menu items for this group
}

export interface DebtTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  paidAmount: number;   // Total paid by member
  owedAmount: number;   // Total owed by member
  netBalance: number;   // net = paidAmount - owedAmount
}

export const CATEGORIES = [
  'Food',
  'Travel',
  'Lodging',
  'Entertainment',
  'Utilities',
  'Other'
];

export const AVATAR_COLORS = [
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-indigo-500 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
  'bg-teal-500 text-white',
  'bg-violet-500 text-white',
  'bg-pink-500 text-white',
  'bg-sky-500 text-white',
];
