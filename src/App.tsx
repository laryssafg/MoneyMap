import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  User, 
  Building2, 
  Wallet, 
  ArrowLeftRight, 
  CreditCard as CreditCardIcon, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  CalendarDays, 
  FileText, 
  Settings,
  Menu,
  X,
  ChevronRight,
  TrendingDown,
  DollarSign,
  PieChart,
  Search,
  Plus,
  ArrowLeft,
  Download,
  CheckCircle2,
  PlusCircle,
  Edit2,
  CreditCard,
  ShoppingBag,
  Coffee,
  Utensils,
  Car,
  Home,
  Tv,
  Smartphone,
  Gift,
  MoreHorizontal,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_DATA } from './data/initialData';
import { cn, formatCurrency } from './lib/utils';
import { supabase } from './lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

type View = 
  | 'dashboard' 
  | 'consolidated' 
  | 'pf' 
  | 'pj' 
  | 'accounts' 
  | 'transactions' 
  | 'cards' 
  | 'debts' 
  | 'investments' 
  | 'emergency' 
  | 'goals' 
  | 'planning' 
  | 'reports' 
  | 'settings'
  | 'map'
  | 'card-details';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState(INITIAL_DATA);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigateToTransactions = (filter: string = '') => {
    setTransactionFilter(filter);
    setCurrentView('transactions');
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setCurrentView('card-details');
  };

  // Fetch data from Supabase on mount
  useEffect(() => {
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && 
                        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_url' &&
                        import.meta.env.VITE_SUPABASE_ANON_KEY &&
                        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';
    
    setIsSupabaseConfigured(!!isConfigured);

    async function fetchData() {
      try {
        const [
          { data: accounts },
          { data: cards },
          { data: debts },
          { data: investments },
          { data: goals },
          { data: transactions },
          { data: profile },
          { data: invoices },
          { data: cardExpenses }
        ] = await Promise.all([
          supabase.from('accounts').select('*'),
          supabase.from('cards').select('*'),
          supabase.from('debts').select('*'),
          supabase.from('investments').select('*'),
          supabase.from('goals').select('*'),
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('profile').select('*').single(),
          supabase.from('card_invoices').select('*').order('due_date', { ascending: true }),
          supabase.from('card_expenses').select('*').order('expense_date', { ascending: false })
        ]);

        if (accounts && accounts.length > 0) {
          setData(prev => ({
            ...prev,
            accounts: accounts.map(a => ({ ...a, balance: Number(a.balance), logoUrl: a.logo_url })),
            cards: cards?.map(c => ({ 
              ...c, 
              limit: Number(c.limit_value), 
              used: Number(c.used),
              dueDate: c.due_date,
              closingDay: c.closing_day,
              logoUrl: c.logo_url
            })) || [],
            invoices: invoices?.map(inv => ({
              ...inv,
              totalAmount: Number(inv.total_amount),
              userShare: Number(inv.user_share),
              thirdPartyShare: Number(inv.third_party_share),
              referenceMonth: inv.reference_month,
              referenceYear: inv.reference_year,
              isCurrentMonth: inv.is_current_month,
              cardId: inv.card_id,
              thirdPartyName: inv.third_party_name
            })) || [],
            cardExpenses: cardExpenses?.map(exp => ({
              ...exp,
              amount: Number(exp.amount),
              expenseDate: exp.expense_date,
              merchantName: exp.merchant_name,
              currentInstallment: exp.current_installment,
              ownerType: exp.owner_type,
              ownerName: exp.owner_name,
              cardId: exp.card_id,
              invoiceId: exp.invoice_id
            })) || [],
            debts: debts?.map(d => ({ 
              ...d, 
              totalValue: Number(d.total_value), 
              remainingValue: Number(d.remaining_value),
              dueDate: d.due_date,
              installments: d.installments_total ? {
                total: d.installments_total,
                paid: d.installments_paid,
                value: Number(d.installments_value)
              } : undefined
            })) || [],
            investments: investments?.map(i => ({ ...i, value: Number(i.value) })) || [],
            goals: goals?.map(g => ({ ...g, targetValue: Number(g.target_value), currentValue: Number(g.current_value) })) || [],
            transactions: transactions?.map(t => ({ ...t, amount: Number(t.amount) })) || [],
            monthlyIncome: profile ? Number(profile.monthly_income) : prev.monthlyIncome
          }));
        }
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSaveTransaction = async (transaction: any) => {
    const installments = transaction.installments || 1;
    const installmentAmount = transaction.amount / installments;
    
    const transactionsToSave: any[] = [];
    
    if (transaction.category === 'CREDIT_CARD' && transaction.type === 'PF') {
      const purchaseDate = new Date(transaction.date + 'T12:00:00');
      const year = purchaseDate.getFullYear();
      const month = purchaseDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const penultimateDay = lastDay - 1;
      const day = purchaseDate.getDate();
      
      const startMonthOffset = (day <= penultimateDay) ? 1 : 2;
      
      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(year, month + startMonthOffset + i, 7);
        transactionsToSave.push({
          ...transaction,
          id: i === 0 ? transaction.id : Math.random().toString(36).substr(2, 9),
          description: installments > 1 ? `${transaction.description} (${i + 1}/${installments})` : transaction.description,
          amount: installmentAmount,
          date: dueDate.toISOString().split('T')[0],
        });
      }
    } else if (installments > 1) {
      const purchaseDate = new Date(transaction.date + 'T12:00:00');
      for (let i = 0; i < installments; i++) {
        const date = new Date(purchaseDate);
        date.setMonth(date.getMonth() + i);
        transactionsToSave.push({
          ...transaction,
          id: i === 0 ? transaction.id : Math.random().toString(36).substr(2, 9),
          description: `${transaction.description} (${i + 1}/${installments})`,
          amount: installmentAmount,
          date: date.toISOString().split('T')[0],
        });
      }
    } else {
      transactionsToSave.push(transaction);
    }

    // Optimistic update
    setData(prev => {
      let newCards = [...prev.cards];
      let newInvoices = [...prev.invoices];
      let newCardExpenses = [...prev.cardExpenses];
      
      if (transaction.category === 'CREDIT_CARD') {
        const card = prev.cards.find(c => c.type === transaction.type);
        if (card) {
          const totalAmount = Math.abs(transaction.amount);
          newCards = prev.cards.map(c => {
            if (c.id === card.id) {
              return { ...c, used: transaction.flowType === 'EXPENSE' ? c.used + totalAmount : Math.max(0, c.used - totalAmount) };
            }
            return c;
          });
          
          transactionsToSave.forEach(t => {
            const tDate = new Date(t.date + 'T12:00:00');
            const refMonth = tDate.getMonth() + 1;
            const refYear = tDate.getFullYear();
            
            const invoice = newInvoices.find(inv => 
              inv.cardId === card.id && 
              inv.referenceMonth === refMonth && 
              inv.referenceYear === refYear
            );
            
            if (invoice) {
              newInvoices = newInvoices.map(inv => inv.id === invoice.id ? {
                ...inv,
                totalAmount: inv.totalAmount + Math.abs(t.amount)
              } : inv);
              
              newCardExpenses.push({
                id: Math.random().toString(36).substr(2, 9),
                invoiceId: invoice.id,
                description: t.description,
                amount: Math.abs(t.amount),
                expenseDate: transaction.date,
                category: 'OTHER',
                ownerType: 'user'
              });
            }
          });
        }
      }

      return {
        ...prev,
        cards: newCards,
        invoices: newInvoices,
        cardExpenses: newCardExpenses,
        transactions: [...transactionsToSave, ...prev.transactions]
      };
    });

    try {
      const { data: savedTransactions, error: tError } = await supabase.from('transactions').insert(transactionsToSave.map(t => ({
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category,
        type: t.type,
        flow_type: t.flowType
      }))).select();
      
      if (tError) throw tError;

      if (savedTransactions) {
        setData(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => {
            const saved = savedTransactions.find(st => 
              st.description === t.description && 
              st.amount === t.amount && 
              st.date === t.date
            );
            return saved ? { ...t, id: saved.id } : t;
          })
        }));
      }

      if (transaction.category === 'CREDIT_CARD') {
        const card = data.cards.find(c => c.type === transaction.type);
        if (card) {
          const totalAmount = Math.abs(transaction.amount);
          const newUsed = transaction.flowType === 'EXPENSE' ? card.used + totalAmount : Math.max(0, card.used - totalAmount);
          await supabase.from('cards').update({ used: newUsed }).eq('id', card.id);
          
          for (const t of transactionsToSave) {
            const tDate = new Date(t.date + 'T12:00:00');
            const refMonth = tDate.getMonth() + 1;
            const refYear = tDate.getFullYear();
            
            const invoice = data.invoices.find(inv => 
              inv.cardId === card.id && 
              inv.referenceMonth === refMonth && 
              inv.referenceYear === refYear
            );
            
            let invoiceId = invoice?.id;
            
            if (!invoiceId) {
              const { data: newInvoice, error: invError } = await supabase.from('card_invoices').insert([{
                card_id: card.id,
                reference_month: refMonth,
                reference_year: refYear,
                due_date: t.date,
                total_amount: Math.abs(t.amount),
                user_share: Math.abs(t.amount),
                third_party_share: 0,
                status: 'open',
                is_current_month: false
              }]).select().single();
              
              if (!invError && newInvoice) {
                invoiceId = newInvoice.id;
              }
            } else {
              await supabase.from('card_invoices')
                .update({ total_amount: (invoice?.totalAmount || 0) + Math.abs(t.amount) })
                .eq('id', invoiceId);
            }
            
            if (invoiceId) {
              await supabase.from('card_expenses').insert([{
                invoice_id: invoiceId,
                description: t.description,
                amount: Math.abs(t.amount),
                expense_date: transaction.date,
                category: 'OTHER',
                owner_type: 'user'
              }]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing transaction with Supabase:', error);
    }
  };

  const handleTransfer = async (fromId: string, toId: string, amount: number) => {
    // Optimistic update
    setData(prev => {
      const newAccounts = prev.accounts.map(acc => {
        if (acc.id === fromId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toId) return { ...acc, balance: acc.balance + amount };
        return acc;
      });

      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        description: `Transferência entre contas`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        category: 'TRANSFER',
        type: prev.accounts.find(a => a.id === fromId)?.type || 'PF',
        flowType: 'EXPENSE' as const
      };

      return {
        ...prev,
        accounts: newAccounts,
        transactions: [newTransaction, ...prev.transactions]
      };
    });

    // Sync with Supabase
    try {
      const fromAcc = data.accounts.find(a => a.id === fromId);
      const toAcc = data.accounts.find(a => a.id === toId);

      if (fromAcc && toAcc) {
        await Promise.all([
          supabase.from('accounts').update({ balance: fromAcc.balance - amount }).eq('id', fromId),
          supabase.from('accounts').update({ balance: toAcc.balance + amount }).eq('id', toId),
          supabase.from('transactions').insert([{
            description: `Transferência entre contas`,
            amount: -amount,
            date: new Date().toISOString().split('T')[0],
            category: 'TRANSFER',
            type: fromAcc.type,
            flow_type: 'EXPENSE'
          }])
        ]);
      }
    } catch (error) {
      console.error('Error syncing transfer with Supabase:', error);
    }
  };

  const handleSaveAccount = async (account: any) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      accounts: [...prev.accounts, account]
    }));

    try {
      const { data: newAccount, error } = await supabase.from('accounts').insert([{
        name: account.name,
        bank: account.bank,
        balance: account.balance,
        type: account.type,
        logo_url: account.logoUrl
      }]).select().single();
      
      if (error) throw error;

      if (newAccount) {
        setData(prev => ({
          ...prev,
          accounts: prev.accounts.map(a => a.id === account.id ? { ...a, id: newAccount.id } : a)
        }));
      }
    } catch (error) {
      console.error('Error syncing account with Supabase:', error);
      // Revert optimistic update if needed, but for now just log
    }
  };

  const handleSaveDebt = async (debt: any) => {
    setData(prev => ({
      ...prev,
      debts: [...prev.debts, debt]
    }));

    try {
      const { data: newDebt, error } = await supabase.from('debts').insert([{
        name: debt.name,
        total_value: debt.totalValue,
        remaining_value: debt.remainingValue,
        due_date: debt.dueDate,
        priority: debt.priority,
        category: debt.category,
        type: debt.type,
        status: debt.status,
        installments_total: debt.installments?.total,
        installments_paid: debt.installments?.paid,
        installments_value: debt.installments?.value
      }]).select().single();
      
      if (error) throw error;

      if (newDebt) {
        setData(prev => ({
          ...prev,
          debts: prev.debts.map(d => d.id === debt.id ? { ...d, id: newDebt.id } : d)
        }));
      }
    } catch (error) {
      console.error('Error syncing debt with Supabase:', error);
    }
  };

  const handleSaveGoal = async (goal: any) => {
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, goal]
    }));

    try {
      const { data: newGoal, error } = await supabase.from('goals').insert([{
        name: goal.name,
        target_value: goal.targetValue,
        current_value: goal.currentValue,
        deadline: goal.deadline
      }]).select().single();
      
      if (error) throw error;

      if (newGoal) {
        setData(prev => ({
          ...prev,
          goals: prev.goals.map(g => g.id === goal.id ? { ...g, id: newGoal.id } : g)
        }));
      }
    } catch (error) {
      console.error('Error syncing goal with Supabase:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));

    try {
      await supabase.from('goals').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting goal from Supabase:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Mapa Financeiro', icon: PieChart },
    { id: 'consolidated', label: 'Visão Consolidada', icon: BarChart3 },
    { id: 'pf', label: 'Pessoa Física (PF)', icon: User },
    { id: 'pj', label: 'Pessoa Jurídica (PJ)', icon: Building2 },
    { id: 'accounts', label: 'Contas', icon: Wallet },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'cards', label: 'Cartões', icon: CreditCardIcon },
    { id: 'debts', label: 'Dívidas e Obrigações', icon: AlertCircle },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'emergency', label: 'Reserva de Emergência', icon: ShieldCheck },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'planning', label: 'Planejamento Mensal', icon: CalendarDays },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const totals = useMemo(() => {
    const pfBalance = data.accounts.filter(a => a.type === 'PF').reduce((acc, a) => acc + a.balance, 0);
    const pjBalance = data.accounts.filter(a => a.type === 'PJ').reduce((acc, a) => acc + a.balance, 0);
    const totalDebts = data.debts.reduce((acc, d) => acc + d.remainingValue, 0);
    const totalInvestments = data.investments.reduce((acc, i) => acc + i.value, 0);
    const netWorth = (pfBalance + pjBalance + totalInvestments) - totalDebts;
    
    const overdueDebts = data.debts.filter(d => d.status === 'OVERDUE').length;
    const criticalAlerts = overdueDebts > 0;

    return { pfBalance, pjBalance, totalDebts, totalInvestments, netWorth, overdueDebts, criticalAlerts };
  }, [data]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard totals={totals} data={data} theme={theme} />;
      case 'pf':
        return <EntityView type="PF" data={data} onViewTransactions={navigateToTransactions} onNavigate={setCurrentView} onCardClick={handleCardClick} />;
      case 'pj':
        return <EntityView type="PJ" data={data} onViewTransactions={navigateToTransactions} onNavigate={setCurrentView} onCardClick={handleCardClick} />;
      case 'accounts':
        return (
          <AccountsView 
            data={data} 
            onViewTransactions={() => navigateToTransactions()}
            onTransfer={(accountId) => {
              setSelectedAccountId(accountId);
              setIsTransferModalOpen(true);
            }}
            onAdd={() => setIsAccountModalOpen(true)}
          />
        );
      case 'debts':
        return (
          <DebtsView 
            data={data} 
            onAdd={() => setIsDebtModalOpen(true)} 
            onSimulate={() => setIsImpactModalOpen(true)}
          />
        );
      case 'cards':
        return <CardsView data={data} onViewTransactions={(filter) => navigateToTransactions(filter)} onCardClick={handleCardClick} />;
      case 'goals':
        return <GoalsView data={data} onAdd={() => setIsGoalModalOpen(true)} onDelete={handleDeleteGoal} />;
      case 'card-details':
        return (
          <CardDetailsView 
            cardId={selectedCardId!} 
            data={data} 
            onBack={() => setCurrentView('cards')} 
          />
        );
      case 'transactions':
        return (
          <TransactionsView 
            data={data} 
            initialFilter={transactionFilter}
            onDelete={async (id) => {
              // Optimistic update
              setData(prev => ({
                ...prev,
                transactions: prev.transactions.filter(t => t.id !== id)
              }));

              // Sync with Supabase
              try {
                await supabase.from('transactions').delete().eq('id', id);
              } catch (error) {
                console.error('Error deleting transaction from Supabase:', error);
              }
            }} 
            onAdd={() => setIsTransactionModalOpen(true)}
          />
        );
      case 'map':
        return <FinancialMap data={data} totals={totals} theme={theme} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-brand-text-muted">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Módulo em desenvolvimento</p>
            <p className="text-sm">A visualização "{menuItems.find(m => m.id === currentView)?.label}" estará disponível em breve.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Supabase Warning */}
      {!isSupabaseConfigured && (
        <div className="fixed top-4 right-4 z-[100] max-w-md bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-2xl flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-red-500 rounded-xl text-white">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-red-400 text-sm">Supabase não configurado</h4>
            <p className="text-xs text-red-400/80 mt-1">
              Para salvar dados permanentemente, configure as variáveis de ambiente <code className="bg-red-500/20 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-red-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> no menu Settings.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-brand-card border-r border-brand-border flex flex-col z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <img 
                src="https://i.imgur.com/5z0TWQP.png" 
                alt="MoneyMap Logo" 
                className="w-8 h-8 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-lg tracking-tight">MoneyMap</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-brand-hover rounded-lg transition-colors text-brand-text-muted"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'transactions') setTransactionFilter('');
                setCurrentView(item.id as View);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1 group",
                currentView === item.id 
                  ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                  : "text-brand-text-muted hover:bg-brand-hover hover:text-brand-text"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                currentView === item.id ? "text-white" : "group-hover:text-white"
              )} />
              {isSidebarOpen && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-brand-border">
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-brand-text-muted hover:bg-brand-hover hover:text-brand-text",
              !isSidebarOpen && "justify-center"
            )}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="shrink-0 group-hover:text-white" />
            ) : (
              <Sun size={20} className="shrink-0 group-hover:text-white" />
            )}
            {isSidebarOpen && (
              <span className="font-medium text-sm truncate">
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            )}
          </button>
        </div>

        <div className="p-4 border-t border-brand-border">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-brand-hover",
            !isSidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-accent to-purple-400 shrink-0" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Laryssa Ferreira</p>
                <p className="text-[10px] text-brand-text-muted truncate">Admin Premium</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-8 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-lg font-semibold">
            {menuItems.find(m => m.id === currentView)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-hover rounded-full border border-brand-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-brand-text-muted">Sistema Online</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={data.accounts}
        onTransfer={handleTransfer}
      />

      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSave={handleSaveAccount} 
      />

      <DebtModal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        onSave={handleSaveDebt} 
      />

      <GoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onSave={handleSaveGoal} 
      />

      <ImpactSimulationModal 
        isOpen={isImpactModalOpen} 
        onClose={() => setIsImpactModalOpen(false)} 
        data={data} 
      />
    </div>
  );
}

