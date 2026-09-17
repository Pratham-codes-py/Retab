'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/calculations/billing';
import { formatDistanceToNow } from 'date-fns';

type Customer = {
  id: string;
  name: string;
  phone: string;
  first_visit: string;
  last_visit: string;
  visit_count: number;
  total_spend: number;
};

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBySpend, setSortBySpend] = useState(false);

  // Filter and Sort
  let displayedCustomers = initialCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  if (sortBySpend) {
    displayedCustomers.sort((a, b) => b.total_spend - a.total_spend);
  } else {
    // Default sort by last_visit desc
    displayedCustomers.sort((a, b) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime());
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-primary-fixed-dim text-on-primary-fixed border-primary/10',
      'bg-secondary-fixed text-on-secondary-fixed border-secondary/10',
      'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/10'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <>
      {/* Header Section */}
      <header className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md" style={{ marginBottom: '40px' }}>
        <div>
          <h2 className="font-display-sm text-display-sm text-on-surface mb-xs" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Customers</h2>
          <p className="font-body-md text-body-md text-on-surface-variant" style={{ fontSize: '16px', color: '#55423e' }}>Manage your guest relationships and loyalty data.</p>
        </div>
        <div className="flex gap-sm" style={{ gap: '12px' }}>
          <button className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container transition-colors" style={{ padding: '8px 24px', borderRadius: '8px', border: '1px solid #88726d', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>file_download</span>
            Export
          </button>
          <button className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all" style={{ padding: '8px 24px', borderRadius: '8px', background: '#853423', color: '#ffffff', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            Add Customer
          </button>
        </div>
      </header>

      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-grid-gutter mb-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-sm" style={{ background: '#f6f3f2', padding: '24px', borderRadius: '12px', gap: '12px', border: '1px solid rgba(219, 193, 187, 0.5)' }}>
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-primary p-xs rounded-lg" style={{ color: '#853423', background: '#ffdad3', padding: '4px', borderRadius: '8px' }}>person_add</span>
            <span className="text-success text-xs font-bold px-xs py-1 rounded-full" style={{ color: '#15803d', background: '#dcfce7', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>+12%</span>
          </div>
          <div>
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" style={{ fontSize: '12px', color: '#55423e', fontWeight: 600, letterSpacing: '0.05em' }}>New This Month</h4>
            <p className="font-pos-price text-pos-price text-on-surface" style={{ fontSize: '28px', fontWeight: 700 }}>148</p>
          </div>
        </div>
        
        <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-sm" style={{ background: '#f6f3f2', padding: '24px', borderRadius: '12px', gap: '12px', border: '1px solid rgba(219, 193, 187, 0.5)' }}>
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-tertiary p-xs rounded-lg" style={{ color: '#4f4d4a', background: '#e6e2dd', padding: '4px', borderRadius: '8px' }}>workspace_premium</span>
            <span className="text-on-surface-variant text-xs font-bold px-xs py-1 bg-surface-variant rounded-full" style={{ color: '#55423e', background: '#e5e2e1', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>Top 5%</span>
          </div>
          <div>
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" style={{ fontSize: '12px', color: '#55423e', fontWeight: 600, letterSpacing: '0.05em' }}>Loyal Guests</h4>
            <p className="font-pos-price text-pos-price text-on-surface" style={{ fontSize: '28px', fontWeight: 700 }}>{initialCustomers.filter(c => c.visit_count > 5).length}</p>
          </div>
        </div>
        
        <div className="p-md rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fcf9f8 0%, #f6f3f2 100%)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(219, 193, 187, 0.5)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-xs" style={{ marginBottom: '8px' }}>
              <span className="material-symbols-outlined text-primary" style={{ color: '#853423' }}>analytics</span>
            </div>
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" style={{ fontSize: '12px', color: '#55423e', fontWeight: 600, letterSpacing: '0.05em' }}>Average Spend</h4>
            <p className="font-pos-price text-pos-price text-primary" style={{ fontSize: '28px', fontWeight: 700, color: '#853423' }}>
              {initialCustomers.length > 0 
                ? formatCurrency(initialCustomers.reduce((acc, c) => acc + c.total_spend, 0) / initialCustomers.length) 
                : '₹0.00'}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>monitoring</span>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="mb-md flex flex-col lg:flex-row items-center gap-md" style={{ marginBottom: '24px', display: 'flex', gap: '24px' }}>
        <div className="relative flex-1 w-full" style={{ flex: 1 }}>
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ left: '24px', color: '#55423e' }}>search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body-md transition-all" 
            style={{ width: '100%', paddingLeft: '64px', paddingRight: '24px', paddingTop: '12px', paddingBottom: '12px', background: '#ffffff', border: '1px solid rgba(219, 193, 187, 0.5)', borderRadius: '12px', fontSize: '16px' }}
            placeholder="Search by name, phone, or email..." 
            type="text" 
          />
        </div>
        <div className="flex items-center gap-sm" style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setSortBySpend(!sortBySpend)}
            className={`flex items-center gap-xs px-md py-xs rounded-full border ${sortBySpend ? 'border-primary text-primary bg-primary-fixed/20' : 'border-outline-variant text-on-surface-variant hover:border-primary'} font-label-md transition-colors whitespace-nowrap`}
            style={{ padding: '8px 24px', borderRadius: '9999px', border: `1px solid ${sortBySpend ? '#853423' : '#dbc1bb'}`, color: sortBySpend ? '#853423' : '#55423e', fontWeight: 500, background: sortBySpend ? 'rgba(255, 218, 211, 0.2)' : 'transparent' }}
          >
            Sort by Spend
            <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>swap_vert</span>
          </button>
        </div>
      </section>

      {/* Table Container */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" style={{ background: '#f6f3f2', borderRadius: '12px', border: '1px solid rgba(219, 193, 187, 0.5)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ width: '100%' }}>
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/20" style={{ background: '#f0eded', borderBottom: '1px solid rgba(219, 193, 187, 0.5)' }}>
                <th className="p-md font-label-md text-on-surface-variant uppercase tracking-wider" style={{ padding: '24px', fontSize: '14px', color: '#55423e', fontWeight: 500 }}>Customer Name</th>
                <th className="p-md font-label-md text-on-surface-variant uppercase tracking-wider" style={{ padding: '24px', fontSize: '14px', color: '#55423e', fontWeight: 500 }}>Phone</th>
                <th className="p-md font-label-md text-on-surface-variant uppercase tracking-wider" style={{ padding: '24px', fontSize: '14px', color: '#55423e', fontWeight: 500 }}>Visits</th>
                <th className="p-md font-label-md text-on-surface-variant uppercase tracking-wider" style={{ padding: '24px', fontSize: '14px', color: '#55423e', fontWeight: 500 }}>Total Spend</th>
                <th className="p-md font-label-md text-on-surface-variant uppercase tracking-wider" style={{ padding: '24px', fontSize: '14px', color: '#55423e', fontWeight: 500 }}>Last Visit</th>
                <th className="p-md" style={{ padding: '24px' }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10" style={{ borderStyle: 'solid', borderColor: 'rgba(219, 193, 187, 0.5)' }}>
              {displayedCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-surface-variant/30 transition-colors group" style={{ borderTop: index === 0 ? '0' : '1px solid rgba(219, 193, 187, 0.5)' }}>
                  <td className="p-md" style={{ padding: '24px' }}>
                    <div className="flex items-center gap-md" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-headline-md border ${getAvatarColor(customer.name)}`} style={{ width: '40px', height: '40px', borderRadius: '9999px', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="font-label-md text-on-surface" style={{ fontSize: '14px', fontWeight: 500, color: '#1c1b1b' }}>{customer.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-md font-body-md text-on-surface-variant" style={{ padding: '24px', fontSize: '16px', color: '#55423e' }}>{customer.phone}</td>
                  <td className="p-md" style={{ padding: '24px' }}>
                    <span className={`px-sm py-1 rounded-full font-bold text-xs uppercase ${customer.visit_count > 5 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`} style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, background: customer.visit_count > 5 ? '#a44b38' : '#e5e2e1', color: customer.visit_count > 5 ? '#ffddd6' : '#55423e' }}>
                      {customer.visit_count > 5 ? `Loyal • ${customer.visit_count} Visits` : `${customer.visit_count} Visits`}
                    </span>
                  </td>
                  <td className="p-md font-label-md text-on-surface" style={{ padding: '24px', fontSize: '14px', fontWeight: 500, color: '#1c1b1b' }}>{formatCurrency(customer.total_spend)}</td>
                  <td className="p-md text-on-surface-variant font-body-md" style={{ padding: '24px', fontSize: '16px', color: '#55423e' }}>
                    {formatDistanceToNow(new Date(customer.last_visit), { addSuffix: true })}
                  </td>
                  <td className="p-md text-right" style={{ padding: '24px', textAlign: 'right' }}>
                    <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100" style={{ color: '#55423e', opacity: 0.5 }}>more_vert</button>
                  </td>
                </tr>
              ))}
              {displayedCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-md text-center text-on-surface-variant" style={{ padding: '40px', textAlign: 'center', color: '#55423e' }}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
