'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import Navigation from '@/components/Navigation';
import { isCloudConfigured, syncAll, getLastSyncTime, SyncResult } from '@/lib/sync';

export default function SettingsPage() {
  const [shopName, setShopName] = useState('Momo Hub');
  const [taxRate, setTaxRate] = useState('0');
  const [saved, setSaved] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    loadSettings();
    setCloudConfigured(isCloudConfigured());
    setLastSync(getLastSyncTime());
  }, []);

  async function loadSettings() {
    const nameSetting = await db.settings.get('shop_name');
    const taxSetting = await db.settings.get('tax_rate');
    
    if (nameSetting) setShopName(nameSetting.value);
    if (taxSetting) setTaxRate(taxSetting.value);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAll();
      setSyncResult(result);
      setLastSync(getLastSyncTime());
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    await db.settings.put({
      key: 'shop_name',
      value: shopName,
      updated_at: new Date(),
    });
    
    await db.settings.put({
      key: 'tax_rate',
      value: taxRate,
      updated_at: new Date(),
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to clear all order data? This cannot be undone.')) {
      await db.orders.clear();
      await db.sync_queue.clear();
      alert('Order data cleared!');
    }
  }

  return (
    <div className="pb-20">
      <header className="bg-primary text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-90">Configure your shop</p>
      </header>

      <div className="p-4 space-y-4">
        {/* Shop Name */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop Name
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Tax Rate */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full p-3 border rounded-lg"
            min="0"
            max="100"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* Cloud Sync */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">☁️ Cloud Sync</h3>
          
          {!cloudConfigured ? (
            <div className="text-sm text-gray-500">
              <p className="mb-2">Cloud sync is not configured yet.</p>
              <p>To enable sync, add your Supabase credentials to <code className="bg-gray-100 px-1 rounded">.env.local</code></p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">✓ Connected to cloud</span>
                {lastSync && (
                  <span className="text-gray-500">
                    Last sync: {lastSync.toLocaleTimeString('en-IN')}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium disabled:bg-gray-300"
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
              </button>
              
              {syncResult && (
                <div className={`text-sm p-2 rounded ${syncResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {syncResult.success ? (
                    <>
                      ✓ Synced! Orders: +{syncResult.ordersPushed}, Menu pulled: {syncResult.menuPulled}, Menu pushed: {syncResult.menuPushed}
                    </>
                  ) : (
                    <>
                      ✗ Sync failed: {syncResult.error}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear Data */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-3">
            Clear all order data. This action cannot be undone.
          </p>
          <button
            onClick={handleClearData}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold"
          >
            Clear Order Data
          </button>
        </div>

        {/* App Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm text-center text-sm text-gray-500">
          <p>Momo Hub v1.0.0</p>
          <p className="mt-1">Made with ❤️ for Momo Shops</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
