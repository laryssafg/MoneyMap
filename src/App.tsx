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
  MoreHorizontal
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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('');

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
            accounts: accounts.map(a => ({ ...a, balance: Number(a.balance) })),
            cards: cards?.map(c => ({ 
              ...c, 
              limit: Number(c.limit_value), 
              used: Number(c.used),
              closingDay: c.closing_day
            })) || [],
            invoices: invoices?.map(inv => ({
              ...inv,
              totalAmount: Number(inv.total_amount),
              userShare: Number(inv.user_share),
              thirdPartyShare: Number(inv.third_party_share)
            })) || [],
            cardExpenses: cardExpenses?.map(exp => ({
              ...exp,
              amount: Number(exp.amount)
            })) || [],
            debts: debts?.map(d => ({ 
              ...d, 
              totalValue: Number(d.total_value), 
              remainingValue: Number(d.remaining_value),
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
    // Optimistic update
    setData(prev => {
      let newCards = [...prev.cards];
      
      // Credit Card Logic for PJ
      if (transaction.category === 'CREDIT_CARD' && transaction.type === 'PJ') {
        newCards = prev.cards.map(card => {
          if (card.type === 'PJ') {
            const amount = Math.abs(transaction.amount);
            if (transaction.flowType === 'EXPENSE') {
              return { ...card, used: card.used + amount };
            } else {
              return { ...card, used: Math.max(0, card.used - amount) };
            }
          }
          return card;
        });
      }

      return {
        ...prev,
        cards: newCards,
        transactions: [transaction, ...prev.transactions]
      };
    });

    // Sync with Supabase
    try {
      await supabase.from('transactions').insert([{
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        category: transaction.category,
        type: transaction.type,
        flow_type: transaction.flowType
      }]);

      if (transaction.category === 'CREDIT_CARD' && transaction.type === 'PJ') {
        const pjCard = data.cards.find(c => c.type === 'PJ');
        if (pjCard) {
          const amount = Math.abs(transaction.amount);
          const newUsed = transaction.flowType === 'EXPENSE' ? pjCard.used + amount : Math.max(0, pjCard.used - amount);
          await supabase.from('cards').update({ used: newUsed }).eq('id', pjCard.id);
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
        return <Dashboard totals={totals} data={data} />;
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
          />
        );
      case 'debts':
        return <DebtsView data={data} />;
      case 'cards':
        return <CardsView data={data} onViewTransactions={(filter) => navigateToTransactions(filter)} onCardClick={handleCardClick} />;
      case 'goals':
        return <GoalsView data={data} />;
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
        return <FinancialMap data={data} totals={totals} />;
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
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-brand-card border-r border-white/5 flex flex-col z-20"
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
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-brand-text-muted"
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
                  : "text-brand-text-muted hover:bg-white/5 hover:text-white"
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

        <div className="p-4 border-t border-white/5">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-white/5",
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
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-lg font-semibold">
            {menuItems.find(m => m.id === currentView)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
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

function Dashboard({ totals, data }: { totals: any, data: any }) {
  const chartData = [
    { name: 'Jan', pf: 0, pj: 0 },
    { name: 'Fev', pf: 0, pj: 0 },
    { name: 'Mar', pf: 0, pj: 0 },
    { name: 'Abr', pf: 0, pj: 0 },
  ];

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
        <div className="lg:col-span-2 bg-brand-card rounded-3xl p-8 border border-white/5">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f3d', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="pf" stroke="#60a5fa" fillOpacity={1} fill="url(#colorPf)" strokeWidth={3} />
                <Area type="monotone" dataKey="pj" stroke="#8a2695" fillOpacity={1} fill="url(#colorPj)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Pressure */}
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5 flex flex-col">
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
                  className="text-white/5"
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
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-xs text-brand-text-muted">Vence no mês</span>
                <span className="text-sm font-bold">{formatCurrency(pressure.monthlyVenc)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-xs text-brand-text-muted">Pode pagar</span>
                <span className="text-sm font-bold">{formatCurrency(pressure.capacity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
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
                  <p className="text-[10px] text-brand-text-muted">Vencimento: Dia {debt.dueDate.toString().padStart(2, '0')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-card rounded-3xl p-8 border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="text-blue-400" size={20} />
            Próximos Vencimentos
          </h3>
          <div className="space-y-4">
            {data.debts.filter(d => d.status === 'PENDING').sort((a, b) => Number(a.dueDate) - Number(b.dueDate)).slice(0, 4).map(debt => (
              <div key={debt.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
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
                  <p className="text-[10px] text-brand-text-muted">Vence dia {debt.dueDate.toString().padStart(2, '0')}</p>
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
    <div className="bg-brand-card rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform", color)}>
          <Icon size={24} />
        </div>
        <ChevronRight size={16} className="text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-brand-text-muted mb-1">{title}</p>
      <h4 className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</h4>
    </div>
  );
}

function DebtsView({ data }: { data: any }) {
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
        <button className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all">
          Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          {categories.map(cat => {
            const catDebts = data.debts.filter((d: any) => d.category === cat.id);
            if (catDebts.length === 0) return null;

            return (
              <div key={cat.id} className="bg-brand-card rounded-3xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-6 rounded-full", cat.color)} />
                    <h3 className="font-bold">{cat.label}</h3>
                  </div>
                  <span className="text-xs font-bold text-brand-text-muted">
                    {catDebts.length} itens • {formatCurrency(catDebts.reduce((acc: number, d: any) => acc + d.remainingValue, 0))}
                  </span>
                </div>
                <div className="divide-y divide-white/5">
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
                              {debt.type} • Vence dia {debt.dueDate.toString().padStart(2, '0')}
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
          <div className="bg-brand-card rounded-3xl p-6 border border-white/5">
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
            <button className="w-full py-3 bg-white text-brand-accent rounded-xl font-bold text-sm hover:bg-white/90 transition-all">
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
            className="bg-brand-card rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-brand-accent/30 transition-all group"
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
            
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-brand-text-muted" />
                <span className="text-sm text-brand-text-muted">Vencimento: Dia {card.dueDate.toString().padStart(2, '0')}</span>
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
          <p className="text-2xl font-bold">{card.dueDate.toString().padStart(2, '0')}</p>
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

function FinancialMap({ data, totals }: { data: any, totals: any }) {
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
        <div className="bg-brand-card rounded-3xl p-8 border border-white/5 flex flex-col">
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
                  contentStyle={{ backgroundColor: '#1a1f3d', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
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
                      <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">Vence dia {card.dueDate.toString().padStart(2, '0')}</p>
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
                    <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider">Vence dia {debt.dueDate.toString().padStart(2, '0')}</p>
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

function AccountsView({ data, onViewTransactions, onTransfer }: { data: any, onViewTransactions: () => void, onTransfer: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contas Bancárias</h2>
          <p className="text-brand-text-muted">Gestão centralizada de todas as suas contas</p>
        </div>
        <button className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all">
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

function GoalsView({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Metas e Objetivos</h2>
          <p className="text-brand-text-muted">Planejamento de longo prazo e conquistas</p>
        </div>
        <button className="px-6 py-3 bg-brand-accent rounded-2xl font-bold text-sm hover:bg-brand-accent/90 transition-all">
          Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.goals.map((goal: any) => (
          <div key={goal.id} className="bg-brand-card rounded-3xl p-8 border border-white/5">
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
                  flowType
                });
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
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-brand-accent transition-all w-64"
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

      <div className="bg-brand-card rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Descrição</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase">Entidade</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase text-right">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-brand-text-muted">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : (
              transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 text-sm">{t.date}</td>
                  <td className="px-6 py-4 text-sm font-bold">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-bold uppercase">{t.category}</span>
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
