'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MenuClient({ cafeId, initialCategories, initialItems }: { cafeId: string, initialCategories: any[], initialItems: any[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState(initialCategories);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category Form
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Item Form
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Computed Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory ? item.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, activeCategory]);

  const toggleVeg = async (id: string, currentVeg: boolean) => {
    const newVeg = !currentVeg;
    // Optimistic update
    setItems(items.map(item => item.id === id ? { ...item, is_veg: newVeg } : item));

    if (cafeId) {
      await supabase.from('menu_items').update({ is_veg: newVeg }).eq('id', id);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    // Optimistic / Fallback update (in case DB table doesn't exist yet)
    const tempId = Date.now().toString();
    const newCategory = { id: tempId, name };
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setIsAddingCategory(false);

    if (cafeId) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ cafe_id: cafeId, name })
        .select()
        .single();
      
      if (!error && data) {
        // Swap temp id with real id silently
        setCategories(prev => prev.map(c => c.id === tempId ? data : c));
      }
    } else {
      alert("Error: No Cafe ID found. Your changes will not be saved.");
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent activating category filter
    const categoryObject = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    if (categoryObject) {
      setItems(prev => prev.map(item => item.category === categoryObject.name ? { ...item, category: 'Uncategorised' } : item));
    }
    if (cafeId) {
      await supabase.from('categories').delete().eq('id', id);
      if (categoryObject) {
        await supabase
          .from('menu_items')
          .update({ category: 'Uncategorised' })
          .eq('cafe_id', cafeId)
          .eq('category', categoryObject.name);
      }
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !newItemCategory) return;

    const tempItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      price: parseInt(newItemPrice, 10),
      category: newItemCategory,
      is_veg: newItemIsVeg
    };

    // Optimistic / Fallback update
    setItems(prev => [tempItem, ...prev]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCategory('');
    setNewItemIsVeg(true);
    setIsAddingItem(false);

    if (cafeId) {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          cafe_id: cafeId,
          name: tempItem.name,
          price: tempItem.price,
          category: tempItem.category,
          is_veg: tempItem.is_veg
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving item:', error);
        alert(`Failed to save item: ${error.message}`);
        // Remove optimistic item on error
        setItems(prev => prev.filter(i => i.id !== tempItem.id));
      }
      if (!error && data) {
        const mappedItem = {
          id: data.id,
          name: data.name,
          price: Number(data.price),
          category: data.category || 'Uncategorised',
          is_veg: data.is_veg !== false
        };
        setItems(prev => prev.map(i => i.id === tempItem.id ? mappedItem : i));
      }
    } else {
      alert("Error: No Cafe ID found. Your changes will not be saved. Please refresh the page or create a cafe first.");
      // Remove optimistic item on error
      setItems(prev => prev.filter(i => i.id !== tempItem.id));
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (cafeId) {
      await supabase.from('menu_items').delete().eq('id', id);
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-6">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: '#1c1b1b' }}>Menu Management</h2>
          <p className="text-[14px]" style={{ color: '#55423e' }}>Organize and manage your cafe items with ease.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#55423e' }}>search</span>
            <input 
              className="pl-10 pr-4 py-2 bg-white rounded-lg focus:ring-2 outline-none transition-all text-[14px] w-full md:w-64" 
              style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }}
              placeholder="Search menu items..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="flex items-center gap-1 px-4 h-[38px] rounded-lg text-[14px] font-semibold hover:opacity-90 transition-opacity" 
            style={{ background: '#853423', color: '#ffffff' }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Item
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Category Sidebar Filter */}
        <div className="md:col-span-3 space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider ml-1 mb-2" style={{ color: '#55423e' }}>Categories</h3>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveCategory(null)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-[13px] font-bold"
              style={{ 
                background: activeCategory === null ? '#eae7e7' : 'transparent',
                color: activeCategory === null ? '#853423' : '#55423e' 
              }}
            >
              <span>All Items</span>
              <span className="text-[11px] px-2 rounded-full" style={{ background: activeCategory === null ? '#a44b38' : 'transparent', color: activeCategory === null ? '#ffffff' : '#88726d' }}>
                {items.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = items.filter(i => i.category === cat.name).length;
              const isActive = activeCategory === cat.name;
              return (
                <div key={cat.id} className="group flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer"
                     style={{ background: isActive ? '#eae7e7' : 'transparent' }}
                     onClick={() => setActiveCategory(cat.name)}>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold" style={{ color: isActive ? '#853423' : '#55423e' }}>{cat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#ba1a1a', border: 'none', background: 'none' }}
                      title="Delete category"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                    <span className="text-[11px] px-2 rounded-full font-bold" style={{ background: isActive ? '#a44b38' : 'transparent', color: isActive ? '#ffffff' : '#88726d' }}>
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Category Section at Bottom */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #dbc1bb' }}>
            {isAddingCategory ? (
              <form onSubmit={handleAddCategory} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: '#f6f3f2', border: '1px solid #dbc1bb' }}>
                <input 
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category..."
                  className="w-full px-2 py-1.5 text-[13px] rounded bg-white outline-none"
                  style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }}
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 text-[11px] py-1 rounded font-bold" style={{ background: '#853423', color: '#fff' }}>Save</button>
                  <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 text-[11px] py-1 rounded font-bold" style={{ background: '#e5e2e1', color: '#1c1b1b' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-1 text-[13px] font-bold w-full px-3 py-2 rounded-lg transition-colors"
                style={{ color: '#853423' }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Category
              </button>
            )}
          </div>
        </div>

        {/* Items List View */}
        <div className="md:col-span-9">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #dbc1bb' }}>
            <div className="flex flex-col">
              
              {/* New Item Inline Form */}
              {isAddingItem && (
                <form onSubmit={handleAddItem} className="flex flex-wrap md:flex-nowrap items-end justify-between p-4 gap-4" style={{ background: '#fcf9f8', borderBottom: '1px solid #dbc1bb' }}>
                  <div className="flex flex-col gap-1 w-full md:w-1/4">
                    <label className="text-[11px] font-bold uppercase" style={{ color: '#55423e' }}>Item Name</label>
                    <input type="text" required value={newItemName} onChange={e => setNewItemName(e.target.value)} className="px-3 py-1.5 text-[14px] rounded-lg bg-white outline-none" style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }} placeholder="e.g. Mocha" />
                  </div>
                  <div className="flex flex-col gap-1 w-full md:w-1/5">
                    <label className="text-[11px] font-bold uppercase" style={{ color: '#55423e' }}>Category</label>
                    <select required value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="px-3 py-1.5 text-[14px] rounded-lg bg-white outline-none" style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }}>
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 w-full md:w-1/5">
                    <label className="text-[11px] font-bold uppercase" style={{ color: '#55423e' }}>Type</label>
                    <select required value={newItemIsVeg ? 'veg' : 'non-veg'} onChange={e => setNewItemIsVeg(e.target.value === 'veg')} className="px-3 py-1.5 text-[14px] rounded-lg bg-white outline-none" style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }}>
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-Veg</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 w-full md:w-1/6">
                    <label className="text-[11px] font-bold uppercase" style={{ color: '#55423e' }}>Price (₹)</label>
                    <input type="number" min="0" required value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="px-3 py-1.5 text-[14px] rounded-lg bg-white outline-none" style={{ border: '1px solid #dbc1bb', color: '#1c1b1b' }} placeholder="150" />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button type="submit" className="px-4 py-1.5 rounded-lg text-[13px] font-bold hover:opacity-90" style={{ background: '#853423', color: '#fff' }}>Save</button>
                    <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-1.5 rounded-lg text-[13px] font-bold hover:opacity-90" style={{ background: '#e5e2e1', color: '#1c1b1b' }}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Items List */}
              {filteredItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-[#f6f3f2] transition-colors" style={{ borderBottom: idx < filteredItems.length - 1 ? '1px solid #dbc1bb' : 'none' }}>
                  <div className="flex items-center gap-4 flex-1">
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
                    <div className="flex flex-col">
                      <h4 className="text-[15px] font-semibold" style={{ color: '#1c1b1b' }}>{item.name}</h4>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tighter w-fit" style={{ background: '#e5e2e1', color: '#55423e' }}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-[16px] font-bold w-20 text-right" style={{ color: '#853423' }}>₹{item.price}</p>
                    
                    {/* Veg / Non-Veg Toggle Switch */}
                    <div className="flex items-center min-w-[140px] gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={!item.is_veg}
                          onChange={() => toggleVeg(item.id, item.is_veg)}
                        />
                        <div className="w-8 h-4 rounded-full peer transition-all relative" style={{ background: item.is_veg !== false ? '#059669' : '#ba1a1a' }}>
                          <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-3 w-3 transition-all" style={{ transform: item.is_veg !== false ? 'translateX(0)' : 'translateX(16px)' }}></div>
                        </div>
                      </label>
                      <span className="text-[12px] font-bold w-20" style={{ color: item.is_veg !== false ? '#059669' : '#ba1a1a' }}>
                        {item.is_veg !== false ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-[#ffdad6]" 
                        style={{ color: '#55423e' }}
                        title="Delete Item"
                      >
                        <span className="material-symbols-outlined text-[16px] hover:text-[#ba1a1a]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && !isAddingItem && (
                <div className="p-8 text-center text-[14px]" style={{ color: '#55423e' }}>
                  No items found.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
