// ── Scenario Types ───────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  tariff_code: string;
  description: string;
  origin_country: string;
  currency: string;
  customs_value: number;
  fta_selected: string;
  duty_rate: number;
  duty_amount: number;
  freight: number;
  insurance: number;
  broker_fee: number;
  quarantine_fee: number;
  terminal_handling: number;
  other_charges: number;
  gst_amount: number;
  total_landed_cost: number;
  per_unit_cost: number;
  quantity: number;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────

const STORAGE_KEY = 'tariff_calculator_scenarios';

// ── Helpers ──────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function readFromStorage(): Scenario[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Scenario[];
  } catch {
    return [];
  }
}

function writeToStorage(scenarios: Scenario[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

// ── CRUD Functions ───────────────────────────────────────────────────

/**
 * Get all saved scenarios, sorted by created_at descending (newest first).
 */
export function getScenarios(): Scenario[] {
  return readFromStorage().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Save a new scenario. Assigns an id and created_at automatically.
 */
export function saveScenario(
  s: Omit<Scenario, 'id' | 'created_at'>
): Scenario {
  const scenarios = readFromStorage();
  const newScenario: Scenario = {
    ...s,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  scenarios.push(newScenario);
  writeToStorage(scenarios);
  return newScenario;
}

/**
 * Delete a scenario by id.
 */
export function deleteScenario(id: string): void {
  const scenarios = readFromStorage().filter((s) => s.id !== id);
  writeToStorage(scenarios);
}

/**
 * Get a single scenario by id.
 */
export function getScenario(id: string): Scenario | undefined {
  return readFromStorage().find((s) => s.id === id);
}
