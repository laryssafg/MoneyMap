import { FinancialState } from "../types";

export const INITIAL_DATA: FinancialState = {
  monthlyIncome: 2000, // Pró-labore
  accounts: [
    { id: "pf-inter", name: "Inter", bank: "Inter", balance: 0, type: "PF", logoUrl: "https://logo.clearbit.com/inter.co" },
    { id: "pf-bmg", name: "BMG", bank: "BMG", balance: 0, type: "PF", logoUrl: "https://logo.clearbit.com/bancobmg.com.br" },
    { id: "pf-neon", name: "Neon", bank: "Neon", balance: 0, type: "PF", logoUrl: "https://logo.clearbit.com/neon.com.br" },
    { id: "pf-bradesco", name: "Bradesco", bank: "Bradesco", balance: 0, type: "PF", logoUrl: "https://logo.clearbit.com/bradesco.com.br" },
    { id: "pf-nubank", name: "Nubank", bank: "Nubank", balance: 0, type: "PF", logoUrl: "https://logo.clearbit.com/nubank.com.br" },
    { id: "pj-inter", name: "Inter PJ", bank: "Inter", balance: 0, type: "PJ", logoUrl: "https://logo.clearbit.com/inter.co" },
    { id: "pj-nubank", name: "Nubank PJ", bank: "Nubank", balance: 0, type: "PJ", logoUrl: "https://logo.clearbit.com/nubank.com.br" },
    { id: "pj-mp", name: "Mercado Pago", bank: "Mercado Pago", balance: 0, type: "PJ", logoUrl: "https://logo.clearbit.com/mercadopago.com.br" },
    { id: "pf-99pay", name: "99Pay", bank: "99Pay", balance: 0, type: "PF", logoUrl: "https://i.imgur.com/vH9vH9v.png", yieldRate: 0.12375 }, // 110% of 11.25% CDI
  ],
  cards: [
    { id: "card-pf-inter", name: "Inter PF", bank: "Inter", limit: 3000, used: 0, dueDate: 7, type: "PF", logoUrl: "https://logo.clearbit.com/inter.co" },
    { id: "card-pj-inter", name: "Inter PJ", bank: "Inter", limit: 1000, used: 0, dueDate: 10, type: "PJ", logoUrl: "https://logo.clearbit.com/inter.co" },
  ],
  invoices: [],
  cardExpenses: [],
  debts: [
    // PF Pessoais
    { id: "debt-lucimar", name: "Lucimar", totalValue: 75, remainingValue: 75, dueDate: 7, priority: "MAX", category: "PERSONAL", type: "PF", status: "PENDING" },
    { id: "debt-stil", name: "Stil", totalValue: 162.5, remainingValue: 162.5, dueDate: 7, priority: "MAX", category: "PERSONAL", type: "PF", status: "PENDING" },
    { id: "debt-wallace", name: "Wallace", totalValue: 83, remainingValue: 83, dueDate: 7, priority: "MAX", category: "PERSONAL", type: "PF", status: "PENDING" },
    { id: "debt-diego-1", name: "Diego (Abril)", totalValue: 85, remainingValue: 85, dueDate: 7, priority: "MAX", category: "PERSONAL", type: "PF", status: "PENDING" },
    { id: "debt-diego-2", name: "Diego (Maio)", totalValue: 85, remainingValue: 85, dueDate: 7, priority: "MAX", category: "PERSONAL", type: "PF", status: "PENDING" },
    
    // PF Serasa
    { id: "debt-pan", name: "Banco Pan (Serasa)", totalValue: 659.08, remainingValue: 659.08, dueDate: 7, priority: "MEDIUM", category: "SERASA", type: "PF", status: "NEGOTIATING" },
    
    // PF Bradesco
    { id: "debt-brad-1", name: "Empréstimo Bradesco 550372647", totalValue: 639.68, remainingValue: 639.68, installments: { total: 8, paid: 0, value: 79.96 }, dueDate: 7, priority: "HIGH", category: "LOAN", type: "PF", status: "PENDING" },
    { id: "debt-brad-2", name: "Empréstimo Bradesco 552752610", totalValue: 274.7, remainingValue: 274.7, installments: { total: 5, paid: 0, value: 54.94 }, dueDate: 7, priority: "HIGH", category: "LOAN", type: "PF", status: "PENDING" },
    { id: "debt-brad-3", name: "Atraso Bradesco 553910508", totalValue: 49.91, remainingValue: 49.91, dueDate: 7, priority: "MAX", category: "LOAN", type: "PF", status: "OVERDUE" },
    
    // PF Inter
    { id: "debt-inter-cred", name: "Inter Crediário", totalValue: 2926.71, remainingValue: 2926.71, installments: { total: 9, paid: 0, value: 325.19 }, dueDate: 7, priority: "HIGH", category: "LOAN", type: "PF", status: "OVERDUE" },
    { id: "debt-inter-cons", name: "Inter Consignado", totalValue: 3299.04, remainingValue: 2474.28, installments: { total: 24, paid: 6, value: 137.46 }, dueDate: 7, priority: "HIGH", category: "LOAN", type: "PF", status: "OVERDUE" },
    
    // PF Shopee
    { id: "debt-shopee", name: "Shopee", totalValue: 568.89, remainingValue: 568.89, dueDate: 7, priority: "MEDIUM", category: "CARD", type: "PF", status: "NEGOTIATING" },
    
    // PF Faculdade
    { id: "debt-fmu-mensal", name: "Faculdade FMU (Mensal)", totalValue: 578.57, remainingValue: 578.57, dueDate: 7, priority: "HIGH", category: "EDUCATION", type: "PF", status: "OVERDUE" },
    { id: "debt-fmu-dp", name: "Faculdade FMU (DP)", totalValue: 1260, remainingValue: 630, installments: { total: 4, paid: 2, value: 315 }, dueDate: 7, priority: "HIGH", category: "EDUCATION", type: "PF", status: "OVERDUE" },

    // PJ Empréstimos
    { id: "debt-pj-emp1", name: "Empréstimo PJ 1", totalValue: 170, remainingValue: 170, dueDate: 10, priority: "HIGH", category: "LOAN", type: "PJ", status: "PENDING" },
    { id: "debt-pj-emp2", name: "Empréstimo PJ 2", totalValue: 310.1, remainingValue: 310.1, dueDate: 10, priority: "HIGH", category: "LOAN", type: "PJ", status: "PENDING" },

    // PJ Contas Fixas
    { id: "debt-pj-office", name: "Escritório", totalValue: 63, remainingValue: 63, dueDate: 10, priority: "MAX", category: "FIXED_COST", type: "PJ", status: "OVERDUE" },
    { id: "debt-pj-util", name: "Água e Luz", totalValue: 300, remainingValue: 300, dueDate: 10, priority: "HIGH", category: "FIXED_COST", type: "PJ", status: "PENDING" },
    { id: "debt-pj-acc", name: "Contador", totalValue: 225, remainingValue: 225, dueDate: 10, priority: "MAX", category: "FIXED_COST", type: "PJ", status: "OVERDUE" },
    { id: "debt-pj-mkt", name: "Marketing", totalValue: 900, remainingValue: 900, dueDate: 10, priority: "MEDIUM", category: "FIXED_COST", type: "PJ", status: "PENDING" },
  ],
  investments: [
    { id: "inv-toro", name: "Toro Investimentos", institution: "Toro", value: 0, type: "PF" },
  ],
  goals: [
    { id: "goal-reserva", name: "Reserva de Emergência", targetValue: 0, currentValue: 0 },
    { id: "goal-quit", name: "Quitar Dívidas", targetValue: 0, currentValue: 0 },
    { id: "goal-inv", name: "Investimentos", targetValue: 0, currentValue: 0 },
    { id: "goal-abroad", name: "Mudança de País", targetValue: 0, currentValue: 0 },
    { id: "goal-growth", name: "Crescimento da Empresa", targetValue: 0, currentValue: 0 },
  ],
  responsibleParties: [
    { id: "rp-user", name: "Eu" },
  ],
  transactions: [
    { id: "t1", description: "Pagamento Lucimar", amount: -75, date: "2026-04-01", category: "PERSONAL", type: "PF", flowType: "EXPENSE" },
    { id: "t2", description: "Escritório", amount: -63, date: "2026-04-02", category: "FIXED_COST", type: "PJ", flowType: "EXPENSE" },
  ],
};
