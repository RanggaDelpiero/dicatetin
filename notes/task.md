# Pundi — Fase 2 Implementation Tasks

## Phase 1: Bulk Entry
- [x] Bulk transaction entry component (multi-row form)
- [x] Integration with transaction store

## Phase 2: Hutang/Kredit (My Debts)
- [x] Debt store (Zustand)
- [x] Debt list page
- [x] Add debt form
- [x] Debt payment recording
- [x] Progress bar pelunasan

## Phase 3: Hutang Orang (Receivables)
- [x] Receivable store
- [x] Receivable list with partial payment tracking
- [x] Add receivable form

## Phase 4: Split Bill
- [x] Split bill store
- [x] Split bill creation flow (participants, items, method)
- [x] Split result preview
- [x] Link to receivables

## Phase 5: Hutang/Split Tab Page
- [x] Combined page with tab navigation (Hutang Saya / Hutang Orang / Split Bill)

## Phase 6: AI Financial Advisor
- [x] Server-side API proxy route (`/api/advisor`)
- [x] Context assembler (financial summary builder)
- [x] Chat UI page with bubble messages
- [x] Quick-reply suggestion chips
- [x] Disclaimer notice
- [x] Chat history management

## Phase 7: Navigation and Entry Updates
- [x] Update bottom tab bar with debts/split tab
- [x] Added "Kelola" wallets link to dashboard
- [x] Added floating Robot AI shortcut to dashboard header
- [x] Added developer "Buat Dummy Data AI" helper in settings

## Phase 8: Verification
- [x] TypeScript check — PASSED
- [x] Build verification — PASSED
- [x] Browser flow testing (AI chat proxy, bulk inputs, alerts) — PASSED
