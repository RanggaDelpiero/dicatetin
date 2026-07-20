import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { useSyncStore } from '@/lib/stores/sync-store';

export async function syncDataOnLogin() {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const syncStore = useSyncStore.getState();
  syncStore.setOnline(true);
  useSyncStore.setState({ isSyncing: true, lastError: null });

  try {
    // 1. Check if remote has any wallets
    const { data: remoteWallets, error: walletErr } = await supabase.from('wallets').select('*');
    if (walletErr) throw walletErr;

    if (remoteWallets && remoteWallets.length > 0) {
      // Pull down strategy: overwrite local with remote
      useWalletStore.setState({ wallets: remoteWallets });

      const { data: remoteTxs } = await supabase.from('transactions').select('*');
      if (remoteTxs) useTransactionStore.setState({ transactions: remoteTxs });

      const { data: remoteDebts } = await supabase.from('debts').select('*');
      if (remoteDebts) useDebtStore.setState({ debts: remoteDebts });

      const { data: remoteRecs } = await supabase.from('receivables').select('*');
      if (remoteRecs) useReceivableStore.setState({ receivables: remoteRecs });

      const { data: remoteProfile } = await supabase.from('profiles').select('*').single();
      if (remoteProfile) {
        useGamificationStore.setState({
          progress: {
            ...remoteProfile,
            user_id: user.id
          }
        });
      }

    } else {
      // Push up strategy: remote is empty, push local data up
      const localWallets = useWalletStore.getState().wallets.map(w => ({ ...w, user_id: user.id }));
      const localTxs = useTransactionStore.getState().transactions.map(t => ({ ...t, user_id: user.id }));
      const localDebts = useDebtStore.getState().debts.map(d => ({ ...d, user_id: user.id }));
      const localRecs = useReceivableStore.getState().receivables.map(r => ({ ...r, user_id: user.id }));
      const localProgress = useGamificationStore.getState().progress;

      if (localWallets.length > 0) await supabase.from('wallets').upsert(localWallets);
      if (localTxs.length > 0) await supabase.from('transactions').upsert(localTxs);
      if (localDebts.length > 0) await supabase.from('debts').upsert(localDebts);
      if (localRecs.length > 0) await supabase.from('receivables').upsert(localRecs);
      
      if (localProgress.id) {
        await supabase.from('profiles').upsert({
          id: user.id,
          xp: localProgress.xp,
          level: localProgress.level,
          streak_days: localProgress.streak_days,
          last_activity_date: localProgress.last_activity_date,
          badges: localProgress.badges
        });
      }
      
      // Update local to reflect new UUID ownership
      useWalletStore.setState({ wallets: localWallets });
      useTransactionStore.setState({ transactions: localTxs });
      useDebtStore.setState({ debts: localDebts });
      useReceivableStore.setState({ receivables: localRecs });
      useGamificationStore.setState({ progress: { ...localProgress, user_id: user.id }});
    }

    useSyncStore.setState({ isSyncing: false, lastSyncTime: new Date().toISOString() });
  } catch (err: unknown) {
    console.error('Initial sync failed', err);
    useSyncStore.setState({ isSyncing: false, lastError: (err as Error).message });
  }
}
