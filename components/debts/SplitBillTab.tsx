// ============================================
// Pundi — Split Bill Tab
// ============================================

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash, CheckCircle, UsersThree, X, Camera, Microphone } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSplitBillStore } from '@/lib/stores/splitbill-store';
import { useReceivableStore } from '@/lib/stores/receivable-store';
import { useGamificationStore } from '@/lib/stores/gamification-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { haptic } from '@/lib/utils/haptic';
import { XP_REWARDS } from '@/lib/gamification/xp';
import { compressImage } from '@/lib/utils/image';

export function SplitBillTab() {
  const { sessions, addSession, deleteSession, markParticipantPaid } = useSplitBillStore();
  const { addReceivable } = useReceivableStore();
  const { addXP, recordActivity, unlockBadge } = useGamificationStore();

  const [showAddSheet, setShowAddSheet] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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
          headers: {
            'Content-Type': 'application/json',
          },
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
        if (result.total_amount) {
          haptic('success');
          setTotalAmount(result.total_amount.toString());
          if (result.title) setTitle(result.title);
          if (result.participants && Array.isArray(result.participants)) {
            setParticipants(result.participants);
          }
        }
      } catch (err: any) {
        console.error(err);
        haptic('error');
        alert(err.message || 'Gagal mengekstrak bill dari foto.');
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
          headers: {
            'Content-Type': 'application/json',
          },
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
        if (result.total_amount) {
          haptic('success');
          setTotalAmount(result.total_amount.toString());
          if (result.title) setTitle(result.title);
          if (result.participants && Array.isArray(result.participants)) {
            setParticipants(result.participants);
          }
        }
      } catch (err: any) {
        console.error(err);
        haptic('error');
        alert(err.message || 'AI gagal memahami catatan suaramu.');
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

  const addParticipant = () => {
    if (participantInput.trim() && !participants.includes(participantInput.trim())) {
      haptic('light');
      setParticipants([...participants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  const handleCreateSplit = () => {
    const amount = parseInt(totalAmount, 10);
    if (!title.trim() || !amount || amount <= 0 || participants.length === 0) {
      haptic('error');
      return;
    }
    haptic('success');

    const session = addSession({
      title,
      total_amount: amount,
      method: 'equal',
      participantNames: participants,
    });

    // Create receivables for each participant
    session.participants.forEach((p) => {
      addReceivable({
        debtor: p.name,
        total_amount: p.amount,
        remaining_amount: p.amount,
        status: 'unpaid',
        note: `Split bill: ${title}`,
      });
    });

    // Gamification
    addXP(XP_REWARDS.FIRST_SPLIT_BILL);
    unlockBadge('first-split');
    recordActivity();

    // Reset
    setTitle('');
    setTotalAmount('');
    setParticipants([]);
    setShowAddSheet(false);
  };

  const handleMarkPaid = (sessionId: string, participantId: string) => {
    haptic('success');
    markParticipantPaid(sessionId, participantId);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-tertiary">Total sesi split</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{sessions.length}</p>
        </div>
        <button
          onClick={() => { haptic('light'); setShowAddSheet(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-secondary text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <Plus size={16} weight="bold" />
          Split Baru
        </button>
      </div>

      {/* Sessions */}
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

              {/* Per-person amount */}
              <div className="bg-bg-secondary rounded-xl p-3 mb-3">
                <p className="text-xs text-text-tertiary mb-0.5">Per orang</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {formatCurrency(Math.ceil(session.total_amount / session.participants.length))}
                </p>
              </div>

              {/* Participants */}
              <div className="space-y-2">
                {session.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {p.status === 'paid' ? (
                        <CheckCircle size={18} weight="fill" className="text-accent-primary" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-text-tertiary" />
                      )}
                      <span className={`text-sm ${
                        p.status === 'paid' ? 'text-text-tertiary line-through' : 'text-text-primary'
                      }`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-text-secondary">
                        {formatCurrency(p.amount)}
                      </span>
                      {p.status !== 'paid' && (
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

      {/* Add Split Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title="Split Bill Baru">
        <div className="p-5 space-y-4">
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
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Total Tagihan</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm tabular-nums"
            />
          </div>

          {/* AI Split Bill Extraction Row */}
          <div className="flex gap-2 relative">
            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary text-text-secondary hover:text-accent-secondary transition-colors cursor-pointer text-xs font-semibold">
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
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isRecording
                  ? 'bg-accent-danger text-white animate-pulse'
                  : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              <span>{isRecording ? '🔊 Mendengarkan...' : '🎤 Ngomong'}</span>
            </button>

            {isAiExtracting && (
              <div className="absolute inset-0 bg-bg-elevated/80 flex items-center justify-center gap-2 rounded-xl">
                <span className="w-4 h-4 rounded-full border-2 border-accent-secondary border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-accent-secondary animate-pulse">Pundi AI sedang membaca...</span>
              </div>
            )}
          </div>

          {/* Participants */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
              Peserta ({participants.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Nama peserta"
                className="flex-1 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary placeholder:text-text-tertiary outline-none text-sm"
              />
              <button
                onClick={addParticipant}
                className="px-4 py-3 rounded-xl bg-accent-secondary text-white text-sm font-semibold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
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

          {/* Preview */}
          {participants.length > 0 && totalAmount && (
            <div className="bg-bg-secondary rounded-xl p-3">
              <p className="text-xs text-text-tertiary mb-1">Per orang (bagi rata)</p>
              <p className="text-lg font-bold text-accent-secondary tabular-nums">
                {formatCurrency(Math.ceil(parseInt(totalAmount, 10) / participants.length))}
              </p>
            </div>
          )}

          <button
            onClick={handleCreateSplit}
            disabled={participants.length === 0}
            className={`w-full py-4 rounded-2xl font-semibold text-base active:scale-[0.98] transition-transform ${
              participants.length > 0
                ? 'bg-accent-secondary text-white'
                : 'bg-text-tertiary/30 text-text-tertiary cursor-not-allowed'
            }`}
          >
            Buat Split Bill 🍕
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
