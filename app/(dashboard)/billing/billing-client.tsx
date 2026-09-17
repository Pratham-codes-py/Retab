'use client';

import { useState, useMemo } from 'react';
import { calculateTotal, formatCurrency, BillLineItem } from '@/lib/calculations/billing';

export default function BillingClient({ cafe, menuItems }: { cafe: any, menuItems: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderItems, setOrderItems] = useState<BillLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendBill = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to your cart.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Please enter a customer phone number.');
      return;
    }

    if (!cafe?.id) {
      alert('Cafe context not found.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order and save items in DB
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafe_id: cafe.id,
          customer_phone: customerPhone.trim(),
          customer_name: customerName.trim() || undefined,
          items: orderItems,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const createdOrder = orderData.order;

      // 2. Trigger WhatsApp bill delivery
      const whatsappRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafe_id: cafe.id,
          customer_id: createdOrder.customer_id,
          customer_phone: customerPhone.trim(),
          order_id: createdOrder.id,
          total_amount: createdOrder.total_amount,
        }),
      });

      const whatsappData = await whatsappRes.json();

      if (whatsappRes.status === 402) {
        alert('Order saved! However, WhatsApp could not be sent due to insufficient credit balance.');
      } else if (!whatsappRes.ok) {
        console.warn('WhatsApp API warning:', whatsappData.error);
        alert('Order saved! WhatsApp delivery failed: ' + (whatsappData.error || 'Unknown error'));
      } else {
        alert('Order created and WhatsApp bill sent successfully!');
      }

      // Clear the form
      clearOrder();
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: any) {
      console.error('Error placing order:', err);
      alert('Error creating order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique categories from actual menu items
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  // Filtering
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Cart Management
  const addToOrder = (menuItem: any) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map(i => i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.menuItemId === menuItemId) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const clearOrder = () => setOrderItems([]);

  // Calculations
  const taxPercent = cafe?.tax_percent !== undefined ? parseFloat(cafe.tax_percent) : 5.0;
  const taxRate = isNaN(taxPercent) ? 0.05 : taxPercent / 100;
  const { subtotal, tax, total } = useMemo(() => calculateTotal(orderItems, taxRate), [orderItems, taxRate]);

  return (
    <div className="flex-grow flex h-[calc(100vh-64px)] -m-8">
      {/* Sidebar: Categories */}
      <section className="w-[200px] flex-shrink-0 bg-surface-container-low border-r border-outline-variant p-4 overflow-y-auto" style={{ background: '#f6f3f2', borderRight: '1px solid #dbc1bb' }}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider ml-1 mb-4" style={{ color: '#55423e' }}>Categories</h3>
        <div className="flex flex-col gap-1">
          {uniqueCategories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-left px-3 py-2 rounded-lg transition-colors cursor-pointer w-full text-[13px] font-bold"
                style={{ 
                  background: isActive ? '#eae7e7' : 'transparent',
                  color: isActive ? '#853423' : '#55423e'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Middle Section: Search & Menu Items */}
      <section className="flex-grow p-4 overflow-hidden flex flex-col bg-surface-bright" style={{ padding: '16px', background: '#fcf9f8' }}>
        <div className="mb-4" style={{ marginBottom: '16px' }}>
          <div className="flex items-center justify-between mb-4" style={{ marginBottom: '16px' }}>
            <h2 className="font-headline-lg text-headline-lg text-on-surface" style={{ fontSize: '20px', fontWeight: 600 }}>Menu Items</h2>
          </div>
          {/* Search Bar */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ left: '16px', color: '#55423e' }}>search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container border-none rounded-xl font-body-lg text-body-lg focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50 shadow-sm" 
              style={{ height: '48px', paddingLeft: '48px', paddingRight: '16px', background: '#f0eded', borderRadius: '8px', fontSize: '16px' }}
              placeholder="Search menu items..." 
              type="text" 
            />
          </div>
        </div>

        {/* Compact Item List */}
        <div className="flex-grow overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ display: 'grid', gap: '8px' }}>
            {filteredMenu.map(item => (
              <div 
                key={item.id}
                onClick={() => addToOrder(item)}
                className="flex items-center justify-between p-3 bg-surface-container-lowest border border-transparent hover:border-outline-variant hover:bg-surface-container-low rounded-xl cursor-pointer transition-all active:scale-[0.98]" 
                style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', borderColor: 'transparent', cursor: 'pointer', border: '1px solid #eae7e7' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: `1px solid ${item.is_veg !== false ? '#059669' : '#ba1a1a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: item.is_veg !== false ? '50%' : '0%',
                      background: item.is_veg !== false ? '#059669' : '#ba1a1a'
                    }} />
                  </div>
                  <span className="font-headline-md text-headline-md text-on-surface truncate pr-2" style={{ fontSize: '15px', fontWeight: 600 }}>{item.name}</span>
                </div>
                <span className="font-headline-md text-headline-md text-primary flex-shrink-0" style={{ fontSize: '15px', fontWeight: 700, color: '#853423' }}>{formatCurrency(item.price)}</span>
              </div>
            ))}
            {filteredMenu.length === 0 && (
              <div className="col-span-full text-center text-on-surface-variant mt-8 opacity-60">No items found.</div>
            )}
          </div>
        </div>
      </section>

      {/* Right Section: Compact Order Summary */}
      <section className="w-[360px] flex-shrink-0 bg-surface-container shadow-2xl flex flex-col border-l border-outline-variant" style={{ width: '360px', background: '#f0eded', borderLeft: '1px solid #dbc1bb', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low" style={{ padding: '16px', borderBottom: '1px solid #dbc1bb', background: '#f6f3f2' }}>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface" style={{ fontSize: '18px', fontWeight: 700 }}>New Order</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#55423e' }}>Dine-in • Table 01</p>
          </div>
          <button onClick={clearOrder} className="p-2 text-error hover:bg-error-container rounded-full transition-colors active:scale-95" style={{ padding: '8px', color: '#ba1a1a', borderRadius: '9999px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete_sweep</span>
          </button>
        </div>
        
        {/* Items List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
          {orderItems.length === 0 ? (
            <div className="flex h-full items-center justify-center text-on-surface-variant opacity-60">
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            orderItems.map(item => (
              <div key={item.menuItemId} className="bg-surface-bright p-2 rounded-lg border border-outline-variant flex items-center justify-between group" style={{ background: '#fcf9f8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #dbc1bb' }}>
                <div className="flex-grow min-w-0 pr-2">
                  <p className="font-label-md text-label-md text-on-surface truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</p>
                  <p className="font-body-md text-body-md text-primary font-bold" style={{ fontSize: '14px', fontWeight: 700, color: '#853423' }}>{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" style={{ gap: '4px' }}>
                  <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors active:scale-90" style={{ width: '32px', height: '32px', background: '#eae7e7', borderRadius: '9999px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
                  </button>
                  <span className="w-6 text-center font-headline-md text-headline-md" style={{ width: '24px', textAlign: 'center', fontSize: '16px', fontWeight: 700 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface hover:bg-outline-variant transition-colors active:scale-90" style={{ width: '32px', height: '32px', background: '#eae7e7', borderRadius: '9999px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total and Actions */}
        <div className="p-4 bg-surface-container-highest space-y-4 rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)]" style={{ padding: '16px', background: '#e5e2e1', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#55423e' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#55423e' }}>
              <span>Tax ({taxPercent}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between items-end border-t border-outline-variant pt-2 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #dbc1bb', paddingTop: '8px', marginTop: '4px' }}>
              <span className="font-headline-md text-headline-md text-on-surface" style={{ fontSize: '18px', fontWeight: 700 }}>Total</span>
              <span className="font-pos-price text-pos-price text-primary" style={{ fontSize: '24px', fontWeight: 800, color: '#853423' }}>{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Customer Details Input */}
          <div className="grid grid-cols-1 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <div className="relative">
              <input 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 bg-surface-container-lowest border-outline-variant border rounded-lg px-3 font-body-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                style={{ width: '100%', height: '40px', background: '#ffffff', border: '1px solid #dbc1bb', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                placeholder="Customer Name" 
                type="text" 
              />
            </div>
            <div className="relative">
              <input 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 bg-surface-container-lowest border-outline-variant border rounded-lg px-3 font-body-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                style={{ width: '100%', height: '40px', background: '#ffffff', border: '1px solid #dbc1bb', borderRadius: '6px', padding: '0 12px', fontSize: '14px' }}
                placeholder="Phone Number" 
                type="tel" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button 
              onClick={handleSendBill}
              disabled={isSubmitting}
              className="h-[52px] w-full bg-primary text-on-primary rounded-xl font-headline-md text-headline-md active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md hover:opacity-90" 
              style={{ 
                height: '52px', 
                background: isSubmitting ? '#a44b38' : '#853423', 
                color: '#ffffff', 
                borderRadius: '10px', 
                fontSize: '18px', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
              {isSubmitting ? 'Sending...' : 'Send Bill'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
