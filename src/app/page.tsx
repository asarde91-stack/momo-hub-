'use client';

import { useEffect, useState, useCallback } from 'react';
import { db, MenuItem, Order, addOrder, getTodayOrders, initializeDefaultMenu } from '@/lib/db';
import Navigation from '@/components/Navigation';
import { isCloudConfigured, syncAll, getLastSyncTime, startBackgroundSync } from '@/lib/sync';

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');

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
    
    const menuItems = await db.menu_items.toArray();
    const menuItemMap = new Map(menuItems.map(item => [item.id, item]));
    
    const ordersWithNames = orders.map(order => ({
      ...order,
      itemName: menuItemMap.get(order.menu_item_id)?.name || 'Unknown',
      itemPrice: menuItemMap.get(order.menu_item_id)?.price || 0,
    }));
    
    setRecentOrders(ordersWithNames.slice(0, 20));
  }

  async function handleOrderTap(menuItem: MenuItem) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      const order = await addOrder(menuItem.id);
      
      setLastOrder({
        ...order,
        itemName: menuItem.name,
        itemPrice: menuItem.price,
      });
      
      await loadTodayOrders();
      await loadRecentOrders();
      
      setTimeout(() => setLastOrder(null), 3000);
    } catch (error) {
      console.error('Failed to add order:', error);
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
    } catch (error) {
      console.error('Failed to undo order:', error);
    }
  }, [lastOrder]);

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Delete this order?')) {
      try {
        await db.orders.delete(orderId);
        await db.sync_queue.where('record_id').equals(orderId).delete();
        
        await loadTodayOrders();
        await loadRecentOrders();
      } catch (error) {
        console.error('Failed to delete order:', error);
      }
    }
  };

  const getOrderCount = (menuItemId: string) => {
    return recentOrders.filter(o => o.menu_item_id === menuItemId).length;
  };

  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.revenue, 0);
  const totalOrders = todayOrders.reduce((sum, order) => sum + order.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Momo Hub</h1>
            <p className="text-sm opacity-90">Tap to add order</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-75">
              {isCloudConfigured() ? '☁️' : '📱'}
            </span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white/20 px-3 py-2 rounded-lg text-sm"
            >
              {showHistory ? '← Back' : '📋 History'}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white m-4 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Today&apos;s Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalOrders}</div>
            <div className="text-sm text-gray-500">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">₹{totalRevenue}</div>
            <div className="text-sm text-gray-500">Revenue</div>
          </div>
        </div>
      </div>

      {lastOrder && (
        <div className="mx-4 p-3 bg-green-100 text-green-800 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">✓ {lastOrder.itemName} added!</div>
              <div className="text-sm">₹{lastOrder.total_price}</div>
            </div>
            <button
              onClick={handleUndo}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {!showHistory && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">Menu Items</h2>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const count = getOrderCount(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleOrderTap(item)}
                  className="menu-button bg-white hover:bg-gray-50 relative"
                >
                  {count > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md">
                      {count}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {/* Image or Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">
                          {item.category === 'veg' ? '🥬' : '🍗'}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-500">₹{item.price}</div>
                    </div>
                  </div>
                  <div className="text-primary font-bold text-lg">+1</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showHistory && todayOrders.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">Orders by Item</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {todayOrders.map((order) => (
              <div key={order.name} className="p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{order.name}</div>
                  <div className="text-sm text-gray-500">₹{order.revenue}</div>
                </div>
                <div className="bg-primary text-white px-3 py-1 rounded-full font-bold">
                  {order.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showHistory && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No orders yet today</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✓</span>
                    <div>
                      <div className="font-medium">{order.itemName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">₹{order.total_price}</div>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
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
