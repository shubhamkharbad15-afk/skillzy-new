import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithAuth } from '../../../lib/api';
import { Store, Award, Coins, ShoppingCart, Sparkles, RefreshCw } from 'lucide-react';

const RARITY_STYLES = {
  common: 'bg-[#5C4E4E]/35 text-gray-700 border-gray-200',
  uncommon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rare: 'bg-blue-50 text-blue-700 border-blue-200',
  epic: 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

const RewardsStore = () => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [storeItems, setStoreItems] = useState([]);
  const [notice, setNotice] = useState({ open: false, message: '', error: false });
  const [error, setError] = useState('');

  useEffect(() => {
    loadStoreData();
  }, []);

  const showNotice = (message, isError = false) => {
    setNotice({ open: true, message, error: isError });
    setTimeout(() => setNotice({ open: false, message: '', error: false }), 3000);
  };

  const loadStoreData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, creditsRes] = await Promise.all([
        fetchWithAuth('/store/items'),
        fetchWithAuth('/store/credits')
      ]);
      setStoreItems(Array.isArray(itemsRes) ? itemsRes : []);
      setUserCredits(creditsRes?.credits ?? 0);
      setCreditsEarned(creditsRes?.earned ?? 0);
    } catch (err) {
      setError('Failed to load store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    if (item.is_owned) return;
    if (!item.available) { showNotice('This item is currently out of stock.', true); return; }
    if (userCredits < item.price) { showNotice('Not enough credits to purchase this item.', true); return; }
    setPurchasing(item.id);
    try {
      await fetchWithAuth(`/store/purchase/${item.id}`, { method: 'POST' });
      showNotice(`${item.name} purchased successfully!`);
      await loadStoreData();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('already own')) {
        showNotice('You already own this item.', true);
      } else if (msg.includes('Insufficient')) {
        showNotice('Not enough credits for this purchase.', true);
      } else {
        showNotice('Purchase failed. Please try again.', true);
      }
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={loadStoreData} className="btn-outline inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const ownedItems = storeItems.filter(i => i.is_owned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-500" /> Rewards Store
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Redeem your community activity points for exclusive items.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 border-[#5C4E4E]/45 px-3 py-2 rounded-lg">
            <Coins className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{userCredits.toLocaleString()} credits</div>
              <div className="text-[10px] text-gray-400">{creditsEarned.toLocaleString()} earned total</div>
            </div>
          </div>
          <button onClick={loadStoreData} className="p-2 text-gray-500 hover:text-gray-700 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Store Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeItems.map(item => {
          const canAfford = userCredits >= item.price;
          const rarityStyle = RARITY_STYLES[item.rarity] || RARITY_STYLES.common;

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800/90 border rounded-lg p-5 flex flex-col justify-between transition ${
                item.is_owned
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-gray-200/80 border-[#5C4E4E]/45/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${rarityStyle}`}>
                    {item.rarity}
                  </span>
                  {item.is_owned && (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Owned
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 border-[#5C4E4E]/45 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {item.price.toLocaleString()}
                </div>
                {!item.available ? (
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-2 py-1 rounded">Out of stock</span>
                ) : item.is_owned ? (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">In Collection</span>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || purchasing === item.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                      canAfford
                        ? 'bg-slate-900 dark:bg-[#D1D0D0] text-black dark:text-slate-900 hover:bg-slate-800'
                        : 'bg-[#5C4E4E]/35 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {purchasing === item.id ? (
                      <span className="animate-pulse">…</span>
                    ) : canAfford ? (
                      <><ShoppingCart className="w-3 h-3" /> Buy</>
                    ) : (
                      'Not enough'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collection */}
      {ownedItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 border-[#5C4E4E]/45/80 rounded-lg p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-500" /> Your Collection ({ownedItems.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {ownedItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-1.5">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How to earn */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 border-[#5C4E4E]/40 rounded-lg p-5">
        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">How to earn credits</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-600 text-sm">+10</span>
            <span>Per message sent</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-600 text-sm">+25</span>
            <span>Per event attended</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-600 text-sm">+50</span>
            <span>Per challenge joined</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-600 text-sm">+20</span>
            <span>Per connection made</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {notice.open && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold ${
            notice.error
              ? 'bg-red-600 text-white'
              : 'bg-slate-900 text-white'
          }`}>
            {notice.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsStore;
