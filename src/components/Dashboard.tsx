import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DollarSign, Tag, TrendingUp, HelpCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { Member, Expense, CATEGORIES } from '../types';
import { calculateBalances, calculateExpenseOwed } from '../utils/settle';

interface DashboardProps {
  members: Member[];
  expenses: Expense[];
}

export default function Dashboard({ members, expenses }: DashboardProps) {
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgSpend = expenses.length > 0 ? totalSpend / expenses.length : 0;
  const spendPerMember = members.length > 0 ? totalSpend / members.length : 0;

  // 1. Calculate spending by Category
  const categoryData = CATEGORIES.map(cat => {
    const sum = expenses
      .filter(e => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return { name: cat, value: parseFloat(sum.toFixed(2)) };
  }).filter(c => c.value > 0);

  // Fallback if empty
  const hasCategoryData = categoryData.length > 0;

  // Soft elegant editorial color palette
  const COLORS = {
    'Food': '#1A1A1A',          // Deep black
    'Travel': '#5A554C',        // Charcoal Linen
    'Lodging': '#8E8675',       // Antique Bronze
    'Entertainment': '#BBAE9A', // Pale Clay
    'Utilities': '#9E9482',     // Weathered Stone
    'Other': '#D2C9B9'          // Soft Ivory/Chalk
  };

  // 2. Calculate Paid vs Owed by Person
  const balances = calculateBalances(members, expenses);
  const barChartData = balances.map(b => ({
    name: b.memberName,
    Paid: parseFloat(b.paidAmount.toFixed(2)),
    Owed: parseFloat(b.owedAmount.toFixed(2))
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black text-white p-3.5 border border-black rounded-xs shadow-xl text-xs font-sans">
          <p className="font-bold mb-1">{payload[0].name}</p>
          <p className="text-[#D2C9B9] font-medium">Spent: ${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black text-white p-3.5 border border-black rounded-xs shadow-xl text-xs font-sans">
          <p className="font-bold mb-1.5">{payload[0].payload.name}</p>
          <div className="space-y-0.5 font-medium">
            <p className="text-[#D2C9B9]">Total Paid: ${payload[0].value.toFixed(2)}</p>
            <p className="text-stone-400">Share Owed: ${payload[1].value.toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-black/5 rounded-xs p-6 shadow-xs font-sans" id="metric-total-spend">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] block mb-2">Total Spending</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif italic text-3xl md:text-4xl text-[#1A1A1A]">${totalSpend.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-xs p-6 shadow-xs font-sans" id="metric-total-expenses">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] block mb-2">Sessions Logged</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif italic text-3xl md:text-4xl text-[#1A1A1A]">{expenses.length}</span>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-xs p-6 shadow-xs font-sans" id="metric-avg-size">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] block mb-2">Avg Session Cost</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif italic text-3xl md:text-4xl text-[#1A1A1A]">${avgSpend.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-xs p-6 shadow-xs font-sans" id="metric-share">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] block mb-2">Cost Per Member</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif italic text-3xl md:text-4xl text-[#1A1A1A]">${spendPerMember.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Category breakdown (Pie chart) */}
        <div className="bg-white border border-black/5 rounded-xs p-8 shadow-xs lg:col-span-2 flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-black/40" />
              Spending by Category
            </h3>
          </div>

          {!hasCategoryData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6" id="category-chart-empty">
              <AlertCircle className="w-6 h-6 text-black/20 mb-2" />
              <p className="font-sans text-xs text-black/40">Log an expense to see category breakdowns.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8E8675'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2">
                {categoryData.map(c => {
                  const color = COLORS[c.name as keyof typeof COLORS] || '#8E8675';
                  const percent = ((c.value / totalSpend) * 100).toFixed(0);
                  return (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs font-sans font-medium text-black/70">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: color }} />
                      <span>{c.name}</span>
                      <span className="text-black/40">({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Member Contributions head to head (Bar chart) */}
        <div className="bg-white border border-black/5 rounded-xs p-8 shadow-xs lg:col-span-3 flex flex-col min-h-[360px]">
          <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-black/40" />
            Paid vs Owed head-to-head
          </h3>

          {expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6" id="member-chart-empty">
              <AlertCircle className="w-6 h-6 text-black/20 mb-2" />
              <p className="font-sans text-xs text-black/40">Log expenses to compare member balances.</p>
            </div>
          ) : (
            <div className="flex-1 h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#1A1A1A', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#1A1A1A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend verticalAlign="top" height={36} iconSize={8} iconType="square" wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }} />
                  <Bar dataKey="Paid" fill="#1A1A1A" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Owed" fill="#BBAE9A" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
