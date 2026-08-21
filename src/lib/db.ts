import Dexie, { Table } from 'dexie';

// Types
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'veg' | 'non-veg';
  active: boolean;
  image_url?: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
}

export interface Order {
  id: string;
  menu_item_id: string;
  quantity: number;
  total_price: number;
  timestamp: Date;
  synced: boolean;
}

export interface SyncQueue {
  id: string;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  payload: object;
  created_at: Date;
  retry_count: number;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: Date;
}

// Database class
class MomoHubDatabase extends Dexie {
  menu_items!: Table<MenuItem>;
  orders!: Table<Order>;
  sync_queue!: Table<SyncQueue>;
  settings!: Table<Setting>;

  constructor() {
    super('MomoHubDatabase');
    
    this.version(1).stores({
      menu_items: 'id, name, category, active, sort_order, synced',
      orders: 'id, menu_item_id, timestamp, synced',
      sync_queue: 'id, table_name, record_id, action',
      settings: 'key',
    });
  }
}

// Singleton instance
export const db = new MomoHubDatabase();

// Helper functions
export async function addOrder(menuItemId: string, quantity: number = 1): Promise<Order> {
  const menuItem = await db.menu_items.get(menuItemId);
  if (!menuItem) {
    throw new Error('Menu item not found');
  }

  const order: Order = {
    id: crypto.randomUUID(),
    menu_item_id: menuItemId,
    quantity,
    total_price: menuItem.price * quantity,
    timestamp: new Date(),
    synced: false,
  };

  await db.orders.add(order);
  
  // Add to sync queue
  await db.sync_queue.add({
    id: crypto.randomUUID(),
    table_name: 'orders',
    record_id: order.id,
    action: 'create',
    payload: order,
    created_at: new Date(),
    retry_count: 0,
  });

  return order;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  return db.menu_items
    .where('active')
    .equals(1)  // Dexie stores booleans as 1/0
    .sortBy('sort_order');
}

export async function getTodayOrders(): Promise<{ name: string; count: number; revenue: number }[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await db.orders
    .where('timestamp')
    .aboveOrEqual(today)
    .toArray();

  const menuItems = await db.menu_items.toArray();
  const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

  const summary = new Map<string, { count: number; revenue: number }>();

  for (const order of orders) {
    const menuItem = menuItemMap.get(order.menu_item_id);
    if (menuItem) {
      const existing = summary.get(menuItem.name) || { count: 0, revenue: 0 };
      summary.set(menuItem.name, {
        count: existing.count + order.quantity,
        revenue: existing.revenue + order.total_price,
      });
    }
  }

  return Array.from(summary.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
}

export async function initializeDefaultMenu(): Promise<void> {
  const count = await db.menu_items.count();
  if (count === 0) {
    const defaultItems: MenuItem[] = [
      {
        id: crypto.randomUUID(),
        name: 'Crispy Momos',
        price: 80,
        category: 'veg',
        active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
      },
      {
        id: crypto.randomUUID(),
        name: 'Peri-Peri Momos',
        price: 90,
        category: 'veg',
        active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
      },
      {
        id: crypto.randomUUID(),
        name: 'Steam Momos',
        price: 70,
        category: 'veg',
        active: true,
        sort_order: 3,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
      },
      {
        id: crypto.randomUUID(),
        name: 'Non-Veg Steam',
        price: 100,
        category: 'non-veg',
        active: true,
        sort_order: 4,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
      },
      {
        id: crypto.randomUUID(),
        name: 'Fried Momos',
        price: 85,
        category: 'veg',
        active: true,
        sort_order: 5,
        created_at: new Date(),
        updated_at: new Date(),
        synced: false,
      },
    ];

    await db.menu_items.bulkAdd(defaultItems);
  }
}
