'use client';

import { useEffect, useState, useCallback } from 'react';
import { db, MenuItem, Order, addOrder, getTodayOrders, initializeDefaultMenu } from '@/lib/db';
import Navigation from '@/components/Navigation';
import Logo from '@/components/Logo';
import Pattern from '@/components/Pattern';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { isCloudConfigured, startBackgroundSync } from '@/lib/sync';

interface OrderWithItem extends Order {
  itemName?: string;
  itemPrice?: number;
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [todayOrders, setTodayOrders] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastOrder, setLastOrder] = useState<OrderWithItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info'; action?: { label: string; onClick: () => void } }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase();
    if (isCloudConfigured()) {
      startBackgroundSync();
    }
  }, []);

  async function initializeDatabase() {
    try {
      await initializeDefaultMenu();
      await loadMenuItems();
      await loadTodayOrders();
      await loadRecentOrders();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMenuItems() {
    const items = await db.menu_items.toArray();
    setMenuItems(items.filter(item => item.active));
  }

  async function loadTodayOrders() {
    const orders = await getTodayOrders();
    setTodayOrders(orders);
  }

  async function loadRecentOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await db.orders
      .where('timestamp')
      .aboveOrEqual(today)
      .reverse()
      .sortBy('timestamp');
    
    const menuItemsArr = await db.menu_items.toArray();
    const menuItemMap = new Map(menuItemsArr.map(item => [item.id, item]));
    
    const ordersWithNames = orders.map(order => ({
      ...order,
      itemName: menuItemMap.get(order.menu_item_id)?.name || 'Unknown',
      itemPrice: menuItemMap.get(order.menu_item_id)?.price || 0,
    }));
    
    setRecentOrders(ordersWithNames.slice(0, 20));
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', action?: { label: string; onClick: () => void }) {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, action }]);
  }

  function removeToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  async function handleOrderTap(menuItem: MenuItem) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      
      const order = await addOrder(menuItem.id);
      
      setLastOrder({
        ...order,
        itemName: menuItem.name,
        itemPrice: menuItem.price,
      });
      
      await loadTodayOrders();
      await loadRecentOrders();
      
      showToast(`${menuItem.name} added`, 'success', {
        label: 'Undo',
        onClick: () => handleUndoFromToast(order),
      });
      
      setTimeout(() => setLastOrder(null), 4000);
    } catch (error) {
      console.error('Failed to add order:', error);
      showToast('Failed to add order', 'error');
    }
  }

  const handleUndo = useCallback(async () => {
    if (!lastOrder) return;
    
    try {
      await db.orders.delete(lastOrder.id);
      await db.sync_queue.where('record_id').equals(lastOrder.id).delete();
      
      setLastOrder(null);
      await loadTodayOrders();
      await loadRecentOrders();
      showToast('Order removed', 'info');
    } catch (error) {
      console.error('Failed to undo order:', error);
      showToast('Failed to undo', 'error');
    }
  }, [lastOrder]);

  async function handleUndoFromToast(order: OrderWithItem) {
    try {
      await db.orders.delete(order.id);
      await db.sync_queue.where('record_id').equals(order.id).delete();
      setLastOrder(null);
      await loadTodayOrders();
      await loadRecentOrders();
    } catch (error) {
      console.error('Failed to undo order:', error);
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await db.orders.delete(orderId);
      await db.sync_queue.where('record_id').equals(orderId).delete();
      await loadTodayOrders();
      await loadRecentOrders();
      showToast('Order deleted', 'info');
    } catch (error) {
      console.error('Failed to delete order:', error);
      showToast('Failed to delete', 'error');
    }
  };

  const getOrderCount = (menuItemId: string) => {
    return recentOrders.filter(o => o.menu_item_id === menuItemId).length;
  };

  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.revenue, 0);
  const totalOrders = todayOrders.reduce((sum, order) => sum + order.count, 0);

  // Skeleton loading
  if (loading) {
    return (
      <div className="pb-20 page-enter">
        <div className="header-charcoal text-cream p-5 pb-8 relative">
          <div className="skeleton h-7 w-32 mb-2" style={{ background: 'rgba(245,235,221,0.1)' }} />
          <div className="skeleton h-4 w-24" style={{ background: 'rgba(245,235,221,0.1)' }} />
        </div>
        <div className="m-4 -mt-4 space-y-4 relative z-10">
          <div className="skeleton-stat skeleton" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 page-enter">
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Order"
          message="Are you sure you want to delete this order? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            handleDeleteOrder(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ===== HEADER — Dark Charcoal with Momo Fold Pattern ===== */}
      <header className="header-charcoal p-5 pb-8 relative momo-fold-bg">
        <Pattern variant="background" color="#C94F32" className="opacity-[0.06]" />
        
        <div className="relative z-10">
          {/* Top bar — status + history */}
          <div className="flex justify-end items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60">
                {isCloudConfigured() ? '☁️' : '📱'}
              </span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all"
                style={{ color: 'var(--cream)' }}
              >
                {showHistory ? '← Back' : '📋 History'}
              </button>
            </div>
          </div>

          {/* Centered Logo + Wordmark + Tagline */}
          <div className="flex justify-center">
            <Logo size="full" variant="light" showTagline />
          </div>
        </div>

        {/* Decorative fold pleats at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none">
            <path d="M0 12 L20 0 L40 12 L60 0 L80 12 L100 0 L120 12 L140 0 L160 12 L180 0 L200 12 L220 0 L240 12 L260 0 L280 12 L300 0 L320 12 L340 0 L360 12 L380 0 L400 12" 
              fill="var(--cream)" />
          </svg>
        </div>
      </header>

      {/* ===== TODAY'S SUMMARY ===== */}
      <div className="mx-4 -mt-1 relative z-10">
        <div className="card-elevated">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--sand)' }}>
            Today&apos;s Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="stat-number text-terracotta">{totalOrders}</div>
              <div className="stat-label">Orders</div>
            </div>
            <div className="text-center">
              <div className="stat-number" style={{ color: '#16a34a' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== UNDO BANNER ===== */}
      {lastOrder && (
        <div className="mx-4 mt-4 p-3.5 rounded-2xl flex justify-between items-center fade-in"
          style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}>✓</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#15803d' }}>{lastOrder.itemName} added</div>
              <div className="text-xs" style={{ color: '#16a34a' }}>₹{lastOrder.total_price}</div>
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="btn-secondary !py-2 !px-4 !w-auto !text-xs !font-bold"
            style={{ color: '#dc2626' }}
          >
            Undo
          </button>
        </div>
      )}

      {/* ===== QUICK ADD MENU ===== */}
      {!showHistory && (
        <div className="p-4 mt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--sand)' }}>
            Quick Add
          </h2>
          {(() => {
            const sections: { key: string; label: string; icon: string }[] = [
              { key: 'momos', label: 'Momos', icon: '🥟' },
              { key: 'maggi', label: 'Maggi', icon: '🍜' },
            ];
            return (
              <div className="space-y-5">
                {sections.map(section => {
                  const items = menuItems.filter(i => i.section === section.key);
                  if (items.length === 0) return null;
                  return (
                    <div key={section.key}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-base">{section.icon}</span>
                        <h3 className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--charcoal)' }}>{section.label}</h3>
                        <div className="flex-1 h-px" style={{ background: 'rgba(219, 185, 138, 0.3)' }} />
                      </div>
                      <div className="space-y-2.5">
                        {items.map((item, index) => {
                          const count = getOrderCount(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleOrderTap(item)}
                              className={`menu-button ${item.category} stagger-item`}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              {count > 0 && (
                                <div className="count-badge" key={`badge-${item.id}-${count}`}>
                                  {count}
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className="image-container w-11 h-11 flex-shrink-0">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xl">{section.icon}</span>
                                  )}
                                </div>
                                <div className="text-left">
                                  <div className="font-semibold text-sm">{item.name}</div>
                                  <div className="text-xs font-medium" style={{ color: 'var(--sand)' }}>₹{item.price} · {item.category === 'veg' ? 'Veg' : 'Chicken'}</div>
                                </div>
                              </div>
                              <span className="font-bold text-base" style={{ color: 'var(--terracotta)', opacity: 0.5 }}>+1</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Uncategorized items */}
                {menuItems.filter(i => !i.section || !sections.some(s => s.key === i.section)).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-base">🍽️</span>
                      <h3 className="font-heading font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--charcoal)' }}>Other</h3>
                      <div className="flex-1 h-px" style={{ background: 'rgba(219, 185, 138, 0.3)' }} />
                    </div>
                    <div className="space-y-2.5">
                      {menuItems.filter(i => !i.section || !sections.some(s => s.key === i.section)).map((item, index) => {
                        const count = getOrderCount(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleOrderTap(item)}
                            className={`menu-button ${item.category} stagger-item`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            {count > 0 && (
                              <div className="count-badge" key={`badge-${item.id}-${count}`}>
                                {count}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <div className="image-container w-11 h-11 flex-shrink-0">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xl">🍽️</span>
                                )}
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-sm">{item.name}</div>
                                <div className="text-xs font-medium" style={{ color: 'var(--sand)' }}>₹{item.price}</div>
                              </div>
                            </div>
                            <span className="font-bold text-base" style={{ color: 'var(--terracotta)', opacity: 0.5 }}>+1</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== RUNNING TOTAL ===== */}
      {!showHistory && todayOrders.length > 0 && (
        <div className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--sand)' }}>
            Running Total
          </h2>
          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <div className="divide-y" style={{ borderColor: 'rgba(219, 185, 138, 0.15)' }}>
              {todayOrders.map((order) => (
                <div key={order.name} className="p-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--terracotta)' }} />
                    <div>
                      <div className="font-medium text-sm">{order.name}</div>
                      <div className="text-xs" style={{ color: 'var(--sand)' }}>₹{order.revenue}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full font-bold text-sm"
                    style={{ background: 'rgba(201, 79, 50, 0.1)', color: 'var(--terracotta)' }}>
                    {order.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!showHistory && todayOrders.length === 0 && (
        <div className="p-4">
          <div className="empty-state">
            <div className="empty-state-icon">🥟</div>
            <h3 className="font-heading font-semibold text-lg mb-1" style={{ color: 'var(--charcoal)' }}>No orders yet</h3>
            <p className="text-sm" style={{ color: 'var(--sand)' }}>Tap a menu item above to start</p>
          </div>
        </div>
      )}

      {/* ===== ORDER HISTORY ===== */}
      {showHistory && (
        <div className="p-4 mt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--sand)' }}>
            Today&apos;s Orders
          </h2>
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3 className="font-heading font-semibold text-lg mb-1" style={{ color: 'var(--charcoal)' }}>No orders today</h3>
              <p className="text-sm" style={{ color: 'var(--sand)' }}>Orders will appear here once placed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="list-item stagger-item"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>✓</span>
                      <div>
                        <div className="font-medium text-sm">{order.itemName}</div>
                        <div className="text-xs" style={{ color: 'var(--sand)' }}>
                          {new Date(order.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-sm">₹{order.total_price}</div>
                      <button
                        onClick={() => setConfirmDelete(order.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                        style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Navigation />
    </div>
  );
}
