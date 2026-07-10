## 2025-02-23 - Icon-Only Button Pattern
**Learning:** Found a systemic pattern where icon-only destructive actions (like Trash buttons in debt/split-bill lists and Backspace in custom keypad) are missing ARIA labels, making them inaccessible to screen readers.
**Action:** When working on lists with inline actions or custom control pads, proactively ensure that any button without visible text includes an `aria-label` attribute describing its function (e.g. "Hapus hutang ke [nama]").
