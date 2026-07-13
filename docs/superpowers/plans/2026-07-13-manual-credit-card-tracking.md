# Manual Credit Card Tracking Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual credit card tracking so users can record card purchases, monitor monthly bills/outstanding amounts, and pay card bills without double-counting expenses.

**Architecture:** Treat credit cards as a specialized `Wallet` type with extra card metadata and manual billing fields. Credit card purchases remain normal `expense` transactions for reporting, while payment toward the card is a liability payment/transfer-like action that reduces bank balance and credit card outstanding without creating a second expense.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand persisted stores, Tailwind CSS v4, Vitest.

---

## Scope

This plan implements **manual** credit card tracking only.

In scope:
- Add/edit wallet fields for credit cards: limit, current bill/outstanding, due date, statement label.
- Record purchases using a `credit_card` wallet.
- Show card usage, available limit, monthly bill, and due date.
- Pay card bill manually from a bank/cash/e-wallet wallet.
- Avoid double-counting card payments as expenses.
- Add tests for calculations and balance behavior.

Out of scope:
- Automatic billing cycle generation.
- Interest simulation.
- Installments/cicilan.
- Bank API import.
- Automatic statement reconciliation.

---

## File Structure

- Modify `lib/types.ts`
  - Add credit card metadata to `Wallet`.
  - Add payment metadata to `Transaction` so card bill payments can be distinguished from normal expenses.

- Create `lib/finance/credit-card.ts`
  - Pure helper functions for available limit, usage percentage, payment status, and transaction filtering.

- Create `lib/finance/credit-card.test.ts`
  - Unit tests for helper behavior.

- Modify `lib/stores/wallet-store.ts`
  - Support credit card metadata on add/update.
  - Add an action to apply credit card bill payment.

- Modify `lib/stores/transaction-store.ts`
  - Preserve transaction reporting behavior for credit card purchases.
  - Add helper for card transactions if needed.

- Modify `app/(main)/wallets/page.tsx`
  - Add credit card fields to wallet create/edit sheet.
  - Render credit card cards differently from cash/bank/e-wallet.
  - Add manual bill payment UI.

- Modify `components/transactions/AddTransactionSheet.tsx`
  - Make credit card wallet selection clear.
  - Ensure card purchases increment card outstanding/current bill instead of reducing a normal wallet balance.
  - Keep the expense in normal reports.

- Modify `app/(main)/dashboard/page.tsx`
  - Add dashboard summary for active credit card bills and due dates.
  - Include credit card outstanding in net worth liability.

- Modify `lib/ai/context.ts`
  - Include summarized credit card state in AI advisor context.

- Modify `lib/supabase/schema.sql`
  - Add nullable credit card fields if Supabase sync remains supported.

- Modify `PRD.md` and/or `Design.md`
  - Document the manual credit card mechanism.

---

## Chunk 1: Types And Pure Logic

### Task 1: Extend Domain Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add wallet credit card fields**

Add optional fields to `Wallet`:

```ts
export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  order: number;
  credit_limit?: number;
  credit_outstanding?: number;
  credit_statement_label?: string;
  credit_due_date?: string;
  credit_minimum_payment?: number;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add payment source metadata to transactions**

Add optional fields to `Transaction`:

```ts
export interface Transaction {
  // existing fields...
  payment_kind?: 'normal' | 'credit_card_payment';
  credit_card_wallet_id?: string;
}
```

Implementation note:
- Purchases with a credit card stay `type: 'expense'`.
- Card bill payments should use `payment_kind: 'credit_card_payment'`.
- Card bill payments must not be included in expense totals.

- [ ] **Step 3: Run type check**

Run:

```bash
npm.cmd run build
```

Expected:
- Build may fail until downstream files are updated.
- No syntax errors from `lib/types.ts`.

### Task 2: Add Credit Card Finance Helpers

**Files:**
- Create: `lib/finance/credit-card.ts`
- Create: `lib/finance/credit-card.test.ts`

- [ ] **Step 1: Write failing tests**

Create tests:

```ts
import { describe, expect, it } from 'vitest';
import {
  getAvailableCredit,
  getCreditUsagePercentage,
  getCreditCardPaymentStatus,
} from './credit-card';

