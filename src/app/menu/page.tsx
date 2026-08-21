'use client';

import { useEffect, useState, useRef } from 'react';
import { db, MenuItem } from '@/lib/db';
import Navigation from '@/components/Navigation';

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
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  async function loadMenuItems() {
    const items = await db.menu_items.orderBy('sort_order').toArray();
    setMenuItems(items);
    setLoading(false);
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
      created_at: new Date(),
      updated_at: new Date(),
      synced: false,
    };

    await db.menu_items.add(newItem);
    resetForm();
    await loadMenuItems();
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
  }

  async function handleDeleteItem(id: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      await db.menu_items.delete(id);
      await loadMenuItems();
    }
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
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setEditingItem(null);
    setFormData({ name: '', price: '', category: 'veg', image: '' });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="pb-20">
      <header className="bg-primary text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-sm opacity-90">Add, edit, or remove items</p>
      </header>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="m-4 p-4 bg-white rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <div className="space-y-3">
            {/* Image Upload */}
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📷</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary font-medium"
                >
                  Upload Photo
                </button>
                <p className="text-xs text-gray-500">Tap to add image</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Item name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'veg' | 'non-veg' })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="veg">Vegetarian 🥬</option>
              <option value="non-veg">Non-Vegetarian 🍗</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold"
              >
                {editingItem ? 'Update' : 'Add Item'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <div className="m-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
          >
            + Add New Item
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="mx-4 flex gap-2 mb-4">
        {(['all', 'veg', 'non-veg'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm capitalize ${
              activeCategory === cat
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {cat === 'all' ? '🍽️ All' : cat === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
          </button>
        ))}
      </div>

      {/* Menu Items List */}
      <div className="p-4">
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No items in this category
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white p-4 rounded-xl shadow-sm ${
                  !item.active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Image or Icon */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">
                        {item.category === 'veg' ? '🥬' : '🍗'}
                      </span>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-lg font-bold text-primary">₹{item.price}</div>
                        <div className="text-xs text-gray-400 capitalize">{item.category}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleActive(item.id, item.active)}
                          className={`px-2 py-1 rounded text-xs ${
                            item.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.active ? 'Active' : 'Off'}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleMoveUp(item)}
                        className="p-2 bg-gray-100 rounded text-sm"
                        disabled={item.sort_order <= 1}
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => handleMoveDown(item)}
                        className="p-2 bg-gray-100 rounded text-sm"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => startEditing(item)}
                        className="flex-1 p-2 bg-blue-100 text-blue-700 rounded text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-red-100 text-red-700 rounded text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