function BankLogo({ url, name, className }: { url?: string, name: string, className?: string }) {
  const [error, setError] = React.useState(false);

  if (!url || error) {
    return (
      <div className={cn("rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold", className)}>
        {name[0]}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={name} 
      className={cn("rounded-xl object-contain bg-white p-1", className)}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}

function Dashboard({ totals, data, theme }: { totals: any, data: any, theme: 'light' | 'dark' }) {
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const last4Months = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last4Months.push({
        name: months[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        pf: 0,
        pj: 0
      });
    }

    data.transactions.forEach((t: any) => {
      const tDate = new Date(t.date + 'T12:00:00');
      const m = tDate.getMonth();
      const y = tDate.getFullYear();
      
      const monthData = last4Months.find(d => d.month === m && d.year === y);
      if (monthData) {
        if (t.type === 'PF') monthData.pf += t.amount;
        else monthData.pj += t.amount;
      }
    });

    return last4Months;
  }, [data.transactions]);

  const pressure = useMemo(() => {
    const monthlyVenc = data.debts.reduce((acc: number, d: any) => acc + (d.installments?.value || d.remainingValue), 0);
    const capacity = 2000; // Pró-labore
    const ratio = monthlyVenc / capacity;
    let level = 'saudável';
    let color = 'text-green-500';
    let bg = 'bg-green-500/10';

    if (ratio > 0.8) {
      level = 'crítico';
      color = 'text-red-500';
      bg = 'bg-red-500/10';
    } else if (ratio > 0.5) {
      level = 'atenção';
      color = 'text-yellow-500';
      bg = 'bg-yellow-500/10';
    }

    return { monthlyVenc, capacity, ratio, level, color, bg };
  }, [data]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Saldo Total PF" value={totals.pfBalance} icon={User} color="text-blue-400" />
        <StatCard title="Saldo Total PJ" value={totals.pjBalance} icon={Building2} color="text-purple-400" />
        <StatCard title="Dívidas Totais" value={totals.totalDebts} icon={AlertCircle} color="text-red-400" />
        <StatCard title="Patrimônio Líquido" value={totals.netWorth} icon={TrendingUp} color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-brand-card rounded-3xl p-8 border border-brand-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Fluxo de Caixa</h3>
              <p className="text-sm text-brand-text-muted">Evolução mensal PF vs PJ</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-xs text-brand-text-muted">PF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-accent" />
                <span className="text-xs text-brand-text-muted">PJ</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a2695" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8a2695" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#9ca3af' : '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1a1f3d' : '#ffffff', 
                    border: theme === 'dark' ? 'none' : '1px solid rgba(0,0,0,0.05)', 
                    borderRadius: '12px', 
                    color: theme === 'dark' ? '#fff' : '#0f172a' 
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}
                />
                <Area type="monotone" dataKey="pf" stroke="#60a5fa" fillOpacity={1} fill="url(#colorPf)" strokeWidth={3} />
                <Area type="monotone" dataKey="pj" stroke="#8a2695" fillOpacity={1} fill="url(#colorPj)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Pressure */}
        <div className="bg-brand-card rounded-3xl p-8 border border-brand-border flex flex-col">
          <h3 className="text-lg font-bold mb-2">Pressão Financeira</h3>
          <p className="text-sm text-brand-text-muted mb-8">Capacidade de pagamento vs Obrigações</p>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-brand-border"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * Math.min(pressure.ratio, 1))}
                  strokeLinecap="round"
                  className={pressure.color}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{(pressure.ratio * 100).toFixed(0)}%</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", pressure.color)}>
                  {pressure.level}
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-brand-hover">
                <span className="text-xs text-brand-text-muted">Vence no mês</span>
                <span className="text-sm font-bold">{formatCurrency(pressure.monthlyVenc)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-brand-hover">
                <span className="text-xs text-brand-text-muted">Pode pagar</span>
                <span className="text-sm font-bold">{formatCurrency(pressure.capacity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-card rounded-3xl p-8 border border-brand-border">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-400" size={20} />
            Alertas Críticos
          </h3>
          <div className="space-y-4">
            {data.debts.filter(d => d.status === 'OVERDUE').slice(0, 4).map(debt => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{debt.name}</p>
                    <p className="text-[10px] text-red-400/70 uppercase font-bold tracking-wider">Atrasado</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{formatCurrency(debt.remainingValue)}</p>
                  <p className="text-[10px] text-brand-text-muted">Vencimento: Dia {String(debt.dueDate || '').padStart(2, '0')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-card rounded-3xl p-8 border border-brand-border">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="text-blue-400" size={20} />
            Próximos Vencimentos
          </h3>
          <div className="space-y-4">
            {data.debts.filter(d => d.status === 'PENDING').sort((a, b) => Number(a.dueDate) - Number(b.dueDate)).slice(0, 4).map(debt => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-2xl bg-brand-hover border border-brand-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{debt.name}</p>
                    <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">{debt.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(debt.installments?.value || debt.remainingValue)}</p>
                  <p className="text-[10px] text-brand-text-muted">Vence dia {String(debt.dueDate || '').padStart(2, '0')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-brand-card rounded-3xl p-6 border border-brand-border hover:border-brand-accent/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl bg-brand-hover group-hover:scale-110 transition-transform", color)}>
          <Icon size={24} />
        </div>
        <ChevronRight size={16} className="text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-brand-text-muted mb-1">{title}</p>
      <h4 className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</h4>
    </div>
  );
}

function DebtsView({ data, onAdd, onSimulate }: { data: any, onAdd: () => void, onSimulate: () => void }) {
  const categories = [
    { id: 'PERSONAL', label: 'Dívida Pessoal', color: 'bg-red-500' },
    { id: 'CARD', label: 'Cartão de Crédito', color: 'bg-orange-500' },
    { id: 'LOAN', label: 'Empréstimos', color: 'bg-blue-500' },
    { id: 'SERASA', label: 'Serasa', color: 'bg-purple-500' },
    { id: 'EDUCATION', label: 'Faculdade', color: 'bg-green-500' },
    { id: 'FIXED_COST', label: 'Contas Fixas', color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dívidas e Obrigações</h2>
          <p className="text-brand-text-muted">Controle total de passivos e priorização</p>
        </div>
        <button 
          onClick={onAdd}
          className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all"
        >
          Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          {categories.map(cat => {
            const catDebts = data.debts.filter((d: any) => d.category === cat.id);
            if (catDebts.length === 0) return null;

            return (
              <div key={cat.id} className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-hover/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-6 rounded-full", cat.color)} />
                    <h3 className="font-bold">{cat.label}</h3>
                  </div>
                  <span className="text-xs font-bold text-brand-text-muted">
                    {catDebts.length} itens • {formatCurrency(catDebts.reduce((acc: number, d: any) => acc + d.remainingValue, 0))}
                  </span>
                </div>
                <div className="divide-y divide-brand-border">
                  {catDebts.map((debt: any) => (
                    <div key={debt.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          debt.status === 'OVERDUE' ? "bg-red-500/10 text-red-500" : "bg-white/5 text-brand-text-muted"
                        )}>
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <p className="font-bold">{debt.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                              debt.priority === 'MAX' ? "bg-red-500/20 text-red-500" : "bg-white/10 text-brand-text-muted"
                            )}>
                              Prioridade {debt.priority}
                            </span>
                            <span className="text-[10px] text-brand-text-muted uppercase font-bold">
                              {debt.type} • Vence dia {String(debt.dueDate || '').padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(debt.remainingValue)}</p>
                        {debt.installments && (
                          <p className="text-xs text-brand-text-muted">
                            {debt.installments.paid}/{debt.installments.total} parcelas de {formatCurrency(debt.installments.value)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="bg-brand-card rounded-3xl p-6 border border-brand-border">
            <h3 className="font-bold mb-4">Prioridade de Pagamento</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  <span className="text-brand-text font-bold">Dívidas Pessoais:</span> Lucimar, Stil, Wallace, Diego. Prioridade máxima para manter relacionamentos.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  <span className="text-brand-text font-bold">Cartões de Crédito:</span> Evitar juros rotativos abusivos.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  <span className="text-brand-text font-bold">Juros Altos:</span> Bradesco e Inter Crediário.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-accent to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-accent/20">
            <h3 className="font-bold mb-2">Sugestão de Quitação</h3>
            <p className="text-xs text-white/80 mb-6 leading-relaxed">
              Com base no seu fluxo atual, sugerimos focar R$ 500,00 extras este mês nas dívidas pessoais.
            </p>
            <button 
              onClick={onSimulate}
              className="w-full py-3 bg-white text-brand-accent rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
            >
              Simular Impacto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsView({ data, onViewTransactions, onCardClick }: { data: any, onViewTransactions: (filter: string) => void, onCardClick: (cardId: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cartões de Crédito</h2>
          <p className="text-brand-text-muted">Gestão de limites e faturas PF/PJ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {data.cards.map((card: any) => (
          <div 
            key={card.id} 
            onClick={() => onCardClick(card.id)}
            className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden cursor-pointer hover:border-brand-accent/30 transition-all group"
          >
            <div className="p-8 bg-gradient-to-br from-white/[0.05] to-transparent">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-3">
                  <BankLogo url={card.logoUrl} name={card.bank} className="w-12 h-12 p-1.5" />
                  <div>
                    <h3 className="font-bold text-xl">{card.name}</h3>
                    <p className="text-xs text-brand-text-muted uppercase font-bold tracking-widest">{card.bank}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  card.type === 'PF' ? "border-blue-500/30 text-blue-400" : "border-purple-500/30 text-purple-400"
                )}>
                  {card.type}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-brand-text-muted">Limite Utilizado</span>
                    <span className="font-bold">{((card.used / card.limit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(card.used / card.limit) * 100}%` }}
                      className={cn(
                        "h-full rounded-full",
                        (card.used / card.limit) > 0.8 ? "bg-red-500" : "bg-brand-accent"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-brand-text-muted mb-1">Fatura Atual</p>
                    <p className="text-2xl font-bold">{formatCurrency(card.used)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-text-muted mb-1">Limite Disponível</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(card.limit - card.used)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-brand-border bg-brand-hover/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-brand-text-muted" />
                <span className="text-sm text-brand-text-muted">Vencimento: Dia {String(card.dueDate || '').padStart(2, '0')}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTransactions('Cartão de Crédito');
                }}
                className="text-sm font-bold text-brand-accent hover:underline"
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardDetailsView({ cardId, data, onBack }: { cardId: string, data: any, onBack: () => void }) {
  const card = data.cards.find((c: any) => c.id === cardId);
  const cardInvoices = data.invoices.filter((inv: any) => inv.cardId === cardId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    cardInvoices.find((inv: any) => inv.isCurrentMonth)?.id || cardInvoices[0]?.id || null
  );

  const selectedInvoice = cardInvoices.find((inv: any) => inv.id === selectedInvoiceId);
  const invoiceExpenses = data.cardExpenses.filter((exp: any) => exp.invoiceId === selectedInvoiceId);

  const [expenseFilter, setExpenseFilter] = useState<'all' | 'user' | 'third_party'>('all');

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'all') return invoiceExpenses;
    return invoiceExpenses.filter((exp: any) => exp.ownerType === expenseFilter);
  }, [invoiceExpenses, expenseFilter]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredExpenses.forEach((exp: any) => {
      const date = exp.expenseDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(exp);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return cardInvoices.map((inv: any) => ({
      id: inv.id,
      name: `${months[inv.referenceMonth - 1]}/${inv.referenceYear.toString().slice(-2)}`,
      value: inv.totalAmount,
      status: inv.status
    }));
  }, [cardInvoices]);

  if (!card) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e'; // green
      case 'open': return '#f97316'; // orange
      case 'overdue': return '#ef4444'; // red
      case 'planned': return '#3b82f6'; // blue
      default: return '#64748b'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paga';
      case 'open': return 'Aberta';
      case 'overdue': return 'Atrasada';
      case 'planned': return 'Planejada';
      case 'empty': return 'Vazia';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case 'SHOPPING': return ShoppingBag;
      case 'FOOD': return Utensils;
      case 'COFFEE': return Coffee;
      case 'TRANSPORT': return Car;
      case 'HOME': return Home;
      case 'ENTERTAINMENT': return Tv;
      case 'TECH': return Smartphone;
      case 'GIFT': return Gift;
      default: return CreditCard;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <BankLogo url={card.logoUrl} name={card.bank} className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold">{card.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    card.type === 'PF' ? "border-blue-500/30 text-blue-400" : "border-purple-500/30 text-purple-400"
                  )}>
                    {card.type}
                  </span>
                  <span className="text-xs text-brand-text-muted">{card.bank}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-brand-text-muted">
            <Download size={20} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-brand-text-muted">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Limits Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card rounded-3xl p-6 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Limite Total</p>
          <p className="text-2xl font-bold">{formatCurrency(card.limit)}</p>
        </div>
        <div className="bg-brand-card rounded-3xl p-6 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Limite Disponível</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(card.limit - card.used)}</p>
        </div>
        <div className="bg-brand-card rounded-3xl p-6 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Dia do Vencimento</p>
          <p className="text-2xl font-bold">{String(card.dueDate || '').padStart(2, '0')}</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
        <h3 className="font-bold mb-8">Histórico de Faturas</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-brand-bg border border-white/10 p-3 rounded-xl shadow-2xl">
                        <p className="text-xs text-brand-text-muted mb-1">{payload[0].payload.name}</p>
                        <p className="font-bold">{formatCurrency(Number(payload[0].value))}</p>
                        <p className="text-[10px] uppercase font-bold mt-1" style={{ color: getStatusColor(payload[0].payload.status) }}>
                          {getStatusLabel(payload[0].payload.status)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]}
                onClick={(data) => setSelectedInvoiceId(data.id)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.status)}
                    fillOpacity={selectedInvoiceId === entry.id ? 1 : 0.4}
                    stroke={selectedInvoiceId === entry.id ? '#fff' : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoice Summary Card */}
      {selectedInvoice && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-card rounded-3xl p-8 border border-white/5 relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${getStatusColor(selectedInvoice.status)}, transparent)` }}
              />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs text-brand-text-muted uppercase font-bold tracking-widest mb-1">Fatura de</p>
                  <h4 className="text-xl font-bold">
                    {new Date(selectedInvoice.referenceYear, selectedInvoice.referenceMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h4>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                  selectedInvoice.status === 'paid' ? "border-green-500/30 text-green-400" : 
                  selectedInvoice.status === 'open' ? "border-orange-500/30 text-orange-400" :
                  selectedInvoice.status === 'overdue' ? "border-red-500/30 text-red-400" :
                  "border-blue-500/30 text-blue-400"
                )}>
                  {getStatusLabel(selectedInvoice.status)}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-brand-text-muted mb-1">Valor Total</p>
                  <p className="text-4xl font-bold">{formatCurrency(selectedInvoice.totalAmount)}</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-muted">Vencimento</span>
                    <span className="font-bold">{new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {card.id === 'card-pf-inter' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-text-muted">Minha Parte</span>
                        <span className="font-bold text-blue-400">{formatCurrency(selectedInvoice.userShare)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-text-muted">Parte da {selectedInvoice.thirdPartyName}</span>
                        <span className="font-bold text-purple-400">{formatCurrency(selectedInvoice.thirdPartyShare)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-colors">
                    <CheckCircle2 size={16} />
                    Pagar
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors">
                    <PlusCircle size={16} />
                    Compra
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-brand-card rounded-3xl p-6 border border-white/5 space-y-4">
              <h5 className="font-bold text-sm">Ações da Fatura</h5>
              <div className="grid grid-cols-1 gap-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-brand-text-muted hover:text-white group">
                  <FileText size={18} className="group-hover:text-brand-accent" />
                  Exportar PDF
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-brand-text-muted hover:text-white group">
                  <ArrowLeftRight size={18} className="group-hover:text-brand-accent" />
                  Parcelar Fatura
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-sm text-brand-text-muted hover:text-white group">
                  <Edit2 size={18} className="group-hover:text-brand-accent" />
                  Editar Lançamentos
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Extrato da Fatura</h3>
              {card.id === 'card-pf-inter' && (
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button 
                    onClick={() => setExpenseFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      expenseFilter === 'all' ? "bg-brand-accent text-white" : "text-brand-text-muted hover:text-white"
                    )}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setExpenseFilter('user')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      expenseFilter === 'user' ? "bg-brand-accent text-white" : "text-brand-text-muted hover:text-white"
                    )}
                  >
                    Eu
                  </button>
                  <button 
                    onClick={() => setExpenseFilter('third_party')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      expenseFilter === 'third_party' ? "bg-brand-accent text-white" : "text-brand-text-muted hover:text-white"
                    )}
                  >
                    {selectedInvoice.thirdPartyName}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {groupedExpenses.length > 0 ? groupedExpenses.map(([date, expenses]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-text-muted">
                      {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="space-y-3">
                    {expenses.map((exp: any) => {
                      const Icon = getCategoryIcon(exp.category);
                      return (
                        <div key={exp.id} className="bg-brand-card rounded-2xl p-4 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-brand-text-muted group-hover:text-brand-accent transition-colors">
                              <Icon size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{exp.description}</p>
                              <div className="flex items-center gap-2 text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">
                                <span>{exp.category}</span>
                                {exp.installments > 1 && (
                                  <>
                                    <span>•</span>
                                    <span>Parc {exp.currentInstallment}/{exp.installments}</span>
                                  </>
                                )}
                                {card.id === 'card-pf-inter' && (
                                  <>
                                    <span>•</span>
                                    <span className={exp.ownerType === 'user' ? "text-blue-400" : "text-purple-400"}>
                                      {exp.ownerType === 'user' ? 'Eu' : exp.ownerName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(exp.amount)}</p>
                            {exp.city && <p className="text-[10px] text-brand-text-muted">{exp.city}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted bg-brand-card rounded-3xl border border-white/5 border-dashed">
                  <CreditCard size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma despesa encontrada para esta fatura</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FinancialMap({ data, totals, theme }: { data: any, totals: any, theme: 'light' | 'dark' }) {
  const pieData = [
    { name: 'Dívidas', value: totals.totalDebts, color: '#ef4444' },
    { name: 'Investimentos', value: totals.totalInvestments, color: '#10b981' },
    { name: 'Saldo PF', value: totals.pfBalance, color: '#3b82f6' },
    { name: 'Saldo PJ', value: totals.pjBalance, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapa Financeiro Completo</h2>
          <p className="text-brand-text-muted">Onde está cada real do seu ecossistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <div className="bg-brand-card rounded-3xl p-8 border border-brand-border flex flex-col">
          <h3 className="text-lg font-bold mb-8">Distribuição de Patrimônio</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#1a1f3d' : '#ffffff', 
                    border: theme === 'dark' ? 'none' : '1px solid rgba(0,0,0,0.05)', 
                    borderRadius: '12px', 
                    color: theme === 'dark' ? '#fff' : '#0f172a' 
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-brand-hover">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-[10px] text-brand-text-muted uppercase font-bold">{item.name}</p>
                  <p className="text-sm font-bold">{formatCurrency(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto scrollbar-hide">
          <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
            <h3 className="text-lg font-bold mb-6">Comprometimento de Renda</h3>
            <div className="space-y-6">
              <FlowItem label="Dívidas (500/mês)" percentage={25} color="bg-red-500" />
              <FlowItem label="Cartões (500/mês)" percentage={25} color="bg-orange-500" />
              <FlowItem label="Custos Básicos" percentage={45} color="bg-blue-500" />
              <FlowItem label="Reserva" percentage={5} color="bg-green-500" />
            </div>
          </div>

          <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
            <h3 className="text-lg font-bold mb-6">Realidade Financeira</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-brand-text-muted mb-1">Dinheiro Livre (Disponível)</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(totals.pfBalance + totals.pjBalance)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-brand-text-muted mb-1">Total Comprometido (Dívidas)</p>
                <p className="text-xl font-bold text-red-400">{formatCurrency(totals.totalDebts)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-brand-accent/20 border border-brand-accent/30">
                <p className="text-xs text-brand-accent mb-1">Patrimônio Líquido Real</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.netWorth)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntityView({ type, data, onViewTransactions, onNavigate, onCardClick }: { type: 'PF' | 'PJ', data: any, onViewTransactions: (filter: string) => void, onNavigate: (view: View) => void, onCardClick: (cardId: string) => void }) {
  const entityAccounts = data.accounts.filter((a: any) => a.type === type);
  const entityCards = data.cards.filter((c: any) => c.type === type);
  const entityDebts = data.debts.filter((d: any) => d.type === type);
  const entityInvestments = data.investments.filter((i: any) => i.type === type);

  const balance = entityAccounts.reduce((acc: number, a: any) => acc + a.balance, 0);
  const debtTotal = entityDebts.reduce((acc: number, d: any) => acc + d.remainingValue, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão {type}</h2>
          <p className="text-brand-text-muted">Gestão dedicada para {type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Saldo em Contas" value={balance} icon={Wallet} color="text-blue-400" />
        <StatCard title="Total em Dívidas" value={debtTotal} icon={AlertCircle} color="text-red-400" />
        <StatCard title="Patrimônio Líquido" value={balance - debtTotal} icon={TrendingUp} color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 1. Cartões */}
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Cartões {type}</h3>
            <button 
              onClick={() => onViewTransactions('Cartão de Crédito')}
              className="text-xs font-bold text-brand-accent hover:underline"
            >
              Ver Detalhes
            </button>
          </div>
          <div className="space-y-4">
            {entityCards.map((card: any) => (
              <div 
                key={card.id} 
                onClick={() => onCardClick(card.id)}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-brand-accent/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BankLogo url={card.logoUrl} name={card.bank} className="w-10 h-10" />
                    <div>
                      <p className="text-sm font-bold group-hover:text-brand-accent transition-colors">{card.name}</p>
                      <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">Vence dia {String(card.dueDate || '').padStart(2, '0')}</p>
                    </div>
                  </div>
                  <CreditCardIcon size={18} className="text-brand-text-muted group-hover:text-brand-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">Limite Utilizado</span>
                    <span className="font-bold">{formatCurrency(card.used)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-accent transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.used / card.limit) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-brand-text-muted">Disponível: {formatCurrency(card.limit - card.used)}</span>
                    <span className="text-brand-text-muted">Total: {formatCurrency(card.limit)}</span>
                  </div>
                </div>
              </div>
            ))}
            {entityCards.length === 0 && (
              <p className="text-xs text-brand-text-muted text-center py-4">Nenhum cartão cadastrado</p>
            )}
          </div>
        </div>

        {/* 2. Contas */}
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Contas {type}</h3>
            <button 
              onClick={() => onViewTransactions('')}
              className="text-xs font-bold text-brand-accent hover:underline"
            >
              Ver Extrato
            </button>
          </div>
          <div className="space-y-4">
            {entityAccounts.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <BankLogo url={acc.logoUrl} name={acc.bank} className="w-10 h-10" />
                  <div>
                    <p className="text-sm font-bold">{acc.name}</p>
                    <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">{acc.bank}</p>
                  </div>
                </div>
                <p className="text-sm font-bold">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Dívidas */}
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Dívidas {type}</h3>
            <button 
              onClick={() => onNavigate('debts')}
              className="text-xs font-bold text-brand-accent hover:underline"
            >
              Ver Detalhes
            </button>
          </div>
          <div className="space-y-4">
            {entityDebts.slice(0, 5).map((debt: any) => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                    debt.status === 'OVERDUE' ? "bg-red-500/10 text-red-500" : "bg-white/10 text-brand-text-muted"
                  )}>
                    !
                  </div>
                  <div>
                    <p className="text-sm font-bold">{debt.name}</p>
                    <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">Vence dia {String(debt.dueDate || '').padStart(2, '0')}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold", debt.status === 'OVERDUE' ? "text-red-400" : "")}>
                  {formatCurrency(debt.remainingValue)}
                </p>
              </div>
            ))}
            {entityDebts.length > 5 && (
              <button className="w-full py-2 text-xs font-bold text-brand-text-muted hover:text-white transition-colors">
                Ver todas as {entityDebts.length} dívidas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsView({ data, onViewTransactions, onTransfer, onAdd }: { data: any, onViewTransactions: () => void, onTransfer: (id: string) => void, onAdd: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contas Bancárias</h2>
          <p className="text-brand-text-muted">Gestão centralizada de todas as suas contas</p>
        </div>
        <button 
          onClick={onAdd}
          className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all"
        >
          Adicionar Conta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.accounts.map((acc: any) => (
          <div key={acc.id} className="bg-brand-card rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BankLogo url={acc.logoUrl} name={acc.bank} className="w-12 h-12 p-1.5" />
                <div>
                  <h4 className="font-bold">{acc.name}</h4>
                  <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-widest">{acc.bank}</p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                acc.type === 'PF' ? "border-blue-500/30 text-blue-400" : "border-purple-500/30 text-purple-400"
              )}>
                {acc.type}
              </span>
            </div>
            <p className="text-xs text-brand-text-muted mb-1">Saldo Disponível</p>
            <h3 className="text-2xl font-bold">{formatCurrency(acc.balance)}</h3>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between">
              <button 
                onClick={onViewTransactions}
                className="text-xs font-bold text-brand-text-muted hover:text-white transition-colors"
              >
                Extrato
              </button>
              <button 
                onClick={() => onTransfer(acc.id)}
                className="text-xs font-bold text-brand-accent hover:underline transition-all"
              >
                Transferir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsView({ data, onAdd, onDelete }: { data: any, onAdd: () => void, onDelete: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Metas e Objetivos</h2>
          <p className="text-brand-text-muted">Planejamento de longo prazo e conquistas</p>
        </div>
        <button 
          onClick={onAdd}
          className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all"
        >
          Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.goals.map((goal: any) => (
          <div key={goal.id} className="bg-brand-card rounded-3xl p-8 border border-white/5 relative group">
            <button 
              onClick={() => onDelete(goal.id)}
              className="absolute top-6 right-6 p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              title="Excluir Meta"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Target size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{goal.name}</h3>
                  <p className="text-sm text-brand-text-muted">Meta: {formatCurrency(goal.targetValue)}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-brand-accent">
                {((goal.currentValue / goal.targetValue) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                  className="h-full bg-brand-accent rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Acumulado: {formatCurrency(goal.currentValue)}</span>
                <span className="text-brand-text-muted">Faltam: {formatCurrency(goal.targetValue - goal.currentValue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransferModal({ isOpen, onClose, accounts, onTransfer }: { isOpen: boolean, onClose: () => void, accounts: any[], onTransfer: (from: string, to: string, amount: number) => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-brand-card w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Transferir</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">De onde?</label>
            <select 
              value={from} 
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            >
              <option value="" className="bg-brand-card">Selecione a conta de origem</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-brand-card">{acc.name} ({formatCurrency(acc.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Para onde?</label>
            <select 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            >
              <option value="" className="bg-brand-card">Selecione a conta de destino</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-brand-card">{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Quanto?</label>
            <input 
              type="number" 
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <button 
            onClick={() => {
              if (from && to && amount) {
                onTransfer(from, to, parseFloat(amount));
                onClose();
              }
            }}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Confirmar Transferência
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TransactionModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (t: any) => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('OUTROS');
  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [flowType, setFlowType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [installments, setInstallments] = useState('1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-brand-card w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Novo Lançamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setType('PF')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all",
                  type === 'PF' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-brand-text-muted hover:text-white"
                )}
              >
                PF
              </button>
              <button 
                onClick={() => setType('PJ')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all",
                  type === 'PJ' ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-brand-text-muted hover:text-white"
                )}
              >
                PJ
              </button>
            </div>

            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setFlowType('INCOME')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all",
                  flowType === 'INCOME' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-brand-text-muted hover:text-white"
                )}
              >
                Entrada
              </button>
              <button 
                onClick={() => setFlowType('EXPENSE')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all",
                  flowType === 'EXPENSE' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-brand-text-muted hover:text-white"
                )}
              >
                Saída
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Aluguel, Supermercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Valor</label>
              <input 
                type="number" 
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Data</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            >
              <option value="PERSONAL" className="bg-brand-card">Pessoal</option>
              <option value="FIXED_COST" className="bg-brand-card">Custo Fixo</option>
              <option value="VARIABLE_COST" className="bg-brand-card">Custo Variável</option>
              <option value="REVENUE" className="bg-brand-card">Receita</option>
              <option value="INVESTMENT" className="bg-brand-card">Investimento</option>
              <option value="CREDIT_CARD" className="bg-brand-card">Cartão de Crédito</option>
              <option value="OUTROS" className="bg-brand-card">Outros</option>
            </select>
          </div>

          {category === 'CREDIT_CARD' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2">Parcelas</label>
              <input 
                type="number" 
                min="1"
                max="48"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </motion.div>
          )}

          <button 
            onClick={() => {
              if (description && amount) {
                onSave({
                  id: Math.random().toString(36).substr(2, 9),
                  description,
                  amount: parseFloat(amount) * (flowType === 'EXPENSE' ? -1 : 1),
                  date,
                  category,
                  type,
                  flowType,
                  installments: parseInt(installments) || 1
                });
                setDescription('');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('OUTROS');
                setType('PF');
                setFlowType('EXPENSE');
                setInstallments('1');
                onClose();
              }
            }}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Salvar Lançamento
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TransactionsView({ data, onDelete, onAdd, initialFilter = '' }: { data: any, onDelete: (id: string) => void, onAdd: () => void, initialFilter?: string }) {
  const [filter, setFilter] = useState(initialFilter);
  const transactions = data.transactions.filter((t: any) => 
    t.description.toLowerCase().includes(filter.toLowerCase()) ||
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lançamentos</h2>
          <p className="text-brand-text-muted">Histórico de movimentações financeiras</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar lançamentos..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-12 pr-6 py-3 bg-brand-hover border border-brand-border rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all w-64"
            />
          </div>
          <button 
            onClick={onAdd}
            className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20 flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-border bg-brand-hover/50">
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Descrição</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Entidade</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase text-right">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-brand-text-muted">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-brand-hover transition-colors">
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm font-bold">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-brand-hover rounded-md text-[10px] font-bold uppercase">{t.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                      t.type === 'PF' ? "text-blue-400 bg-blue-400/10" : "text-purple-400 bg-purple-400/10"
                    )}>{t.type}</span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-bold text-right",
                    t.amount > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                      title="Excluir Lançamento"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlowItem({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-brand-text-muted">{label}</span>
        <span className="font-bold">{percentage}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function AccountModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (account: any) => void }) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'PF' | 'PJ'>('PF');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Adicionar Nova Conta</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Nome da Conta</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Inter Principal"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Banco</label>
            <input 
              type="text" 
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="Ex: Inter"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Saldo Inicial</label>
              <input 
                type="number" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Tipo</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as 'PF' | 'PJ')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all appearance-none"
              >
                <option value="PF">Pessoa Física (PF)</option>
                <option value="PJ">Pessoa Jurídica (PJ)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => {
              if (name && bank && balance !== '') {
                onSave({
                  id: Math.random().toString(36).substr(2, 9),
                  name,
                  bank,
                  balance: parseFloat(balance),
                  type,
                  logoUrl: `https://logo.clearbit.com/${bank.toLowerCase().replace(/\s/g, '')}.com.br`
                });
                setName('');
                setBank('');
                setBalance('');
                setType('PF');
                onClose();
              }
            }}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Salvar Conta
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DebtModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (debt: any) => void }) {
  const [name, setName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'MAX' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [category, setCategory] = useState('PERSONAL');
  const [type, setType] = useState<'PF' | 'PJ'>('PF');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Nova Dívida ou Obrigação</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Descrição</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Empréstimo Bancário"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Valor Total</label>
              <input 
                type="number" 
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Dia Vencimento</label>
              <input 
                type="number" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="10"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Prioridade</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all appearance-none"
              >
                <option value="MAX">Máxima</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Tipo</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as 'PF' | 'PJ')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all appearance-none"
              >
                <option value="PF">Pessoa Física (PF)</option>
                <option value="PJ">Pessoa Jurídica (PJ)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all appearance-none"
            >
              <option value="PERSONAL">Dívida Pessoal</option>
              <option value="CARD">Cartão de Crédito</option>
              <option value="LOAN">Empréstimos</option>
              <option value="SERASA">Serasa</option>
              <option value="EDUCATION">Faculdade</option>
              <option value="FIXED_COST">Contas Fixas</option>
            </select>
          </div>

          <button 
            onClick={() => {
              if (name && totalValue !== '' && dueDate !== '') {
                onSave({
                  id: Math.random().toString(36).substr(2, 9),
                  name,
                  totalValue: parseFloat(totalValue),
                  remainingValue: parseFloat(totalValue),
                  dueDate: parseInt(dueDate),
                  priority,
                  category,
                  type,
                  status: 'PENDING'
                });
                setName('');
                setTotalValue('');
                setDueDate('');
                setPriority('MEDIUM');
                setCategory('PERSONAL');
                setType('PF');
                onClose();
              }
            }}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Salvar Dívida
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GoalModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (goal: any) => void }) {
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [deadline, setDeadline] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Nova Meta ou Objetivo</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Nome da Meta</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reserva de Emergência"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Valor Alvo</label>
              <input 
                type="number" 
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Valor Atual</label>
              <input 
                type="number" 
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0.00"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Prazo (Opcional)</label>
            <input 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
          </div>

          <button 
            onClick={() => {
              if (name && targetValue !== '') {
                onSave({
                  id: Math.random().toString(36).substr(2, 9),
                  name,
                  targetValue: parseFloat(targetValue),
                  currentValue: parseFloat(currentValue || '0'),
                  deadline
                });
                setName('');
                setTargetValue('');
                setCurrentValue('');
                setDeadline('');
                onClose();
              }
            }}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Salvar Meta
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ImpactSimulationModal({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: any }) {
  const [extraAmount, setExtraAmount] = useState('500');
  
  if (!isOpen) return null;

  const totalDebt = data.debts.reduce((acc: number, d: any) => acc + d.remainingValue, 0);
  const monthsToPay = Math.ceil(totalDebt / (parseFloat(extraAmount) || 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Simulador de Impacto</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Aporte Extra Mensal</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-brand-text-muted">R$</span>
              <input 
                type="number" 
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xl font-bold focus:outline-none focus:border-brand-accent transition-all"
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-text-muted">Total em Dívidas</span>
              <span className="font-bold">{formatCurrency(totalDebt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-text-muted">Tempo para Quitação</span>
              <span className="font-bold text-brand-accent">{monthsToPay} meses</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-brand-accent w-1/3" />
            </div>
            <p className="text-[10px] text-brand-text-muted text-center italic">
              * Estimativa baseada em juros simples e amortização constante.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all shadow-lg shadow-brand-accent/20"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
