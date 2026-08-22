'use client';

import { useEffect, useState, useRef } from 'react';
import { db, MenuItem } from '@/lib/db';
import Navigation from '@/components/Navigation';
import Logo from '@/components/Logo';
import Pattern from '@/components/Pattern';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'veg' as 'veg' | 'non-veg',
    image: '',
    section: 'momos' as string,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    loadMenuItems();
  }, []);

  async function loadMenuItems() {
    const items = await db.menu_items.orderBy('sort_order').toArray();
    setMenuItems(items);
    setLoading(false);
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }

  function getFilteredItems() {
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }

  async function handleAddItem() {
    if (!formData.name || !formData.price) return;

    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      active: true,
      image_url: formData.image || undefined,
      sort_order: menuItems.length + 1,
      section: formData.section || undefined,
      created_at: new Date(),
      updated_at: new Date(),
      synced: false,
    };

    await db.menu_items.add(newItem);
    resetForm();
    await loadMenuItems();
    showToast(`${formData.name} added to menu`);
  }

  async function handleUpdateItem() {
    if (!editingItem || !formData.name || !formData.price) return;

    await db.menu_items.update(editingItem.id, {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: formData.image || editingItem.image_url,
      updated_at: new Date(),
      synced: false,
    });

    resetForm();
    await loadMenuItems();
    showToast('Item updated');
  }

  async function handleDeleteItem(id: string) {
    await db.menu_items.delete(id);
    await loadMenuItems();
    showToast('Item deleted', 'info');
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    await db.menu_items.update(id, {
      active: !currentActive,
      updated_at: new Date(),
      synced: false,
    });
    await loadMenuItems();
  }

  async function handleMoveUp(item: MenuItem) {
    if (item.sort_order <= 1) return;
    const prevItem = menuItems.find(i => i.sort_order === item.sort_order - 1);
    if (prevItem) {
      await db.menu_items.update(item.id, { sort_order: item.sort_order - 1, synced: false });
      await db.menu_items.update(prevItem.id, { sort_order: prevItem.sort_order + 1, synced: false });
      await loadMenuItems();
    }
  }

  async function handleMoveDown(item: MenuItem) {
    const maxSort = Math.max(...menuItems.map(i => i.sort_order));
    if (item.sort_order >= maxSort) return;
    const nextItem = menuItems.find(i => i.sort_order === item.sort_order + 1);
    if (nextItem) {
      await db.menu_items.update(item.id, { sort_order: item.sort_order + 1, synced: false });
      await db.menu_items.update(nextItem.id, { sort_order: nextItem.sort_order - 1, synced: false });
      await loadMenuItems();
    }
  }

  function startEditing(item: MenuItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image_url || '',
      section: item.section || 'momos',
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setEditingItem(null);
    setFormData({ name: '', price: '', category: 'veg', image: '', section: 'momos' });
    setShowAddForm(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, image: base64 });
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="pb-20 page-enter">
        <div className="header-charcoal text-cream p-5 pb-8 relative">
          <div className="skeleton h-7 w-40" style={{ background: 'rgba(245,235,221,0.1)' }} />
          <div className="skeleton h-4 w-32 mt-2" style={{ background: 'rgba(245,235,221,0.1)' }} />
        </div>
        <div className="m-4 -mt-4 space-y-3 relative z-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();
  const activeCount = menuItems.filter(i => i.active).length;
  const totalCount = menuItems.length;

  return (
    <div className="pb-20 page-enter">
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Item"
          message="This will permanently remove this item from your menu. Orders using this item won't be affected."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            handleDeleteItem(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <header className="header-charcoal p-5 pb-8 relative momo-fold-bg">
        <Pattern variant="background" color="#C94F32" className="opacity-[0.06]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Logo size="sm" variant="light" />
            <div>
              <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--cream)' }}>Menu</h1>
              <p className="text-xs" style={{ color: 'var(--sand)' }}>{activeCount} active · {totalCount} total</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none">
            <path d="M0 12 L20 0 L40 12 L60 0 L80 12 L100 0 L120 12 L140 0 L160 12 L180 0 L200 12 L220 0 L240 12 L260 0 L280 12 L300 0 L320 12 L340 0 L360 12 L380 0 L400 12" 
              fill="var(--cream)" />
          </svg>
        </div>
      </header>

      <div className="-mt-1 relative z-10">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mx-4 p-5 card-elevated fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base" style={{ color: 'var(--charcoal)' }}>
                {editingItem ? '✏️ Edit Item' : '✨ Add New Item'}
              </h3>
              <button onClick={resetForm} className="text-xl p-1 active:scale-90 transition-transform"
                style={{ color: 'var(--sand)' }}>✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div 
                  className="image-container w-20 h-20 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📷</span>
                  )}
                </div>
                <div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold active:scale-95 transition-transform"
                    style={{ color: 'var(--terracotta)' }}>Upload Photo</button>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sand)' }}>Tap to add image</p>
                </div>
              </div>

              <input type="text" placeholder="Item name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              <input type="number" placeholder="Price (₹)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" />
              <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="input-field">
                <option value="momos">🥟 Momos</option>
                <option value="maggi">🍜 Maggi</option>
              </select>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as 'veg' | 'non-veg' })} className="input-field">
                <option value="veg">🥘 Vegetarian</option>
                <option value="non-veg">🥘 Non-Vegetarian</option>
              </select>
              <div className="pt-1">
                <button onClick={editingItem ? handleUpdateItem : handleAddItem} className="btn-primary">
                  {editingItem ? 'Update Item' : 'Add to Menu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Button */}
        {!showAddForm && (
          <div className="mx-4 mb-3 mt-4">
            <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center justify-center gap-2">
              <span className="text-lg">+</span>
              Add New Item
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mx-4 flex gap-2 mb-4">
          {(['all', 'veg', 'non-veg'] as const).map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}>
              {cat === 'all' ? '🍽️ All' : cat === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
            </button>
          ))}
        </div>

        {/* Menu Items grouped by section */}
        <div className="px-4">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3 className="font-heading font-semibold text-lg mb-1" style={{ color: 'var(--charcoal)' }}>No items here</h3>
              <p className="text-sm" style={{ color: 'var(--sand)' }}>
                {activeCategory === 'all' ? 'Add your first menu item to get started' : `No ${activeCategory} items yet`}
              </p>
            </div>
          ) : (
            (() => {
              const sections: { key: string; label: string; icon: string }[] = [
                { key: 'momos', label: 'MOMOS', icon: '🥟' },
                { key: 'maggi', label: 'MAGGI', icon: '🍜' },
              ];
              const uncategorized = filteredItems.filter(i => !i.section || !sections.some(s => s.key === i.section));

              return (
                <div className="space-y-5">
                  {sections.map(section => {
                    const items = filteredItems.filter(i => i.section === section.key);
                    if (items.length === 0) return null;
                    return (
                      <div key={section.key}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-lg">{section.icon}</span>
                          <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--charcoal)' }}>{section.label}</h3>
                          <div className="flex-1 h-px" style={{ background: 'rgba(219, 185, 138, 0.3)' }} />
                        </div>
                        <div className="space-y-2.5">
                          {items.map((item, index) => (
                            <div key={item.id} className={`list-item stagger-item ${!item.active ? 'opacity-50' : ''}`}
                              style={{ animationDelay: `${index * 0.04}s` }}>
                              <div className="flex items-start gap-3">
                                <div className={`image-container w-14 h-14 flex-shrink-0 ${item.category === 'non-veg' ? 'ring-2 ring-red-100' : 'ring-2 ring-green-100'}`}>
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl">{section.icon}</span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-semibold text-sm">{item.name}</div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: item.category === 'veg' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: item.category === 'veg' ? '#16a34a' : '#dc2626' }}>
                                          {item.category === 'veg' ? 'Veg' : 'Chicken'}
                                        </span>
                                        <div className="text-lg font-bold font-heading" style={{ color: 'var(--terracotta)' }}>₹{item.price}</div>
                                      </div>
                                    </div>
                                    <button onClick={() => handleToggleActive(item.id, item.active)}
                                      className={item.active ? 'badge-active' : 'badge-inactive'}>
                                      {item.active ? 'Active' : 'Off'}
                                    </button>
                                  </div>

                                  <div className="flex gap-1.5 mt-3">
                                    <button onClick={() => handleMoveUp(item)} disabled={item.sort_order <= 1}
                                      className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                      style={{ background: 'rgba(219, 185, 138, 0.15)' }}>⬆️</button>
                                    <button onClick={() => handleMoveDown(item)}
                                      className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                      style={{ background: 'rgba(219, 185, 138, 0.15)' }}>⬇️</button>
                                    <button onClick={() => startEditing(item)}
                                      className="flex-1 p-2 rounded-lg text-sm font-medium active:scale-95 transition-all"
                                      style={{ background: 'rgba(201, 79, 50, 0.08)', color: 'var(--terracotta)' }}>✏️ Edit</button>
                                    <button onClick={() => setDeleteTarget(item.id)}
                                      className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                      style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>🗑️</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {uncategorized.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-lg">🍽️</span>
                        <h3 className="font-heading font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--charcoal)' }}>OTHER</h3>
                        <div className="flex-1 h-px" style={{ background: 'rgba(219, 185, 138, 0.3)' }} />
                      </div>
                      <div className="space-y-2.5">
                        {uncategorized.map((item, index) => (
                          <div key={item.id} className={`list-item stagger-item ${!item.active ? 'opacity-50' : ''}`}
                            style={{ animationDelay: `${index * 0.04}s` }}>
                            <div className="flex items-start gap-3">
                              <div className={`image-container w-14 h-14 flex-shrink-0 ${item.category === 'non-veg' ? 'ring-2 ring-red-100' : 'ring-2 ring-green-100'}`}>
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-2xl">🍽️</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-sm">{item.name}</div>
                                    <div className="text-lg font-bold font-heading mt-0.5" style={{ color: 'var(--terracotta)' }}>₹{item.price}</div>
                                  </div>
                                  <button onClick={() => handleToggleActive(item.id, item.active)}
                                    className={item.active ? 'badge-active' : 'badge-inactive'}>
                                    {item.active ? 'Active' : 'Off'}
                                  </button>
                                </div>
                                <div className="flex gap-1.5 mt-3">
                                  <button onClick={() => handleMoveUp(item)} disabled={item.sort_order <= 1}
                                    className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                    style={{ background: 'rgba(219, 185, 138, 0.15)' }}>⬆️</button>
                                  <button onClick={() => handleMoveDown(item)}
                                    className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                    style={{ background: 'rgba(219, 185, 138, 0.15)' }}>⬇️</button>
                                  <button onClick={() => startEditing(item)}
                                    className="flex-1 p-2 rounded-lg text-sm font-medium active:scale-95 transition-all"
                                    style={{ background: 'rgba(201, 79, 50, 0.08)', color: 'var(--terracotta)' }}>✏️ Edit</button>
                                  <button onClick={() => setDeleteTarget(item.id)}
                                    className="p-2 rounded-lg text-sm active:scale-90 transition-all"
                                    style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>🗑️</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
