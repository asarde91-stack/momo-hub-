import { db, MenuItem, Order } from './db';
import { getSupabase, CloudMenuItem, CloudOrder } from './supabase';

const DEVICE_ID_KEY = 'momo-hub-device-id';
const LAST_SYNC_KEY = 'momo-hub-last-sync';

// Generate or retrieve device ID
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Check if Supabase is configured
export function isCloudConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('your-project'));
}

// Get last sync time
export function getLastSyncTime(): Date | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? new Date(stored) : null;
}

// Set last sync time
function setLastSyncTime(date: Date): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
}

// Push unsynced orders to cloud
async function pushOrders(): Promise<number> {
  const unsyncedOrders = await db.orders.where('synced').equals(0).toArray();
  
  if (unsyncedOrders.length === 0) return 0;

  const cloudOrders: CloudOrder[] = unsyncedOrders.map(order => ({
    id: order.id,
    menu_item_id: order.menu_item_id,
    quantity: order.quantity,
    total_price: order.total_price,
    timestamp: order.timestamp.toISOString(),
    device_id: getDeviceId(),
    created_at: new Date().toISOString(),
  }));

  const { error } = await getSupabase()
    .from('orders')
    .upsert(cloudOrders, { onConflict: 'id' });

  if (error) {
    console.error('Failed to push orders:', error);
    return 0;
  }

  // Mark as synced locally
  const orderIds = unsyncedOrders.map(o => o.id);
  await db.orders.where('id').anyOf(orderIds).modify({ synced: true });

  return unsyncedOrders.length;
}

// Pull menu items from cloud
async function pullMenuItems(): Promise<number> {
  const { data: cloudMenu, error } = await getSupabase()
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Failed to pull menu items:', error);
    return 0;
  }

  if (!cloudMenu || cloudMenu.length === 0) return 0;

  // Get local items for comparison
  const localItems = await db.menu_items.toArray();
  const localMap = new Map(localItems.map(item => [item.id, item]));

  let updatedCount = 0;

  for (const cloudItem of cloudMenu) {
    const localItem = localMap.get(cloudItem.id);
    
    if (!localItem) {
      // New item from cloud — add locally
      await db.menu_items.add({
        id: cloudItem.id,
        name: cloudItem.name,
        price: cloudItem.price,
        category: cloudItem.category,
        active: cloudItem.active,
        image_url: cloudItem.image_url || undefined,
        sort_order: cloudItem.sort_order,
        created_at: new Date(cloudItem.created_at),
        updated_at: new Date(cloudItem.updated_at),
        synced: true,
      });
      updatedCount++;
    } else if (new Date(cloudItem.updated_at) > localItem.updated_at) {
      // Cloud is newer — update local
      await db.menu_items.update(cloudItem.id, {
        name: cloudItem.name,
        price: cloudItem.price,
        category: cloudItem.category,
        active: cloudItem.active,
        image_url: cloudItem.image_url || undefined,
        sort_order: cloudItem.sort_order,
        updated_at: new Date(cloudItem.updated_at),
        synced: true,
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

// Push local menu changes to cloud
async function pushMenuChanges(): Promise<number> {
  const unsyncedItems = await db.menu_items.where('synced').equals(0).toArray();
  
  if (unsyncedItems.length === 0) return 0;

  const cloudItems = unsyncedItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    active: item.active,
    image_url: item.image_url || null,
    sort_order: item.sort_order,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  }));

  const { error } = await getSupabase()
    .from('menu_items')
    .upsert(cloudItems, { onConflict: 'id' });

  if (error) {
    console.error('Failed to push menu changes:', error);
    return 0;
  }

  // Mark as synced
  const itemIds = unsyncedItems.map(i => i.id);
  await db.menu_items.where('id').anyOf(itemIds).modify({ synced: true });

  return unsyncedItems.length;
}

// Full sync orchestrator
export interface SyncResult {
  success: boolean;
  ordersPushed: number;
  menuPulled: number;
  menuPushed: number;
  error?: string;
}

export async function syncAll(): Promise<SyncResult> {
  if (!isCloudConfigured()) {
    return { success: false, ordersPushed: 0, menuPulled: 0, menuPushed: 0, error: 'Cloud not configured' };
  }

  try {
    const [ordersPushed, menuPulled, menuPushed] = await Promise.all([
      pushOrders(),
      pullMenuItems(),
      pushMenuChanges(),
    ]);

    setLastSyncTime(new Date());

    return { success: true, ordersPushed, menuPulled, menuPushed };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      ordersPushed: 0,
      menuPulled: 0,
      menuPushed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Initialize sync on app load
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startBackgroundSync(): void {
  if (typeof window === 'undefined' || !isCloudConfigured()) return;
  
  // Sync immediately on load
  syncAll().catch(console.error);

  // Sync every 60 seconds
  syncInterval = setInterval(() => {
    syncAll().catch(console.error);
  }, 60 * 1000);

  // Sync on network recovery
  window.addEventListener('online', () => {
    syncAll().catch(console.error);
  });
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// Seed cloud with default menu (for first-time setup)
export async function seedCloudMenu(): Promise<void> {
  const localItems = await db.menu_items.toArray();
  
  const cloudItems = localItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    active: item.active,
    image_url: item.image_url || null,
    sort_order: item.sort_order,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  }));

  await getSupabase().from('menu_items').upsert(cloudItems, { onConflict: 'id' });
}