describe('credit card helpers', () => {
  it('calculates available credit from limit and outstanding amount', () => {
    expect(getAvailableCredit(10_000_000, 3_250_000)).toBe(6_750_000);
  });

  it('never returns negative available credit', () => {
    expect(getAvailableCredit(1_000_000, 1_500_000)).toBe(0);
  });

  it('calculates usage percentage', () => {
    expect(getCreditUsagePercentage(10_000_000, 2_500_000)).toBe(25);
  });

  it('handles zero limit safely', () => {
    expect(getCreditUsagePercentage(0, 2_500_000)).toBe(0);
  });

  it('detects overdue payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-01', '2026-07-13')).toBe('overdue');
  });

  it('detects due soon payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-15', '2026-07-13')).toBe('due-soon');
  });

  it('detects safe payment status', () => {
    expect(getCreditCardPaymentStatus('2026-07-30', '2026-07-13')).toBe('safe');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm.cmd test -- lib/finance/credit-card.test.ts
```

Expected:
- FAIL because `lib/finance/credit-card.ts` does not exist yet.

- [ ] **Step 3: Implement helper functions**

Create `lib/finance/credit-card.ts`:

```ts
export type CreditCardPaymentStatus = 'safe' | 'due-soon' | 'overdue' | 'no-due-date';

export function getAvailableCredit(limit = 0, outstanding = 0): number {
  return Math.max(0, limit - outstanding);
}

export function getCreditUsagePercentage(limit = 0, outstanding = 0): number {
  if (limit <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((outstanding / limit) * 100)));
}

export function getCreditCardPaymentStatus(
  dueDate?: string,
  today = new Date().toISOString().split('T')[0],
): CreditCardPaymentStatus {
  if (!dueDate) return 'no-due-date';

  const due = new Date(`${dueDate}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const diffDays = Math.ceil((due.getTime() - current.getTime()) / 86_400_000);

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'due-soon';
  return 'safe';
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
npm.cmd test -- lib/finance/credit-card.test.ts
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/finance/credit-card.ts lib/finance/credit-card.test.ts
git commit -m "feat: add credit card finance helpers"
```

---

## Chunk 2: Store Behavior

### Task 3: Support Credit Card Wallet Metadata

**Files:**
- Modify: `lib/stores/wallet-store.ts`

- [ ] **Step 1: Update add wallet input type**

Allow:

```ts
addWallet: (wallet: {
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  credit_limit?: number;
  credit_outstanding?: number;
  credit_statement_label?: string;
  credit_due_date?: string;
  credit_minimum_payment?: number;
}) => Wallet;
```

- [ ] **Step 2: Add credit card payment action**

Add to `WalletState`:

```ts
payCreditCardBill: (params: {
  creditCardWalletId: string;
  sourceWalletId: string;
  amount: number;
}) => void;
```

Implementation behavior:
- Subtract `amount` from source wallet balance.
- Subtract `amount` from credit card `credit_outstanding`.
- Clamp credit card outstanding to `0`.
- Do not change credit card `balance`; for credit cards, `balance` should not be treated as cash.

- [ ] **Step 3: Implement minimal store logic**

Use existing `updateWallet` style. Keep sync queue behavior consistent with current wallet updates.

- [ ] **Step 4: Add/adjust tests if store tests exist**

If no store test harness exists yet, defer store tests and cover critical behavior through pure helpers plus manual QA in later chunks.

- [ ] **Step 5: Commit**

```bash
git add lib/stores/wallet-store.ts
git commit -m "feat: support credit card wallet metadata"
```

### Task 4: Update Transaction Balance Behavior

**Files:**
- Modify: `components/transactions/AddTransactionSheet.tsx`
- Modify: `lib/stores/transaction-store.ts` if helper methods are needed

- [ ] **Step 1: Identify current submit path**

Review `handleSubmit` in `components/transactions/AddTransactionSheet.tsx`.

Current normal behavior:
- income increases selected wallet balance.
- expense decreases selected wallet balance.

- [ ] **Step 2: Change credit card purchase behavior**

When selected wallet has `type === 'credit_card'` and transaction type is `expense`:
- Add normal expense transaction.
- Increase selected card `credit_outstanding` by amount.
- Do not reduce source wallet cash balance.

Pseudo-code:

```ts
const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId);
const isCreditCardExpense = selectedWallet?.type === 'credit_card' && type === 'expense';

if (isCreditCardExpense) {
  updateWallet(selectedWalletId, {
    credit_outstanding: (selectedWallet.credit_outstanding || 0) + numAmount,
  });
} else {
  updateBalance(selectedWalletId, type === 'income' ? numAmount : -numAmount);
}
```

- [ ] **Step 3: Handle editing existing credit card transactions**

For edit mode:
- Reverse previous transaction effect based on previous wallet type.
- Apply new transaction effect based on new wallet type.
- Avoid assuming every expense was cash-reducing.

Create a small local helper in the component if needed:

```ts
function getWalletTransactionDelta(walletType: WalletType, txType: TransactionType, amount: number) {
  if (walletType === 'credit_card' && txType === 'expense') {
    return { cashDelta: 0, creditOutstandingDelta: amount };
  }
  return { cashDelta: txType === 'income' ? amount : -amount, creditOutstandingDelta: 0 };
}
```

- [ ] **Step 4: Ensure expense reporting still includes card purchases**

Do not exclude credit card purchases from `getTotalByType('expense')`.

- [ ] **Step 5: Commit**

```bash
git add components/transactions/AddTransactionSheet.tsx lib/stores/transaction-store.ts
git commit -m "feat: record credit card purchases as liabilities"
```

---

## Chunk 3: Wallet UI

### Task 5: Add Credit Card Fields To Wallet Form

**Files:**
- Modify: `app/(main)/wallets/page.tsx`

- [ ] **Step 1: Add form state**

Add state for:

```ts
const [creditLimit, setCreditLimit] = useState('');
const [creditOutstanding, setCreditOutstanding] = useState('');
const [creditDueDate, setCreditDueDate] = useState('');
const [creditStatementLabel, setCreditStatementLabel] = useState('');
const [creditMinimumPayment, setCreditMinimumPayment] = useState('');
```

- [ ] **Step 2: Show fields only when wallet type is `credit_card`**

Fields:
- Limit kartu.
- Tagihan berjalan/manual outstanding.
- Nama tagihan/periode, for example `Tagihan Juli`.
- Jatuh tempo.
- Minimum payment.

- [ ] **Step 3: Save metadata**

When wallet type is `credit_card`, pass numeric values to `addWallet`/`updateWallet`.

When wallet type is not `credit_card`, omit or clear credit card metadata.

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/wallets/page.tsx"
git commit -m "feat: add credit card wallet form fields"
```

### Task 6: Render Credit Card Cards

**Files:**
- Modify: `app/(main)/wallets/page.tsx`

- [ ] **Step 1: Import helper functions**

```ts
import {
  getAvailableCredit,
  getCreditUsagePercentage,
  getCreditCardPaymentStatus,
} from '@/lib/finance/credit-card';
```

- [ ] **Step 2: Add credit card display**

For credit cards, show:
- Current outstanding/tagihan.
- Limit.
- Available credit.
- Usage progress.
- Due date.
- Status chip.

User-facing copy:
- `Tagihan berjalan`
- `Sisa limit`
- `Jatuh tempo`
- `Telat`, `Segera bayar`, `Aman`

- [ ] **Step 3: Keep non-credit wallets unchanged**

Cash/bank/e-wallet cards should continue showing balance as before.

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/wallets/page.tsx"
git commit -m "feat: show credit card usage in wallets"
```

### Task 7: Add Manual Pay Bill UI

**Files:**
- Modify: `app/(main)/wallets/page.tsx`
- Modify: `lib/stores/wallet-store.ts`
- Modify: `lib/stores/transaction-store.ts`

- [ ] **Step 1: Add Pay Bill button on credit card cards**

Show button only when `credit_outstanding > 0`.

Button label:

```text
Bayar Tagihan
```

- [ ] **Step 2: Add bottom sheet/payment form**

Fields:
- Source wallet.
- Amount.
- Date.
- Optional note.

Validation:
- Amount > 0.
- Amount <= source wallet balance, unless app allows negative balances.
- Amount <= card outstanding.
- Source wallet cannot be the same credit card wallet.

- [ ] **Step 3: On submit, update wallets and record payment transaction**

Use `payCreditCardBill`.

Then add a transaction with:

```ts
{
  type: 'transfer',
  amount,
  wallet_id: sourceWalletId,
  target_wallet_id: creditCardWalletId,
  category_id: 'credit-card-payment',
  payment_kind: 'credit_card_payment',
  credit_card_wallet_id: creditCardWalletId,
  note: note || 'Bayar tagihan kartu kredit',
  date,
}
```

Important:
- This transaction must not be counted as expense.
- It may appear in transaction history as payment/transfer.

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/wallets/page.tsx" lib/stores/wallet-store.ts lib/stores/transaction-store.ts
git commit -m "feat: add manual credit card bill payment"
```

---

## Chunk 4: Transactions, Dashboard, And AI Context

### Task 8: Improve Transaction UI For Credit Card Purchases

**Files:**
- Modify: `components/transactions/AddTransactionSheet.tsx`
- Modify: `app/(main)/transactions/page.tsx`

- [ ] **Step 1: Label credit card wallets in wallet selector**

For credit card wallets, show:

```text
BCA Credit Card · sisa limit RpX
```

- [ ] **Step 2: Show a hint when selected wallet is credit card**

Hint text:

```text
Transaksi ini masuk pengeluaran, tapi pembayarannya nanti dicatat saat kamu bayar tagihan.
```

- [ ] **Step 3: Render card payments distinctly in transaction list**

For `payment_kind === 'credit_card_payment'`, show:

```text
Bayar tagihan kartu kredit
```

Use transfer/payment styling, not expense red styling.

- [ ] **Step 4: Commit**

```bash
git add components/transactions/AddTransactionSheet.tsx "app/(main)/transactions/page.tsx"
git commit -m "feat: clarify credit card transactions"
```

### Task 9: Add Dashboard Credit Card Summary

**Files:**
- Modify: `app/(main)/dashboard/page.tsx`

- [ ] **Step 1: Calculate credit card totals**

```ts
const creditCards = wallets.filter((wallet) => wallet.type === 'credit_card');
const totalCreditOutstanding = creditCards.reduce(
  (sum, wallet) => sum + (wallet.credit_outstanding || 0),
  0,
);
```

- [ ] **Step 2: Include outstanding in net worth liability**

Update net worth:

```ts
const netWorth = totalBalance + totalReceivables - totalDebts - totalCreditOutstanding;
```

Important:
- Exclude credit card `balance` from `totalBalance` if it is currently treated as cash.
- Preferred follow-up: adjust `getTotalBalance` to ignore `credit_card` wallets.

- [ ] **Step 3: Add dashboard card**

Show only if user has credit cards:
- Total tagihan kartu.
- Nearest due date.
- Highest usage card.
- Link to wallets page.

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/dashboard/page.tsx"
git commit -m "feat: add credit card dashboard summary"
```

### Task 10: Add Credit Card Context To AI Advisor

**Files:**
- Modify: `lib/ai/context.ts`

- [ ] **Step 1: Extend financial context input if needed**

Include credit card summaries:

```ts
creditCards: {
  name: string;
  outstanding: number;
  limit: number;
  dueDate?: string;
}[];
```

- [ ] **Step 2: Add summarized context text**

Example:

```text
Kartu kredit:
- BCA Credit Card: tagihan Rp3.250.000 dari limit Rp10.000.000, jatuh tempo 2026-08-05.
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/context.ts
git commit -m "feat: include credit cards in advisor context"
```

---

## Chunk 5: Persistence, Docs, And Verification

### Task 11: Update Supabase Schema

**Files:**
- Modify: `lib/supabase/schema.sql`

- [ ] **Step 1: Add nullable wallet columns**

Add to `wallets`:

```sql
alter table public.wallets
  add column if not exists credit_limit bigint,
  add column if not exists credit_outstanding bigint default 0,
  add column if not exists credit_statement_label text,
  add column if not exists credit_due_date date,
  add column if not exists credit_minimum_payment bigint;
```

- [ ] **Step 2: Add nullable transaction metadata**

Add to `transactions`:

```sql
alter table public.transactions
  add column if not exists payment_kind text default 'normal',
  add column if not exists credit_card_wallet_id uuid references public.wallets(id) on delete set null;
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/schema.sql
git commit -m "chore: add credit card sync schema"
```

### Task 12: Document Manual Credit Card Behavior

**Files:**
- Modify: `PRD.md`
- Modify: `Design.md`

- [ ] **Step 1: Add PRD section**

Document:
- Manual card setup.
- Manual outstanding/tagihan.
- Card purchases as expenses.
- Bill payments not counted as expenses.
- Net worth liability behavior.

- [ ] **Step 2: Add design guidance**

Document wallet card UI:
- Tagihan.
- Sisa limit.
- Due date chip.
- Pay bill button.

- [ ] **Step 3: Commit**

```bash
git add PRD.md Design.md
git commit -m "docs: document manual credit card tracking"
```

### Task 13: Final Verification

**Files:**
- All touched files.

- [ ] **Step 1: Install/repair dependencies if needed**

If `vitest` is still not recognized:

```bash
npm.cmd install
```

Then rerun tests.

- [ ] **Step 2: Run unit tests**

```bash
npm.cmd test
```

Expected:
- All existing tests pass.
- New credit card tests pass.

- [ ] **Step 3: Run production build**

```bash
npm.cmd run build
```

Expected:
- Build succeeds.

- [ ] **Step 4: Manual QA**

Run dev server:

```bash
npm.cmd run dev
```

Manual scenarios:
- Create credit card wallet with limit Rp10.000.000 and outstanding Rp0.
- Add expense Rp150.000 using the credit card.
- Confirm monthly expense increases by Rp150.000.
- Confirm cash/bank balance does not decrease.
- Confirm credit outstanding increases by Rp150.000.
- Pay Rp100.000 from Bank BCA to the card.
- Confirm Bank BCA decreases by Rp100.000.
- Confirm card outstanding decreases to Rp50.000.
- Confirm monthly expense does not increase from payment.
- Confirm dashboard net worth includes card outstanding as liability.

- [ ] **Step 5: Final commit**

```bash
git status
git add .
git commit -m "feat: add manual credit card tracking"
```

---

## Notes For Implementer

- Before touching Next.js files, read the relevant local Next.js docs in `node_modules/next/dist/docs/` per `AGENTS.md`.
- Keep the implementation manual and simple. Do not add billing cycle automation in this pass.
- Do not double-count credit card payments as expenses.
- Treat credit card outstanding as liability in net worth.
- Prefer pure helper functions for finance math and test those first.
- Current repo test execution may need `npm.cmd install` because `vitest` was not recognized during inspection.
