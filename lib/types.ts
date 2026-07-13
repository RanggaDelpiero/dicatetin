// ============================================
// Pundi — Core TypeScript Types
// ============================================

// ---- Wallet / Kantong ----
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'emergency' | 'investment' | 'credit_card' | 'other';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number; // integer (Rupiah, no decimal)
  color: string;   // hex color
  icon: string;    // icon name from Phosphor
  order: number;
  credit_limit?: number;
  credit_outstanding?: number;
  credit_statement_label?: string;
  credit_due_date?: string;
  credit_minimum_payment?: number;
  credit_auto_reset?: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Category ----
export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string | null; // null = preset, string = custom
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  order: number;
  isArchived?: boolean;
  isCustom?: boolean;
}

// ---- Transaction ----
export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionSource = 'manual' | 'photo' | 'voice';

export interface TransactionEditEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  editedAt: string;
}

export interface TransactionExtractionData {
  originalText?: string;
  originalImageUrl?: string;
  aiConfidence?: 'high' | 'medium' | 'low';
  extractedAt: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // integer (Rupiah)
  category_id: string;
  category?: Category;
  wallet_id: string;
  wallet?: Wallet;
  // For transfers
  target_wallet_id?: string;
  target_wallet?: Wallet;
  note?: string;
  receipt_url?: string;
  date: string; // ISO date
  created_at: string;
  updated_at: string;
  // Audit trail
  sourceType?: TransactionSource;
  editHistory?: TransactionEditEntry[];
  extractionData?: TransactionExtractionData;
  // CC tracking
  payment_kind?: 'normal' | 'credit_card_payment';
  credit_card_wallet_id?: string;
}

// ---- Debt (Hutang Saya) ----
export type DebtStatus = 'active' | 'paid_off';

export interface Debt {
  id: string;
  user_id: string;
  creditor: string; // siapa yang kasih hutang
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number; // percentage, optional
  due_date?: string;
  payment_schedule?: string; // description
  status: DebtStatus;
  note?: string;
  created_at: string;
  updated_at: string;
}

// ---- Receivable (Hutang Orang) ----
export type ReceivableStatus = 'unpaid' | 'partial' | 'paid';

export interface Receivable {
  id: string;
  user_id: string;
  debtor: string; // siapa yang berhutang
  total_amount: number;
  remaining_amount: number;
  status: ReceivableStatus;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ReceivablePayment {
  id: string;
  receivable_id: string;
  amount: number;
  date: string;
  note?: string;
}

// ---- Split Bill ----
export type SplitMethod = 'equal' | 'custom' | 'percentage' | 'per-item';
export type SplitParticipantStatus = 'unpaid' | 'paid';

export interface SplitBillItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  assignedTo: string[]; // participant names who ordered this item
}

export interface SplitBillSession {
  id: string;
  user_id: string;
  title: string;
  total_amount: number;
  method: SplitMethod;
  participants: SplitParticipant[];
  items: SplitBillItem[];      // list of items/menu in the bill
  paidBy: string;              // name of person who paid ("Saya" or participant name)
  tax?: number;
  service?: number;
  created_at: string;
}

export interface SplitParticipant {
  id: string;
  session_id: string;
  name: string;
  amount: number;
  status: SplitParticipantStatus;
  receivable_id?: string; // linked to Receivable
}

// ---- Gamification ----
export interface UserProgress {
  id: string;
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string; // ISO date (date only)
  badges: string[]; // badge IDs
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string; // description of unlock condition
  xp_reward: number;
}

// ---- AI Advisor ----
export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AdvisorConversation {
  id: string;
  user_id: string;
  messages: AdvisorMessage[];
  created_at: string;
  updated_at: string;
}

// ---- UI Helpers ----
export interface TabItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

// ---- Financial Summary (for dashboard & AI context) ----
export interface FinancialSummary {
  total_balance: number;
  total_income_month: number;
  total_expense_month: number;
  wallets: Pick<Wallet, 'id' | 'name' | 'balance' | 'type'>[];
  top_categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  trend: {
    month: string;
    income: number;
    expense: number;
  }[];
}
