export type EntityType = "PF" | "PJ";

export interface Account {
  id: string;
  name: string;
  bank: string;
  balance: number;
  type: EntityType;
  logoUrl?: string;
  yieldRate?: number;
  lastYieldAt?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  used: number;
  dueDate: number; // day of month
  closingDay?: number;
  type: EntityType;
  logoUrl?: string;
}

export interface CardInvoice {
  id: string;
  cardId: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  totalAmount: number;
  userShare: number;
  thirdPartyShare: number;
  thirdPartyName?: string;
  status: 'paid' | 'open' | 'overdue' | 'planned' | 'empty';
  isCurrentMonth: boolean;
}

export interface CardExpense {
  id: string;
  cardId: string;
  invoiceId: string;
  expenseDate: string;
  category: string;
  description: string;
  merchantName?: string;
  city?: string;
  country?: string;
  amount: number;
  installments: number;
  currentInstallment: number;
  ownerType: 'user' | 'third_party';
  ownerName?: string;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  totalValue: number;
  remainingValue: number;
  installments?: {
    total: number;
    paid: number;
    value: number;
  };
  dueDate: number | string; // day of month or ISO date
  priority: "MAX" | "HIGH" | "MEDIUM" | "LOW";
  category: "PERSONAL" | "CARD" | "LOAN" | "SERASA" | "EDUCATION" | "FIXED_COST";
  type: EntityType;
  status: "PAID" | "PENDING" | "OVERDUE" | "NEGOTIATING";
}

export interface Investment {
  id: string;
  name: string;
  institution: string;
  value: number;
  type: EntityType;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: EntityType;
  flowType: 'INCOME' | 'EXPENSE';
}

export interface FinancialState {
  accounts: Account[];
  cards: CreditCard[];
  invoices: CardInvoice[];
  cardExpenses: CardExpense[];
  debts: Debt[];
  investments: Investment[];
  goals: Goal[];
  transactions: Transaction[];
  monthlyIncome: number;
}
