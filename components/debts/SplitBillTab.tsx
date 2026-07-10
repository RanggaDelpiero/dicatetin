// ============================================
// Pundi — Split Bill Tab (Redesigned)
// Per-item assignment + Payer selection
// ============================================

"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Camera is actively used on line 614, so it is not an unused import
import {
  Plus, Trash, CheckCircle, UsersThree, X, Camera, Microphone,
  ShoppingCart, User, Receipt
} from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSplitBillStore } from '@/lib/stores/splitbill-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useDebtStore } from '@/lib/stores/debt-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';
import { compressImage } from '@/lib/utils/image';
import { SplitBillItem } from '@/lib/types';
import { generateId } from '@/lib/data/presets';

const SELF_NAME = 'Saya';

type FormStep = 'info' | 'items' | 'assign' | 'payer' | 'confirm';

interface ItemForm {
  id: string;
  name: string;
  price: string;
  qty: string;
  assignedTo: string[];
}

export function SplitBillTab() {
  const { sessions, addSession, deleteSession, markParticipantPaid } = useSplitBillStore();
  const { addReceivable } = useReceivableStore();
  const { addDebt } = useDebtStore();
  const { addXP, recordActivity, unlockBadge } = useGamificationStore();

  const [showAddSheet, setShowAddSheet] = useState(false);

  // Multi-step form
  const [step, setStep] = useState<FormStep>('info');

  // Step 1: Info
  const [title, setTitle] = useState('');
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Step 2: Items
  const [items, setItems] = useState<ItemForm[]>([]);

  // Step 3: Participants
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [includeSelf, setIncludeSelf] = useState(true);

  // Step 4: Payer
  const [paidBy, setPaidBy] = useState<string>(SELF_NAME);

  // Computed
  const allParticipants = useMemo(() => {
    const list = includeSelf ? [SELF_NAME, ...participants] : [...participants];
    return list;
  }, [participants, includeSelf]);

  const itemTotals = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (parseInt(item.price) || 0) * (parseInt(item.qty) || 1);
    }, 0);
  }, [items]);

  const perPersonAmounts = useMemo(() => {
    const amounts: Record<string, number> = {};
    allParticipants.forEach((name) => {
      amounts[name] = 0;
    });

    items.forEach((item) => {
      if (item.assignedTo.length === 0) return;
      const itemTotal = (parseInt(item.price) || 0) * (parseInt(item.qty) || 1);
      const perPerson = Math.round(itemTotal / item.assignedTo.length);
      item.assignedTo.forEach((name) => {
        if (amounts[name] !== undefined) {
          amounts[name] += perPerson;
        }
      });
    });

    return amounts;
  }, [items, allParticipants]);

  // Reset form
  const resetForm = () => {
    setStep('info');
    setTitle('');
    setItems([]);
    setParticipantInput('');
    setParticipants([]);
    setIncludeSelf(true);
    setPaidBy(SELF_NAME);
    setIsAiExtracting(false);
    setIsRecording(false);
  };

  // ---- AI Extraction ----
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic('medium');
    setIsAiExtracting(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await compressImage(rawBase64);
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'photo',
            image: compressedBase64,
            mode: 'split',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengekstrak data.');
        }

        const result = await res.json();
        haptic('success');

        // Fill form from AI result
        if (result.title) setTitle(result.title);
        if (result.items && Array.isArray(result.items)) {
          setItems(
            result.items.map((item: { name?: string; price?: number; qty?: number }) => ({
              id: generateId(),
              name: item.name || '',
              price: (item.price || 0).toString(),
              qty: (item.qty || 1).toString(),
              assignedTo: [],
            }))
          );
          // Jump to items step to review
          setStep('items');
        }
        if (result.participants && Array.isArray(result.participants)) {
          setParticipants(result.participants.filter((p: string) => p !== SELF_NAME));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal mengekstrak bill dari foto.';
        console.error(err);
        haptic('error');
        alert(message);
      } finally {
        setIsAiExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceRecord = () => {
    haptic('medium');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Pencatatan suara tidak didukung oleh browser Anda. Gunakan Chrome atau Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      setIsAiExtracting(true);

      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'voice',
            text: transcript,
            mode: 'split',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengekstrak ucapan.');
        }

        const result = await res.json();
        haptic('success');

        if (result.title) setTitle(result.title);
        if (result.items && Array.isArray(result.items)) {
          setItems(
            result.items.map((item: { name?: string; price?: number; qty?: number }) => ({
              id: generateId(),
              name: item.name || '',
              price: (item.price || 0).toString(),
              qty: (item.qty || 1).toString(),
              assignedTo: [],
            }))
          );
          setStep('items');
        } else if (result.total_amount) {
          // Fallback: no items, just total
          setItems([{
            id: generateId(),
            name: result.title || 'Total',
            price: result.total_amount.toString(),
            qty: '1',
            assignedTo: [],
          }]);
          setStep('items');
        }
        if (result.participants && Array.isArray(result.participants)) {
          setParticipants(result.participants.filter((p: string) => p !== SELF_NAME));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'AI gagal memahami catatan suaramu.';
        console.error(err);
        haptic('error');
        alert(message);
      } finally {
        setIsAiExtracting(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setIsRecording(false);
      haptic('error');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // ---- Item Management ----
  const addItem = () => {
    haptic('light');
    setItems([...items, { id: generateId(), name: '', price: '', qty: '1', assignedTo: [] }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemForm, value: string | string[]) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const toggleItemAssignment = (itemId: string, participant: string) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      const isAssigned = item.assignedTo.includes(participant);
      return {
        ...item,
        assignedTo: isAssigned
          ? item.assignedTo.filter((p) => p !== participant)
          : [...item.assignedTo, participant],
      };
    }));
  };

  // ---- Participant Management ----
  const addParticipant = () => {
    const name = participantInput.trim();
    if (name && !participants.includes(name) && name !== SELF_NAME) {
      haptic('light');
      setParticipants([...participants, name]);
      setParticipantInput('');
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
    // Also remove from item assignments
    setItems(items.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((p) => p !== name),
    })));
    // Reset paidBy if this person was selected
    if (paidBy === name) setPaidBy(SELF_NAME);
  };

  // ---- Submit ----
  const handleCreateSplit = () => {
    if (!title.trim() || allParticipants.length < 2 || items.length === 0) {
      haptic('error');
      return;
    }

    haptic('success');

    const splitItems: SplitBillItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: parseInt(item.price) || 0,
      qty: parseInt(item.qty) || 1,
      assignedTo: item.assignedTo,
    }));

    const session = addSession({
      title,
      total_amount: itemTotals,
      method: 'per-item',
      participantNames: allParticipants,
      items: splitItems,
      paidBy,
    });

    // Create debts/receivables based on who paid
    if (paidBy === SELF_NAME) {
      // I paid → everyone else owes me (Piutang)
      session.participants.forEach((p) => {
        if (p.name !== SELF_NAME && p.amount > 0) {
          addReceivable({
            debtor: p.name,
            total_amount: p.amount,
            remaining_amount: p.amount,
            status: 'unpaid',
            note: `Split bill: ${title}`,
          });
        }
      });
    } else {
      // Someone else paid → my portion becomes my debt (Hutang)
      const myPortion = session.participants.find((p) => p.name === SELF_NAME);
      if (myPortion && myPortion.amount > 0) {
        addDebt({
          creditor: paidBy,
          total_amount: myPortion.amount,
          remaining_amount: myPortion.amount,
          status: 'active',
          note: `Split bill: ${title}`,
        });
      }
    }

    // Gamification
    addXP(XP_REWARDS.FIRST_SPLIT_BILL);
    unlockBadge('first-split');
    recordActivity();

    resetForm();
    setShowAddSheet(false);
  };

  const handleMarkPaid = (sessionId: string, participantId: string) => {
    haptic('success');
    markParticipantPaid(sessionId, participantId);
  };

  // ---- Step Navigation ----
  const canProceed = (): boolean => {
    switch (step) {
      case 'info':
        return title.trim().length > 0;
      case 'items':
        return items.length > 0 && items.every((i) => i.name.trim() && parseInt(i.price) > 0);
      case 'assign':
        return allParticipants.length >= 2 && items.some((i) => i.assignedTo.length > 0);
      case 'payer':
        return !!paidBy;
      default:
        return true;
    }
  };

  const nextStep = () => {
    haptic('light');
    const steps: FormStep[] = ['info', 'items', 'assign', 'payer', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const prevStep = () => {
    haptic('light');
    const steps: FormStep[] = ['info', 'items', 'assign', 'payer', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const stepLabels: Record<FormStep, string> = {
    info: 'Info',
    items: 'Menu',
    assign: 'Peserta',
    payer: 'Pembayar',
    confirm: 'Konfirmasi',
  };

  // ---- Render ----
  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-tertiary">Total sesi split</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{sessions.length}</p>
        </div>
        <button
          onClick={() => { haptic('light'); resetForm(); setShowAddSheet(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-secondary text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <Plus size={16} weight="bold" />
          Split Baru
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🍕</p>
          <p className="text-sm text-text-secondary">Belum ada split bill</p>
          <p className="text-xs text-text-tertiary mt-1">Buat sesi split saat nongkrong bareng!</p>
        </div>
      ) : (
        sessions.map((session, idx) => {
          const paidCount = session.participants.filter((p) => p.status === 'paid').length;
          const allPaid = paidCount === session.participants.length;

          return (
            <motion.div
              key={session.id}
              className="bg-bg-elevated rounded-[14px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersThree size={18} weight="duotone" className="text-accent-secondary" />
                    <p className="text-sm font-semibold text-text-primary">{session.title}</p>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {formatDate(session.created_at)} · {session.participants.length} orang · {formatCurrency(session.total_amount)}
                  </p>
                  {session.paidBy && (
                    <p className="text-xs text-accent-secondary mt-0.5">
                      💳 Dibayar oleh: {session.paidBy}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    haptic('medium');
                    if (confirm(`Hapus split bill "${session.title}"?`)) deleteSession(session.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-bg-secondary"
                >
                  <Trash size={16} className="text-text-tertiary" />
                </button>
              </div>

              {/* Items summary */}
              {session.items && session.items.length > 0 && (
                <div className="bg-bg-secondary rounded-xl p-3 mb-3">
                  <p className="text-xs text-text-tertiary mb-1.5">📋 Daftar Pesanan</p>
                  <div className="space-y-1">
                    {session.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-text-primary">{item.name}</span>
                          {item.qty > 1 && (
                            <span className="text-[10px] text-text-tertiary">x{item.qty}</span>
                          )}
                          {item.assignedTo.length > 0 && (
                            <span className="text-[10px] text-accent-secondary">
                              → {item.assignedTo.join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary tabular-nums">
                          {formatCurrency(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="space-y-2">
                {session.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {p.status === 'paid' || p.name === session.paidBy ? (
                        <CheckCircle size={18} weight="fill" className="text-accent-primary" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-text-tertiary" />
                      )}
                      <span className={`text-sm ${
                        p.status === 'paid' || p.name === session.paidBy ? 'text-text-tertiary line-through' : 'text-text-primary'
                      }`}>
                        {p.name}
                        {p.name === session.paidBy && (
                          <span className="text-[10px] text-accent-primary ml-1">(pembayar)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-text-secondary">
                        {formatCurrency(p.amount)}
                      </span>
                      {p.status !== 'paid' && p.name !== session.paidBy && (
                        <button
                          onClick={() => handleMarkPaid(session.id, p.id)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-accent-primary/10 text-accent-primary font-semibold"
                        >
                          Lunas
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {allPaid && (
                <p className="text-center text-xs text-accent-primary font-semibold mt-3">
                  ✅ Semua sudah bayar!
                </p>
              )}
            </motion.div>
          );
        })
      )}

      {/* ===== Add Split Sheet (Multi-Step) ===== */}
      <BottomSheet isOpen={showAddSheet} onClose={() => { resetForm(); setShowAddSheet(false); }} title="Split Bill Baru" fullHeight>
        <div className="p-5 flex flex-col" style={{ minHeight: 'calc(92vh - 100px)' }}>
          {/* Step Indicator */}
          <div className="flex items-center gap-1 mb-5">
            {(['info', 'items', 'assign', 'payer', 'confirm'] as FormStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => { if (i <= (['info', 'items', 'assign', 'payer', 'confirm'] as FormStep[]).indexOf(step)) setStep(s); }}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-all ${
                    step === s
                      ? 'bg-accent-secondary text-white'
                      : i < (['info', 'items', 'assign', 'payer', 'confirm'] as FormStep[]).indexOf(step)
                        ? 'bg-accent-primary/15 text-accent-primary'
                        : 'bg-bg-secondary text-text-tertiary'
                  }`}
                >
                  {stepLabels[s]}
                </button>
                {i < 4 && <div className="flex-1 h-[2px] bg-bg-secondary rounded-full" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 space-y-4">
            <AnimatePresence mode="wait">
              {/* ===== STEP 1: Info ===== */}
              {step === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Judul</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Makan siang bareng"
                      className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
                      autoFocus
                    />
                  </div>

                  {/* AI Extraction */}
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      Scan Struk / Ngomong (opsional)
                    </label>
                    <div className="flex gap-2 relative">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-bg-secondary text-text-secondary hover:text-accent-secondary transition-colors cursor-pointer text-xs font-semibold">
                        <Camera size={18} weight="duotone" />
                        <span>📸 Foto Struk</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isAiExtracting}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleVoiceRecord}
                        disabled={isAiExtracting}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
                          isRecording
                            ? 'bg-accent-danger text-white animate-pulse'
                            : 'bg-bg-secondary text-text-secondary'
                        }`}
                      >
                        <Microphone size={18} weight="duotone" />
                        <span>{isRecording ? '🔊 Mendengarkan...' : '🎤 Ngomong'}</span>
                      </button>

                      {isAiExtracting && (
                        <div className="absolute inset-0 bg-bg-elevated/80 flex items-center justify-center gap-2 rounded-xl">
                          <span className="w-4 h-4 rounded-full border-2 border-accent-secondary border-t-transparent animate-spin" />
                          <span className="text-xs font-semibold text-accent-secondary animate-pulse">Pundi AI sedang membaca...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1.5">
                      Foto struk atau ngomong untuk otomatis isi daftar item 🧠
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 2: Items ===== */}
              {step === 'items' && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      <ShoppingCart size={14} weight="duotone" className="inline mr-1" />
                      Daftar Item ({items.length})
                    </label>
                    <p className="text-xs font-bold text-accent-secondary tabular-nums">
                      Total: {formatCurrency(itemTotals)}
                    </p>
                  </div>

                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-bg-secondary rounded-xl p-3 space-y-2"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder={`Item ${idx + 1}`}
                          className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated text-text-primary placeholder:text-text-tertiary outline-none text-sm"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          placeholder="Harga"
                          className="w-24 px-3 py-2 rounded-lg bg-bg-elevated text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums text-right"
                        />
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-14 px-2 py-2 rounded-lg bg-bg-elevated text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums text-center"
                        />
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg text-accent-danger hover:bg-accent-danger/10"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                      {/* Item subtotal */}
                      <div className="flex justify-end">
                        <span className="text-[10px] text-text-tertiary tabular-nums">
                          Subtotal: {formatCurrency((parseInt(item.price) || 0) * (parseInt(item.qty) || 1))}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addItem}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-text-tertiary/30 text-text-secondary text-sm font-medium flex items-center justify-center gap-1.5 hover:border-accent-secondary hover:text-accent-secondary transition-colors"
                  >
                    <Plus size={16} weight="bold" />
                    Tambah Item
                  </button>
                </motion.div>
              )}

              {/* ===== STEP 3: Assign ===== */}
              {step === 'assign' && (
                <motion.div
                  key="assign"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Add participants */}
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      <UsersThree size={14} weight="duotone" className="inline mr-1" />
                      Peserta
                    </label>

                    {/* Toggle "Saya" */}
                    <button
                      onClick={() => {
                        haptic('light');
                        setIncludeSelf(!includeSelf);
                        if (!includeSelf) setPaidBy(SELF_NAME);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl mb-2 text-sm font-medium transition-all ${
                        includeSelf
                          ? 'bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30'
                          : 'bg-bg-secondary text-text-tertiary border border-transparent'
                      }`}
                    >
                      <User size={18} weight={includeSelf ? 'fill' : 'regular'} />
                      <span>Saya (sertakan diri sendiri)</span>
                      <div className={`ml-auto w-5 h-5 rounded-md flex items-center justify-center ${
                        includeSelf ? 'bg-accent-secondary' : 'border-2 border-text-tertiary'
                      }`}>
                        {includeSelf && <CheckCircle size={14} weight="fill" className="text-white" />}
                      </div>
                    </button>

                    {/* Add other participants */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={participantInput}
                        onChange={(e) => setParticipantInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                        placeholder="Nama peserta lain"
                        className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
                      />
                      <button
                        onClick={addParticipant}
                        className="px-4 py-3 rounded-xl bg-accent-secondary text-white text-sm font-semibold"
                      >
                        <Plus size={20} weight="bold" />
                      </button>
                    </div>

                    {/* Participant chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {participants.map((p) => (
                        <div
                          key={p}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-secondary/10 text-accent-secondary text-sm"
                        >
                          {p}
                          <button onClick={() => removeParticipant(p)}>
                            <X size={14} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assign items to participants */}
                  {allParticipants.length >= 2 && (
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-2 block">
                        <Receipt size={14} weight="duotone" className="inline mr-1" />
                        Pilih pesanan tiap item
                      </label>
                      <p className="text-[10px] text-text-tertiary mb-3">
                        Tap nama peserta di bawah item untuk assign siapa yang pesan 👇
                      </p>

                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="bg-bg-secondary rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-text-primary">
                                {item.name || 'Item'}
                                {parseInt(item.qty) > 1 && (
                                  <span className="text-text-tertiary text-xs ml-1">x{item.qty}</span>
                                )}
                              </span>
                              <span className="text-xs font-bold text-text-secondary tabular-nums">
                                {formatCurrency((parseInt(item.price) || 0) * (parseInt(item.qty) || 1))}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {allParticipants.map((p) => {
                                const isAssigned = item.assignedTo.includes(p);
                                return (
                                  <button
                                    key={p}
                                    onClick={() => toggleItemAssignment(item.id, p)}
                                    className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-all ${
                                      isAssigned
                                        ? 'bg-accent-secondary text-white shadow-sm'
                                        : 'bg-bg-elevated text-text-tertiary hover:text-text-secondary'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                            </div>
                            {item.assignedTo.length > 1 && (
                              <p className="text-[10px] text-text-tertiary mt-1.5">
                                Dibagi {item.assignedTo.length} orang → {formatCurrency(Math.round(((parseInt(item.price) || 0) * (parseInt(item.qty) || 1)) / item.assignedTo.length))}/orang
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-person preview */}
                  {allParticipants.length >= 2 && items.some((i) => i.assignedTo.length > 0) && (
                    <div className="bg-accent-secondary/5 rounded-xl p-3 border border-accent-secondary/10">
                      <p className="text-xs font-medium text-accent-secondary mb-2">
                        💰 Preview per orang
                      </p>
                      {allParticipants.map((name) => (
                        <div key={name} className="flex justify-between py-1">
                          <span className="text-sm text-text-primary">
                            {name}
                            {name === SELF_NAME && <span className="text-[10px] text-accent-secondary ml-1">(kamu)</span>}
                          </span>
                          <span className="text-sm font-bold text-text-primary tabular-nums">
                            {formatCurrency(perPersonAmounts[name] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===== STEP 4: Payer ===== */}
              {step === 'payer' && (
                <motion.div
                  key="payer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      💳 Siapa yang bayar?
                    </label>
                    <p className="text-[10px] text-text-tertiary mb-3">
                      Pilih siapa yang membayar tagihan ini. Hutang/piutang akan otomatis dibuat.
                    </p>

                    <div className="space-y-2">
                      {allParticipants.map((name) => (
                        <button
                          key={name}
                          onClick={() => { haptic('light'); setPaidBy(name); }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                            paidBy === name
                              ? 'bg-accent-secondary text-white shadow-md'
                              : 'bg-bg-secondary text-text-primary hover:bg-bg-secondary/80'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            paidBy === name ? 'bg-white/20' : 'bg-accent-secondary/10 text-accent-secondary'
                          }`}>
                            {name === SELF_NAME ? '👤' : name[0]?.toUpperCase()}
                          </div>
                          <span>{name}</span>
                          {paidBy === name && (
                            <CheckCircle size={20} weight="fill" className="ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Impact preview */}
                  <div className="bg-bg-secondary rounded-xl p-4">
                    <p className="text-xs font-medium text-text-secondary mb-2">📊 Yang terjadi setelah split:</p>
                    {paidBy === SELF_NAME ? (
                      <div className="space-y-1.5">
                        <p className="text-xs text-accent-primary font-medium">
                          ✅ Kamu yang bayar — bagian orang lain masuk Piutang kamu
                        </p>
                        {allParticipants
                          .filter((n) => n !== SELF_NAME)
                          .map((name) => (
                            <div key={name} className="flex justify-between">
                              <span className="text-xs text-text-secondary">{name} hutang ke kamu</span>
                              <span className="text-xs font-semibold text-accent-primary tabular-nums">
                                +{formatCurrency(perPersonAmounts[name] || 0)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs text-accent-danger font-medium">
                          💸 {paidBy} yang bayar — bagian kamu masuk Hutang kamu
                        </p>
                        {includeSelf && (
                          <div className="flex justify-between">
                            <span className="text-xs text-text-secondary">Kamu hutang ke {paidBy}</span>
                            <span className="text-xs font-semibold text-accent-danger tabular-nums">
                              -{formatCurrency(perPersonAmounts[SELF_NAME] || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ===== STEP 5: Confirm ===== */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Summary Card */}
                  <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={20} weight="duotone" className="text-accent-secondary" />
                      <h3 className="text-base font-bold text-text-primary">{title}</h3>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Total</span>
                      <span className="font-bold text-text-primary tabular-nums">{formatCurrency(itemTotals)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Dibayar oleh</span>
                      <span className="font-semibold text-accent-secondary">{paidBy}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Jumlah item</span>
                      <span className="font-medium text-text-primary">{items.length} item</span>
                    </div>
                  </div>

                  {/* Items detail */}
                  <div className="bg-bg-secondary rounded-xl p-4">
                    <p className="text-xs font-medium text-text-secondary mb-2">📋 Detail Pesanan</p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between">
                          <div>
                            <span className="text-sm text-text-primary">{item.name}</span>
                            {parseInt(item.qty) > 1 && (
                              <span className="text-xs text-text-tertiary ml-1">x{item.qty}</span>
                            )}
                            {item.assignedTo.length > 0 && (
                              <p className="text-[10px] text-accent-secondary">
                                → {item.assignedTo.join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-text-primary tabular-nums">
                            {formatCurrency((parseInt(item.price) || 0) * (parseInt(item.qty) || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-person breakdown */}
                  <div className="bg-accent-secondary/5 rounded-xl p-4 border border-accent-secondary/10">
                    <p className="text-xs font-medium text-accent-secondary mb-2">💰 Breakdown per orang</p>
                    {allParticipants.map((name) => (
                      <div key={name} className="flex justify-between py-1.5 border-b border-border-light last:border-0">
                        <span className="text-sm text-text-primary">
                          {name}
                          {name === SELF_NAME && <span className="text-[10px] text-accent-secondary ml-1">(kamu)</span>}
                          {name === paidBy && <span className="text-[10px] text-accent-primary ml-1">💳</span>}
                        </span>
                        <span className="text-sm font-bold text-text-primary tabular-nums">
                          {formatCurrency(perPersonAmounts[name] || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-4 pt-4 border-t border-border-light flex gap-3">
            {step !== 'info' && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 px-4 py-3.5 rounded-2xl bg-bg-secondary text-text-secondary font-semibold text-sm"
              >
                <span className="text-lg">←</span>
                Kembali
              </button>
            )}

            {step !== 'confirm' ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`flex-1 flex items-center justify-center gap-1 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                  canProceed()
                    ? 'bg-accent-secondary text-white active:scale-[0.98]'
                    : 'bg-text-tertiary/30 text-text-tertiary cursor-not-allowed'
                }`}
              >
                Lanjut
                <span className="text-lg">→</span>
              </button>
            ) : (
              <button
                onClick={handleCreateSplit}
                className="flex-1 py-3.5 rounded-2xl bg-accent-primary text-white font-semibold text-base active:scale-[0.98] transition-transform"
              >
                Buat Split Bill 🍕
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
