// ============================================================
// Retab — TypeScript interfaces matching the Supabase DB schema
// ============================================================

export type UserRole = 'owner' | 'manager' | 'staff';
export type Plan = 'free' | 'starter' | 'pro';
export type MessageType = 'bill' | 'review_request' | 'reply';
export type MessageChannel = 'whatsapp';
export type CreditTransactionType = 'purchase' | 'debit';

// ----------------------------------------------------------
// cafes
// ----------------------------------------------------------
export interface Cafe {
  id: string;
  name: string;
  owner_id: string;          // references auth.users.id
  whatsapp_phone_number_id: string | null;
  google_review_link: string | null;
  plan: Plan;
  credit_balance: number;
  cafe_code: string;
}

// ----------------------------------------------------------
// users  (staff / managers / owner profile rows)
// ----------------------------------------------------------
export interface User {
  id: string;                // references auth.users.id
  cafe_id: string;
  role: UserRole;
  email: string | null;
  pin_hash: string | null;   // bcrypt hash for staff PIN login
  name: string;
}

// ----------------------------------------------------------
// menu_items
// ----------------------------------------------------------
export interface MenuItem {
  id: string;
  cafe_id: string;
  name: string;
  category: string;
  price: number;             // stored in smallest currency unit (paise / cents)
}

// ----------------------------------------------------------
// customers
// ----------------------------------------------------------
export interface Customer {
  id: string;
  cafe_id: string;
  name: string;
  phone: string;             // E.164 format e.g. +919876543210
  first_visit: string;       // ISO timestamp
  last_visit: string;        // ISO timestamp — updated by trigger
  visit_count: number;       // incremented by trigger
  total_spend: number;       // incremented by trigger
}

// ----------------------------------------------------------
// orders
// ----------------------------------------------------------
export interface Order {
  id: string;
  cafe_id: string;
  customer_id: string | null; // FK → customers.id (resolved by trigger)
  customer_phone: string;      // used by trigger to upsert customer
  total_amount: number;
  created_at: string;          // ISO timestamp
}

// ----------------------------------------------------------
// order_items
// ----------------------------------------------------------
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
}

// ----------------------------------------------------------
// reviews
// ----------------------------------------------------------
export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  rating: number;             // 1–5
  feedback_text: string | null;
  is_private: boolean;        // true → internal only, false → redirected to Google
}

// ----------------------------------------------------------
// messages_log
// ----------------------------------------------------------
export interface MessageLog {
  id: string;
  cafe_id: string;
  customer_id: string;
  type: MessageType;
  channel: MessageChannel;
  cost: number;               // credit cost of this message
  sent_at: string;            // ISO timestamp
}

// ----------------------------------------------------------
// credit_transactions
// ----------------------------------------------------------
export interface CreditTransaction {
  id: string;
  cafe_id: string;
  amount: number;             // positive = purchase, negative = debit
  type: CreditTransactionType;
  created_at: string;         // ISO timestamp
}

// ----------------------------------------------------------
// Convenience: row with joined data (used in UI queries)
// ----------------------------------------------------------
export interface OrderWithItems extends Order {
  order_items: (OrderItem & { menu_item: MenuItem })[];
}

export interface ReviewWithCustomer extends Review {
  customer: Pick<Customer, 'id' | 'name' | 'phone'>;
}
