'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import Navigation from '@/components/Navigation';
import Logo from '@/components/Logo';
import Pattern from '@/components/Pattern';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { isCloudConfigured, syncAll, getLastSyncTime, SyncResult } from '@/lib/sync';

export default function SettingsPage() {
  const [shopName, setShopName] = useState('Momo Hub');
  const [taxRate, setTaxRate] = useState('0');
  const [saved, setSaved] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

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

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAll();
      setSyncResult(result);
      setLastSync(getLastSyncTime());
      if (result.success) {
        showToast(`Synced! ${result.ordersPushed} orders pushed`);
      } else {
        showToast(`Sync failed: ${result.error}`, 'error');
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    await db.settings.put({ key: 'shop_name', value: shopName, updated_at: new Date() });
    await db.settings.put({ key: 'tax_rate', value: taxRate, updated_at: new Date() });
    setSaved(true);
    showToast('Settings saved');
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearData() {
    await db.orders.clear();
    await db.sync_queue.clear();
    showToast('Order data cleared', 'info');
  }

  return (
    <div className="pb-20 page-enter">
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}

      {/* Clear data confirmation */}
      {showClearConfirm && (
        <ConfirmModal
          title="Clear Order Data"
          message="This will permanently delete all order data. This action cannot be undone."
          confirmLabel="Clear Data"
          variant="danger"
          onConfirm={() => { handleClearData(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {/* ===== HEADER ===== */}
      <header className="header-charcoal p-5 pb-8 relative momo-fold-bg">
        <Pattern variant="background" color="#C94F32" className="opacity-[0.06]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Logo size="sm" variant="light" />
            <div>
              <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--cream)' }}>Settings</h1>
              <p className="text-xs" style={{ color: 'var(--sand)' }}>Configure your shop</p>
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

      <div className="p-4 space-y-4 -mt-1 relative z-10">
        {/* Shop Name */}
        <div className="card-elevated fade-in">
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--sand)' }}>
            Shop Name
          </label>
          <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="input-field" />
        </div>

        {/* Tax Rate */}
        <div className="card-elevated fade-in" style={{ animationDelay: '0.05s' }}>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--sand)' }}>
            Tax Rate (%)
          </label>
          <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="input-field" min="0" max="100" />
        </div>

        {/* Save Button */}
        <button onClick={handleSave}
          className={`btn-primary transition-all duration-300 ${saved ? '!bg-green-500' : ''}`}
          style={saved ? { boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)' } : {}}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        {/* Cloud Sync */}
        <div className="card-elevated fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">☁️</span>
            <h3 className="font-heading font-bold text-sm" style={{ color: 'var(--charcoal)' }}>Cloud Sync</h3>
          </div>
          
          {!cloudConfigured ? (
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--cream)' }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Not configured yet</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--sand)' }}>
                Add your Supabase credentials to <code className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(219, 185, 138, 0.2)', color: 'var(--charcoal)' }}>.env.local</code> to enable cloud sync.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(22, 163, 74, 0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                  <span className="text-sm font-medium" style={{ color: '#15803d' }}>Connected</span>
                </div>
                {lastSync && (
                  <span className="text-xs" style={{ color: '#16a34a' }}>
                    {lastSync.toLocaleTimeString('en-IN')}
                  </span>
                )}
              </div>
              
              <button onClick={handleSync} disabled={syncing}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-all"
                style={{ background: syncing ? undefined : '#3b82f6', boxShadow: syncing ? undefined : '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
              </button>
              
              {syncResult && (
                <div className={`text-sm p-3 rounded-xl font-medium ${
                  syncResult.success ? '' : ''
                }`} style={{
                  background: syncResult.success ? 'rgba(22, 163, 74, 0.06)' : 'rgba(220, 38, 38, 0.06)',
                  color: syncResult.success ? '#15803d' : '#b91c1c',
                  border: `1px solid ${syncResult.success ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
                }}>
                  {syncResult.success ? (
                    <span>✓ Orders: +{syncResult.ordersPushed} · Menu pulled: {syncResult.menuPulled}</span>
                  ) : (
                    <span>✗ {syncResult.error}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card-elevated fade-in" style={{ animationDelay: '0.15s', borderColor: 'rgba(220, 38, 38, 0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-heading font-bold text-sm" style={{ color: '#dc2626' }}>Danger Zone</h3>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--sand)' }}>
            Clear all order data. This action cannot be undone.
          </p>
          <button onClick={() => setShowClearConfirm(true)} className="btn-danger">
            Clear Order Data
          </button>
        </div>

        {/* Brand Footer */}
        <div className="text-center py-6 space-y-3 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-center">
            <Logo size="md" variant="dark" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>The Momo Hub v1.0.0</p>
            <p className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'var(--sand)' }}>
              More Momos. More Memories.
            </p>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
