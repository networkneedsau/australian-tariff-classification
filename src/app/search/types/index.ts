// ── Tariff Search Types ──────────────────────────────────────────

export interface TariffResult {
  id: number;
  code: string;
  statistical_code: string | null;
  description: string;
  unit: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  section_number: number;
  section_title: string;
  chapter_number: number;
  chapter_title: string;
  heading_code: string;
  heading_description: string;
  tco_references: string[];
}

export interface CustomsEntryFields {
  tariff_classification_code: string;
  tariff_stat_code: string;
  goods_description: string;
  unit_of_quantity: string;
  general_duty_rate: string;
  duty_payable: number | null;
  gst_applicable: boolean;
  gst_rate: number;
}

export interface EntryResponse {
  tariff_code: string;
  statistical_code: string | null;
  description: string;
  unit_of_measure: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  section: { number: number; title: string };
  chapter: { number: number; title: string };
  heading: { code: string; description: string };
  tco_references: string[];
  fta_exclusions: { schedule: string; fta_name: string; hs_code: string; duty_rate: string | null }[];
  customs_entry_fields: CustomsEntryFields;
  prohibited_flags?: { regulation_type: string; regulation_ref: string; description: string; severity: string; permit_required: string | null; notes: string | null }[];
  permit_requirements?: { agency: string; permit_type: string; description: string; link_url: string | null; notes: string | null }[];
}

export interface ScheduleInfo {
  id: string;
  label: string;
  title: string;
  dataSource: 'countries' | 'sections' | 'fta' | 'external' | 'rules';
  abfUrl: string;
  ftaScheduleKey?: string;
}

export interface SectionData {
  number: number;
  title: string;
  chapters: { number: number; title: string }[];
}

