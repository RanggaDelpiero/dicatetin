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
  ShoppingCart, User, Receipt, ShareNetwork
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
import { shareText, generateSplitBillShareText } from '@/lib/utils/split-bill-share';
import { SplitBillItem } from '@/lib/types';
import { generateId } from '@/lib/data/presets';
import { useToast } from '@/components/ui/Toast';

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
  const toast = useToast();
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
  const [tax, setTax] = useState('0');
  const [service, setService] = useState('0');

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

    // 1. Calculate items subtotal per person
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

    // 2. Add proportional tax and service charge
    const taxNum = parseInt(tax) || 0;
    const serviceNum = parseInt(service) || 0;
    if (taxNum > 0 || serviceNum > 0) {
      if (itemTotals > 0) {
        allParticipants.forEach((name) => {
          const personalSubtotal = amounts[name];
          const personalTax = Math.round((personalSubtotal / itemTotals) * taxNum);
          const personalService = Math.round((personalSubtotal / itemTotals) * serviceNum);
          amounts[name] = personalSubtotal + personalTax + personalService;
        });
      }
    }

    return amounts;
  }, [items, allParticipants, tax, service, itemTotals]);

  const unassignedItems = useMemo(() => {
    return items.filter((i) => i.assignedTo.length === 0);
  }, [items]);

  const unassignedParticipants = useMemo(() => {
    return allParticipants.filter((p) => !items.some((i) => i.assignedTo.includes(p)));
  }, [allParticipants, items]);

  // Reset form
  const resetForm = () => {
    setStep('info');
    setTitle('');
    setItems([]);
    setTax('0');
    setService('0');
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
        if (result.tax) setTax(result.tax.toString());
        if (result.service) setService(result.service.toString());
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
        const message = err instanceof Error ? err.message : 'Gagal mengekstrak bill dari foto.';
        console.error(err);
        haptic('error');
        toast.info(message);
      } finally {
        setIsAiExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceRecord = () => {
    haptic('medium');
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Pencatatan suara tidak didukung oleh browser Anda. Gunakan Chrome atau Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        if (result.tax) setTax(result.tax.toString());
        if (result.service) setService(result.service.toString());
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
        toast.info(message);
      } finally {
        setIsAiExtracting(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const taxNum = parseInt(tax) || 0;
    const serviceNum = parseInt(service) || 0;
    const grandTotal = itemTotals + taxNum + serviceNum;

    const session = addSession({
      title,
      total_amount: grandTotal,
      method: 'per-item',
      participantNames: allParticipants,
      items: splitItems,
      paidBy,
      tax: taxNum,
      service: serviceNum,
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
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-secondary text-text-on-accent text-sm font-semibold active:scale-95 transition-transform"
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
