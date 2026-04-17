/**
 * Maps cross-search API source IDs to library tree viewKeys
 * so that per-source match counts can be shown in the library sidebar.
 */

const SOURCE_TO_VIEW: Record<string, string> = {
  schedule3: 'schedule-3',
  tco: 'tco',
  customs_act: 'act',
  customs_reg: 'customs-reg',
  customs_tariff_act: 'ct-act',
  pir: 'regulations',
  per: 'pe-regs',
  gst_act: 'gst-act',
  anti_dumping: 'ad-act',
  dumping_notices: 'dumping',
  customs_notices: 'acn',
  chemicals: 'chemicals',
  ahecc: 'ahecc',
  biosecurity: 'bio-act',
  illegal_logging: 'il-act',
  imported_food: 'ifc-act',
  trade_desc: 'td-act',
  precedents: 'precedents',
  compendium: 'compendium',
  alpha_index: 'alpha-index',
  hsen: 'hsen',
  cbp_rulings: 'cbp-rulings',
  aqis: 'aqis',
  cp_questions: 'cpquestions',
};

export interface CrossRefSource {
  id: string;
  label: string;
  count: number;
}

export function buildSourceCounts(sources: CrossRefSource[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sources) {
    const viewKey = SOURCE_TO_VIEW[s.id] || s.id;
    map[viewKey] = s.count;
  }
  return map;
}
