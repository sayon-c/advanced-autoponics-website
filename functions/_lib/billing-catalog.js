/** Shared billing selections for admin + invoice line items. */
export const BILLING_SELECTIONS = [
  { id: 'cea_automation', label: 'CEA automation', default_unit_price_cents: 17500 },
  { id: 'controls_integration', label: 'Controls integration', default_unit_price_cents: 16500 },
  { id: 'ai_anomaly', label: 'AI anomaly detection', default_unit_price_cents: 18500 },
  { id: 'sensor_networking', label: 'Sensor networking', default_unit_price_cents: 16000 },
  { id: 'data_layer', label: 'Unified data layer', default_unit_price_cents: 17000 },
  { id: 'commissioning', label: 'Commissioning', default_unit_price_cents: 18500 },
  { id: 'site_audit', label: 'Grow facility audit', default_unit_price_cents: 450000 },
  { id: 'travel', label: 'Travel / site days', default_unit_price_cents: 75000 },
  { id: 'materials', label: 'Materials', default_unit_price_cents: 0 },
  { id: 'support_retainer', label: 'Support retainer', default_unit_price_cents: 250000 },
  { id: 'day_rate', label: 'Day rate', default_unit_price_cents: 132000 },
  { id: 'month_rate', label: 'Month rate', default_unit_price_cents: 2000000 },
  { id: 'custom', label: 'Custom', default_unit_price_cents: 0 }
];

const byId = new Map(BILLING_SELECTIONS.map((s) => [s.id, s]));

export function selectionLabel(id) {
  return byId.get(id)?.label || null;
}

export function isKnownSelection(id) {
  return byId.has(id);
}
