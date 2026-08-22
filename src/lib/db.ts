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
  section?: string;
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

    this.version(2).stores({
      menu_items: 'id, name, category, active, sort_order, synced, section',
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

const MENU_VERSION = 2; // Bump this to force-replace default menu

function buildDefaultMenuItems(): MenuItem[] {
  const now = new Date();
  return [
    // === Momos ===
    { id: crypto.randomUUID(), name: 'Steamed Momos', price: 80, category: 'veg', active: true, sort_order: 1, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Steamed Momos', price: 90, category: 'non-veg', active: true, sort_order: 2, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Cry Momos', price: 90, category: 'veg', active: true, sort_order: 3, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Cry Momos', price: 100, category: 'non-veg', active: true, sort_order: 4, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Peri Peri Momos', price: 100, category: 'veg', active: true, sort_order: 5, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Peri Peri Momos', price: 110, category: 'non-veg', active: true, sort_order: 6, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Tandoor Momos', price: 110, category: 'veg', active: true, sort_order: 7, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Tandoor Momos', price: 120, category: 'non-veg', active: true, sort_order: 8, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Crispy Momos', price: 120, category: 'veg', active: true, sort_order: 9, section: 'momos', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Crispy Momos', price: 130, category: 'non-veg', active: true, sort_order: 10, section: 'momos', created_at: now, updated_at: now, synced: false },
    // === Maggi ===
    { id: crypto.randomUUID(), name: 'Plain Maggi', price: 40, category: 'veg', active: true, sort_order: 11, section: 'maggi', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Masala Maggi', price: 50, category: 'veg', active: true, sort_order: 12, section: 'maggi', created_at: now, updated_at: now, synced: false },
    { id: crypto.randomUUID(), name: 'Momo Maggi', price: 80, category: 'veg', active: true, sort_order: 13, section: 'maggi', created_at: now, updated_at: now, synced: false },
  ];
}

export async function initializeDefaultMenu(): Promise<void> {
  // Check stored menu version
  const storedVersion = await db.settings.get('menu_version');
  const currentVersion = storedVersion ? parseInt(storedVersion.value, 10) : 0;

  if (currentVersion < MENU_VERSION) {
    // Clear old menu and replace with current defaults
    await db.menu_items.clear();
    const defaultItems = buildDefaultMenuItems();
    await db.menu_items.bulkAdd(defaultItems);
    await db.settings.put({ key: 'menu_version', value: String(MENU_VERSION), updated_at: new Date() });
  } else if ((await db.menu_items.count()) === 0) {
    // Fresh install — no items at all
    const defaultItems = buildDefaultMenuItems();
    await db.menu_items.bulkAdd(defaultItems);
    await db.settings.put({ key: 'menu_version', value: String(MENU_VERSION), updated_at: new Date() });
  }
}
