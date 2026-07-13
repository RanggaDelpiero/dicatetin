// ============================================
// Pundi — Intelligence Store Tests
// ============================================

import { describe, expect, it, beforeEach } from 'vitest';
import { useIntelligenceStore } from './intelligence-store';

describe('useIntelligenceStore', () => {
  beforeEach(() => {
    useIntelligenceStore.setState({
      insights: [],
      alerts: [],
      reports: [],
      acceptedSuggestions: [],
    });
  });

  it('adds and retrieves active insights', () => {
    const store = useIntelligenceStore.getState();
    store.addInsight({
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much',
      dataSignature: 'hash123',
    });

    const current = useIntelligenceStore.getState();
    expect(current.insights).toHaveLength(1);
    expect(current.getActiveInsights()).toHaveLength(1);
  });

  it('dismisses an insight', () => {
    const store = useIntelligenceStore.getState();
    const insight = store.addInsight({
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much',
      dataSignature: 'hash123',
    });

    store.dismissInsight(insight.id);

    const current = useIntelligenceStore.getState();
    expect(current.insights[0].dismissedAt).toBeDefined();
    expect(current.getActiveInsights()).toHaveLength(0);
  });

  it('accepts an insight suggestion', () => {
    const store = useIntelligenceStore.getState();
    const insight = store.addInsight({
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much',
      dataSignature: 'hash123',
    });

    store.acceptInsight(insight.id, { label: 'Apply', actionType: 'apply_budget' });

    const current = useIntelligenceStore.getState();
    expect(current.insights[0].acceptedAt).toBeDefined();
    expect(current.getActiveInsights()).toHaveLength(0);
    expect(current.acceptedSuggestions).toHaveLength(1);
    expect(current.acceptedSuggestions[0].insightId).toBe(insight.id);
  });

  it('updates insight if data signature changes', () => {
    const store = useIntelligenceStore.getState();
    store.setInsights([{
      id: 'insight1',
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much',
      dataSignature: 'hash123',
      createdAt: new Date().toISOString(),
      dismissedAt: new Date().toISOString(), // previously dismissed
    }]);

    // Same kind, same signature -> should ignore
    store.syncInsights([{
      id: 'new1',
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much',
      dataSignature: 'hash123',
      createdAt: new Date().toISOString(),
    }]);

    expect(useIntelligenceStore.getState().getActiveInsights()).toHaveLength(0);

    // Same kind, different signature -> should add as active
    store.syncInsights([{
      id: 'new2',
      kind: 'overspending',
      severity: 'warning',
      title: 'Warning: Budget over',
      explanation: 'You spent too much updated',
      dataSignature: 'hash456',
      createdAt: new Date().toISOString(),
    }]);

    const active = useIntelligenceStore.getState().getActiveInsights();
    expect(active).toHaveLength(1);
    expect(active[0].dataSignature).toBe('hash456');
  });
});