export interface CountryData {
  id: number;
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

export interface FtaExclusionRow {
  hs_code: string;
  description: string;
  fta_name: string;
  duty_rate: string | null;
}

// ── Customs Act 1901 ───────────────────────────────────────────────

export interface ActSectionRow {
  id: number;
  part: string;
  part_title: string;
  division: string | null;
  division_title: string | null;
  subdivision: string | null;
  subdivision_title: string | null;
  section_number: string;
  section_title: string;
  content: string | null;
}

export interface ActPartGroup {
  part: string;
  part_title: string;
  sections: ActSectionRow[];
}

// ── Prohibited Imports Regulations 1956 ────────────────────────────

export interface RegulationRow {
  id: number;
  part: string | null;
  part_title: string | null;
  regulation_number: string;
  regulation_title: string;
  category: string | null;
  content: string | null;
}

export interface RegPartGroup {
  part: string;
  part_title: string;
  regulations: RegulationRow[];
}

// ── Chemical Index (CWC Schedules 1-3) ─────────────────────────────

export interface ChemicalRow {
  id: number;
  cwc_schedule: string;
  item_number: string;
  chemical_name: string;
  cas_number: string | null;
  category: string;
  notes: string | null;
}

export interface ChemScheduleGroup {
  schedule: string;
  chemicals: ChemicalRow[];
}

// ── GST Act 1999 ──────────────────────────────────────────────────

export interface GstActRow {
  id: number;
  chapter: string;
  chapter_title: string;
  part: string | null;
  part_title: string | null;
  division: string;
  division_title: string;
  content: string | null;
}

export interface GstActChapterGroup {
  chapter: string;
  chapter_title: string;
  divisions: GstActRow[];
}

// ── GST Regulations 2019 ──────────────────────────────────────────

export interface GstRegRow {
  id: number;
  chapter: string;
  chapter_title: string;
  part: string | null;
  part_title: string | null;
  division: string;
  division_title: string;
  subdivision: string | null;
}

export interface GstRegChapterGroup {
  chapter: string;
  chapter_title: string;
  divisions: GstRegRow[];
}

// ── Biosecurity Act 2015 / Regulation 2016 ────────────────────────

export interface BioActRow {
  id: number;
  chapter: string;
  chapter_title: string;
  part: string | null;
  part_title: string | null;
  division: string | null;
  division_title: string | null;
  section_range: string | null;
}

export interface BioChapterGroup {
  chapter: string;
  chapter_title: string;
  entries: BioActRow[];
}

// ── Commerce (Trade Descriptions) ─────────────────────────────────

export interface TdActRow {
  id: number;
  part: string;
  part_title: string;
  section_number: string;
  section_title: string;
  content: string | null;
}

export interface TdActPartGroup {
  part: string;
  part_title: string;
  sections: TdActRow[];
}

export interface TdRegRow {
  id: number;
  part: string;
  part_title: string;
  division: string | null;
  division_title: string | null;
  subdivision: string | null;
  regulation_number: string;
  regulation_title: string;
  content: string | null;
}

export interface TdRegPartGroup {
  part: string;
  part_title: string;
  regulations: TdRegRow[];
}

// ── Customs (International Obligations) Regulation 2015 ───────────

export interface IntlObRow {
  id: number;
  part: string;
  part_title: string;
  division: string | null;
  division_title: string | null;
  regulation_number: string;
  regulation_title: string;
  content: string | null;
}

export interface IntlObPartGroup {
  part: string;
  part_title: string;
  regulations: IntlObRow[];
}

// ── AQIS Producer ─────────────────────────────────────────────────

export interface AqisRow {
  id: number;
  category: string;
  category_title: string;
  item_type: string;
  item_title: string;
  description: string | null;
  requirements: string | null;
  notes: string | null;
}

export interface AqisCategoryGroup {
  category: string;
  category_title: string;
  items: AqisRow[];
}

// ── Customs Notices ───────────────────────────────────────────────

export interface CustomsNoticeRow {
  id: number;
  notice_number: string;
  title: string;
  year: number;
  category: string;
  summary: string | null;
  effective_date: string | null;
}

export interface NoticeYearGroup {
  year: number;
  notices: CustomsNoticeRow[];
}

// ── Dumping Notices ────────────────────────────────────────────────

export interface DumpingRow {
  id: number;
  commodity: string;
  countries: string;
  measure_type: string;
  duty_info: string | null;
  tariff_chapters: string | null;
  status: string;
  expiry_info: string | null;
  category: string;
  notes: string | null;
}

export interface DumpCategoryGroup {
  category: string;
  notices: DumpingRow[];
}

// ── ABF Reference Files & CP Questions ─────────────────────────────

export interface RefFileRow {
  id: number;
  file_code: string;
  file_name: string;
  category: string;
  description: string;
}

export interface RefCategoryGroup {
  category: string;
  files: RefFileRow[];
}

export interface CPQuestionRow {
  id: number;
  cp_number: string;
  question_text: string;
  category: string;
  applies_to: string | null;
  answer_y: string | null;
  answer_n: string | null;
  effective_date: string | null;
  notes: string | null;
}

export interface CPCategoryGroup {
  category: string;
  questions: CPQuestionRow[];
}

// ── AHECC Codes ────────────────────────────────────────────────────

export interface AHECCRow {
  id: number;
  section_number: string;
  section_title: string;
  chapter_number: string;
  chapter_title: string;
}

export interface AHECCSectionGroup {
  section_number: string;
  section_title: string;
  chapters: AHECCRow[];
}

// ── Schedule 2: Interpretative Rules ───────────────────────────────

export interface RuleData {
  rule: string;
  title: string;
  description: string;
}

// ── Active View Union ──────────────────────────────────────────────

export type ActiveView =
  | 'search'
  | 'schedule'
  | 'schedule-1'
  | 'schedule-2'
  | 'schedule-3'
  | 'schedule-4'
  | 'act'
  | 'regulations'
  | 'chemicals'
  | 'ahecc'
  | 'reffiles'
  | 'cpquestions'
  | 'dumping'
  | 'gst-act'
  | 'gst-regs'
  | 'bio-act'
  | 'bio-regs'
  | 'td-act'
  | 'td-regs'
  | 'intl-ob'
  | 'pe-regs'
  | 'customs-reg'
  | 'ct-act'
  | 'ct-regs'
  | 'ad-act'
  | 'il-act'
  | 'il-reg'
  | 'ifc-act'
  | 'ifc-reg'
  | 'acn'
  | 'aqis'
  | 'precedents'
  | 'compendium'
  | 'tco'
  | 'alpha-index'
  | 'hsen'
  | 'cbp-rulings'
  | 'updates'
  | 'library-updates';

// ── Library Tree Node ──────────────────────────────────────────────

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  viewKey?: string;
  apiEndpoint?: string;
}
