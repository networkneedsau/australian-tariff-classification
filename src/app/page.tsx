'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────

interface TariffResult {
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

interface CustomsEntryFields {
  tariff_classification_code: string;
  tariff_stat_code: string;
  goods_description: string;
  unit_of_quantity: string;
  general_duty_rate: string;
  duty_payable: number | null;
  gst_applicable: boolean;
  gst_rate: number;
}

interface EntryResponse {
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
}

interface ScheduleInfo {
  id: string;
  label: string;
  title: string;
  dataSource: 'countries' | 'sections' | 'fta' | 'external' | 'rules';
  abfUrl: string;
  ftaScheduleKey?: string;
}

interface SectionData {
  number: number;
  title: string;
  chapters: { number: number; title: string }[];
}

interface CountryData {
  id: number;
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

interface FtaExclusionRow {
  hs_code: string;
  description: string;
  fta_name: string;
  duty_rate: string | null;
}

// ── Customs Act 1901 ───────────────────────────────────────────────

// All legislation is served locally — no external links

interface ActSectionRow {
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

interface ActPartGroup {
  part: string;
  part_title: string;
  sections: ActSectionRow[];
}

// ── Prohibited Imports Regulations 1956 ────────────────────────────

interface RegulationRow {
  id: number;
  part: string | null;
  part_title: string | null;
  regulation_number: string;
  regulation_title: string;
  category: string | null;
  content: string | null;
}

interface RegPartGroup {
  part: string;
  part_title: string;
  regulations: RegulationRow[];
}

// ── Chemical Index (CWC Schedules 1-3) ─────────────────────────────

interface ChemicalRow {
  id: number;
  cwc_schedule: string;
  item_number: string;
  chemical_name: string;
  cas_number: string | null;
  category: string;
  notes: string | null;
}

interface ChemScheduleGroup {
  schedule: string;
  chemicals: ChemicalRow[];
}

// ── GST Act 1999 ──────────────────────────────────────────────────

interface GstActRow {
  id: number;
  chapter: string;
  chapter_title: string;
  part: string | null;
  part_title: string | null;
  division: string;
  division_title: string;
  content: string | null;
}

interface GstActChapterGroup {
  chapter: string;
  chapter_title: string;
  divisions: GstActRow[];
}

// ── GST Regulations 2019 ──────────────────────────────────────────

interface GstRegRow {
  id: number;
  chapter: string;
  chapter_title: string;
  part: string | null;
  part_title: string | null;
  division: string;
  division_title: string;
  subdivision: string | null;
}

interface GstRegChapterGroup {
  chapter: string;
  chapter_title: string;
  divisions: GstRegRow[];
}

// ── Biosecurity Act 2015 / Regulation 2016 ────────────────────────

interface BioActRow {
  id: number; chapter: string; chapter_title: string;
  part: string | null; part_title: string | null;
  division: string | null; division_title: string | null;
  section_range: string | null;
}
interface BioChapterGroup { chapter: string; chapter_title: string; entries: BioActRow[]; }

// ── Commerce (Trade Descriptions) ─────────────────────────────────

interface TdActRow { id: number; part: string; part_title: string; section_number: string; section_title: string; content: string | null; }
interface TdActPartGroup { part: string; part_title: string; sections: TdActRow[]; }

interface TdRegRow { id: number; part: string; part_title: string; division: string | null; division_title: string | null; subdivision: string | null; regulation_number: string; regulation_title: string; content: string | null; }
interface TdRegPartGroup { part: string; part_title: string; regulations: TdRegRow[]; }

// ── Customs (International Obligations) Regulation 2015 ───────────

interface IntlObRow { id: number; part: string; part_title: string; division: string | null; division_title: string | null; regulation_number: string; regulation_title: string; content: string | null; }
interface IntlObPartGroup { part: string; part_title: string; regulations: IntlObRow[]; }

// ── Customs (Prohibited Exports) Regulations 1958 ─────────────────
// Reuses IntlObRow/IntlObPartGroup interfaces (same structure)

// ── AQIS Producer ─────────────────────────────────────────────────

interface AqisRow {
  id: number;
  category: string;
  category_title: string;
  item_type: string;
  item_title: string;
  description: string | null;
  requirements: string | null;
  notes: string | null;
}

interface AqisCategoryGroup {
  category: string;
  category_title: string;
  items: AqisRow[];
}

// ── Customs Notices ───────────────────────────────────────────────

interface CustomsNoticeRow {
  id: number;
  notice_number: string;
  title: string;
  year: number;
  category: string;
  summary: string | null;
  effective_date: string | null;
}

interface NoticeYearGroup {
  year: number;
  notices: CustomsNoticeRow[];
}

// ── Illegal Logging Prohibition ────────────────────────────────────
// Act reuses TdActRow/TdActPartGroup (same part/section structure)
// Reg reuses IntlObRow/IntlObPartGroup (same part/regulation structure)

// ── Dumping Notices ────────────────────────────────────────────────

interface DumpingRow {
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

interface DumpCategoryGroup {
  category: string;
  notices: DumpingRow[];
}

// ── ABF Reference Files & CP Questions ─────────────────────────────

interface RefFileRow {
  id: number;
  file_code: string;
  file_name: string;
  category: string;
  description: string;
}

interface RefCategoryGroup {
  category: string;
  files: RefFileRow[];
}

interface CPQuestionRow {
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

interface CPCategoryGroup {
  category: string;
  questions: CPQuestionRow[];
}

// ── AHECC Codes ────────────────────────────────────────────────────

interface AHECCRow {
  id: number;
  section_number: string;
  section_title: string;
  chapter_number: string;
  chapter_title: string;
}

interface AHECCSectionGroup {
  section_number: string;
  section_title: string;
  chapters: AHECCRow[];
}

// ── Schedule 2: Interpretative Rules ───────────────────────────────

interface RuleData {
  rule: string;
  title: string;
  description: string;
}

const SCHEDULE_2_RULES: RuleData[] = [
  { rule: 'Rule 1', title: 'Classification by heading', description: 'Classification is determined by the terms of the headings and any relative Section or Chapter Notes. Classification by other rules applies only when headings or Notes do not otherwise require.' },
  { rule: 'Rule 2', title: 'Incomplete articles and mixtures', description: '(a) References to an article include that article incomplete or unfinished, provided it has the essential character of the complete article, including articles presented unassembled or disassembled. (b) References to a material or substance include mixtures or combinations of that material with other materials or substances. Goods of two or more materials are classified per Rule 3.' },
  { rule: 'Rule 3', title: 'Multiple heading classification', description: 'When goods are classifiable under two or more headings: (a) the most specific description is preferred; (b) mixtures, composite goods, and goods in sets are classified by the material or component giving essential character; (c) when (a) and (b) do not apply, classify under the last in numerical order.' },
  { rule: 'Rule 4', title: 'Most akin goods', description: 'Goods which cannot be classified under Rules 1 to 3 shall be classified under the heading appropriate to the goods to which they are most akin.' },
  { rule: 'Rule 5', title: 'Containers and packing', description: '(a) Camera cases, musical instrument cases, and similar containers specially shaped for specific articles are classified with those articles when presented with them and of a kind normally sold therewith. (b) Packing materials and containers presented with goods are classified with those goods if they are of a kind normally used for packing, unless clearly suitable for repetitive use.' },
  { rule: 'Rule 6', title: 'Subheading classification', description: 'Classification at the subheading level is determined by the terms of those subheadings and any related Subheading Notes, applying Rules 1 to 5 mutatis mutandis. Only subheadings at the same level are comparable.' },
];

// ── Schedule Definitions ───────────────────────────────────────────

const ABF_BASE = 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff';

const SCHEDULES: ScheduleInfo[] = [
  { id: '1', label: 'Schedule 1', title: 'Countries and places — preferential duty rates', dataSource: 'countries', abfUrl: `${ABF_BASE}/schedule-1` },
  { id: '2', label: 'Schedule 2', title: 'Interpretative Rules', dataSource: 'rules', abfUrl: `${ABF_BASE}/schedule-2` },
  { id: '3', label: 'Schedule 3', title: 'Classification of goods and rates of duty', dataSource: 'sections', abfUrl: `${ABF_BASE}/schedule-3` },
  { id: '4', label: 'Schedule 4', title: 'Concessional duty rate goods', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-4`, ftaScheduleKey: 'Schedule 4' },
  { id: '4a', label: 'Schedule 4A', title: 'Singapore — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-4a`, ftaScheduleKey: 'Schedule 4A' },
  { id: '5', label: 'Schedule 5', title: 'United States — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-5`, ftaScheduleKey: 'Schedule 5' },
  { id: '6', label: 'Schedule 6', title: 'Thailand — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-6`, ftaScheduleKey: 'Schedule 6' },
  { id: '6a', label: 'Schedule 6A', title: 'Peru — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-6a`, ftaScheduleKey: 'Schedule 6A' },
  { id: '7', label: 'Schedule 7', title: 'Chile — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-7`, ftaScheduleKey: 'Schedule 7' },
  { id: '8', label: 'Schedule 8', title: 'AANZFTA — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8`, ftaScheduleKey: 'Schedule 8' },
  { id: '8a', label: 'Schedule 8A', title: 'Pacific Island — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8a`, ftaScheduleKey: 'Schedule 8A' },
  { id: '8b', label: 'Schedule 8B', title: 'CPTPP — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8b`, ftaScheduleKey: 'Schedule 8B' },
  { id: '9', label: 'Schedule 9', title: 'Malaysia — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-9`, ftaScheduleKey: 'Schedule 9' },
  { id: '9a', label: 'Schedule 9A', title: 'Indonesia — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-9a`, ftaScheduleKey: 'Schedule 9A' },
  { id: '10', label: 'Schedule 10', title: 'Korea — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-10`, ftaScheduleKey: 'Schedule 10' },
  { id: '10a', label: 'Schedule 10A', title: 'India — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-10a`, ftaScheduleKey: 'Schedule 10A' },
  { id: '11', label: 'Schedule 11', title: 'Japan — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-11`, ftaScheduleKey: 'Schedule 11' },
  { id: '12', label: 'Schedule 12', title: 'China — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-12`, ftaScheduleKey: 'Schedule 12' },
  { id: '13', label: 'Schedule 13', title: 'Hong Kong — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-13`, ftaScheduleKey: 'Schedule 13' },
  { id: '14', label: 'Schedule 14', title: 'RCEP — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-14`, ftaScheduleKey: 'Schedule 14' },
  { id: '15', label: 'Schedule 15', title: 'United Kingdom — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-15`, ftaScheduleKey: 'Schedule 15' },
  { id: '16', label: 'Schedule 16', title: 'UAE — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-16`, ftaScheduleKey: 'Schedule 16' },
];

// ── Component ──────────────────────────────────────────────────────

export default function TariffSearchPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TariffResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryResponse | null>(null);
  const [customsFields, setCustomsFields] = useState<CustomsEntryFields | null>(null);
  const [customsValue, setCustomsValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Schedule browse state
  const [activeView, setActiveView] = useState<'search' | 'schedule' | 'act' | 'regulations' | 'chemicals' | 'ahecc' | 'reffiles' | 'cpquestions' | 'dumping' | 'gst-act' | 'gst-regs' | 'bio-act' | 'bio-regs' | 'td-act' | 'td-regs' | 'intl-ob' | 'pe-regs' | 'customs-reg' | 'ct-act' | 'ct-regs' | 'ad-act' | 'il-act' | 'il-reg' | 'ifc-act' | 'ifc-reg' | 'acn' | 'aqis' | 'precedents' | 'compendium' | 'tco' | 'alpha-index' | 'hsen'>('search');
  const [activeSchedule, setActiveSchedule] = useState<ScheduleInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [complianceDropdownOpen, setComplianceDropdownOpen] = useState(false);
  const complianceDropdownRef = useRef<HTMLDivElement>(null);
  const [legislationDropdownOpen, setLegislationDropdownOpen] = useState(false);
  const legislationDropdownRef = useRef<HTMLDivElement>(null);
  const [referenceDropdownOpen, setReferenceDropdownOpen] = useState(false);
  const referenceRef = useRef<HTMLDivElement>(null);

  // Schedule data
  const [sections, setSections] = useState<SectionData[]>([]);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [ftaExclusions, setFtaExclusions] = useState<FtaExclusionRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Customs Act data
  const [actSections, setActSections] = useState<ActSectionRow[]>([]);
  const [actParts, setActParts] = useState<ActPartGroup[]>([]);
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const [actLoading, setActLoading] = useState(false);
  const [expandedActSection, setExpandedActSection] = useState<number | null>(null);

  // Prohibited Imports Regulations data
  const [regsData, setRegsData] = useState<RegulationRow[]>([]);
  const [regParts, setRegParts] = useState<RegPartGroup[]>([]);
  const [expandedRegPart, setExpandedRegPart] = useState<string | null>(null);
  const [regsLoading, setRegsLoading] = useState(false);
  const [expandedRegSection, setExpandedRegSection] = useState<number | null>(null);

  // GST Act data
  const [gstActData, setGstActData] = useState<GstActRow[]>([]);
  const [gstActChapters, setGstActChapters] = useState<GstActChapterGroup[]>([]);
  const [expandedGstActCh, setExpandedGstActCh] = useState<string | null>(null);
  const [gstActLoading, setGstActLoading] = useState(false);
  const [expandedGstActDiv, setExpandedGstActDiv] = useState<number | null>(null);

  // GST Regs data
  const [gstRegsData, setGstRegsData] = useState<GstRegRow[]>([]);
  const [gstRegsChapters, setGstRegsChapters] = useState<GstRegChapterGroup[]>([]);
  const [expandedGstRegsCh, setExpandedGstRegsCh] = useState<string | null>(null);
  const [gstRegsLoading, setGstRegsLoading] = useState(false);

  // Biosecurity Act data
  const [bioActData, setBioActData] = useState<BioActRow[]>([]);
  const [bioActChapters, setBioActChapters] = useState<BioChapterGroup[]>([]);
  const [expandedBioActCh, setExpandedBioActCh] = useState<string | null>(null);
  const [bioActLoading, setBioActLoading] = useState(false);
  // Biosecurity Regs data
  const [bioRegsData, setBioRegsData] = useState<BioActRow[]>([]);
  const [bioRegsChapters, setBioRegsChapters] = useState<BioChapterGroup[]>([]);
  const [expandedBioRegsCh, setExpandedBioRegsCh] = useState<string | null>(null);
  const [bioRegsLoading, setBioRegsLoading] = useState(false);

  // International Obligations data
  const [intlObData, setIntlObData] = useState<IntlObRow[]>([]);
  const [intlObParts, setIntlObParts] = useState<IntlObPartGroup[]>([]);
  const [expandedIntlObPart, setExpandedIntlObPart] = useState<string | null>(null);
  const [intlObLoading, setIntlObLoading] = useState(false);
  const [expandedIntlObSection, setExpandedIntlObSection] = useState<number | null>(null);

  // Anti-Dumping Act data
  const [adActData, setAdActData] = useState<TdActRow[]>([]);
  const [adActParts, setAdActParts] = useState<TdActPartGroup[]>([]);
  const [expandedAdActPart, setExpandedAdActPart] = useState<string | null>(null);
  const [adActLoading, setAdActLoading] = useState(false);
  const [expandedAdSection, setExpandedAdSection] = useState<number | null>(null);

  // Customs Tariff Act/Regs data
  const [ctActData, setCtActData] = useState<TdActRow[]>([]);
  const [ctActParts, setCtActParts] = useState<TdActPartGroup[]>([]);
  const [expandedCtActPart, setExpandedCtActPart] = useState<string | null>(null);
  const [ctActLoading, setCtActLoading] = useState(false);
  const [ctRegsData, setCtRegsData] = useState<TdActRow[]>([]);
  const [ctRegsParts, setCtRegsParts] = useState<TdActPartGroup[]>([]);
  const [expandedCtRegsPart, setExpandedCtRegsPart] = useState<string | null>(null);
  const [ctRegsLoading, setCtRegsLoading] = useState(false);
  const [expandedCtSection, setExpandedCtSection] = useState<number | null>(null);

  // Customs Regulation 2015 data
  const [crData, setCrData] = useState<IntlObRow[]>([]);
  const [crParts, setCrParts] = useState<IntlObPartGroup[]>([]);
  const [expandedCrPart, setExpandedCrPart] = useState<string | null>(null);
  const [crLoading, setCrLoading] = useState(false);
  const [expandedCrSection, setExpandedCrSection] = useState<number | null>(null);

  // Prohibited Exports data
  const [peData, setPeData] = useState<IntlObRow[]>([]);
  const [peParts, setPeParts] = useState<IntlObPartGroup[]>([]);
  const [expandedPePart, setExpandedPePart] = useState<string | null>(null);
  const [peLoading, setPeLoading] = useState(false);
  const [expandedPeSection, setExpandedPeSection] = useState<number | null>(null);

  // Trade Descriptions data
  const [tdActData, setTdActData] = useState<TdActRow[]>([]);
  const [tdActParts, setTdActParts] = useState<TdActPartGroup[]>([]);
  const [expandedTdActPart, setExpandedTdActPart] = useState<string | null>(null);
  const [tdActLoading, setTdActLoading] = useState(false);
  const [tdRegsData, setTdRegsData] = useState<TdRegRow[]>([]);
  const [tdRegsParts, setTdRegsParts] = useState<TdRegPartGroup[]>([]);
  const [expandedTdRegsPart, setExpandedTdRegsPart] = useState<string | null>(null);
  const [tdRegsLoading, setTdRegsLoading] = useState(false);
  const [expandedTdSection, setExpandedTdSection] = useState<number | null>(null);

  // AQIS Producer data
  const [aqisData, setAqisData] = useState<AqisRow[]>([]);
  const [aqisCategories, setAqisCategories] = useState<AqisCategoryGroup[]>([]);
  const [expandedAqisCat, setExpandedAqisCat] = useState<string | null>(null);
  const [aqisLoading, setAqisLoading] = useState(false);

  // Customs Notices data
  const [acnData, setAcnData] = useState<CustomsNoticeRow[]>([]);
  const [acnYears, setAcnYears] = useState<NoticeYearGroup[]>([]);
  const [expandedAcnYear, setExpandedAcnYear] = useState<number | null>(null);
  const [acnLoading, setAcnLoading] = useState(false);

  // Illegal Logging Act data
  const [ilActData, setIlActData] = useState<TdActRow[]>([]);
  const [ilActParts, setIlActParts] = useState<TdActPartGroup[]>([]);
  const [expandedIlActPart, setExpandedIlActPart] = useState<string | null>(null);
  const [ilActLoading, setIlActLoading] = useState(false);
  // Illegal Logging Reg data
  const [ilRegData, setIlRegData] = useState<IntlObRow[]>([]);
  const [ilRegParts, setIlRegParts] = useState<IntlObPartGroup[]>([]);
  const [expandedIlRegPart, setExpandedIlRegPart] = useState<string | null>(null);
  const [ilRegLoading, setIlRegLoading] = useState(false);

  // Imported Food Control Act data
  const [ifcActData, setIfcActData] = useState<TdActRow[]>([]);
  const [ifcActParts, setIfcActParts] = useState<TdActPartGroup[]>([]);
  const [expandedIfcActPart, setExpandedIfcActPart] = useState<string | null>(null);
  const [ifcActLoading, setIfcActLoading] = useState(false);
  // Imported Food Control Reg data
  const [ifcRegData, setIfcRegData] = useState<IntlObRow[]>([]);
  const [ifcRegParts, setIfcRegParts] = useState<IntlObPartGroup[]>([]);
  const [expandedIfcRegPart, setExpandedIfcRegPart] = useState<string | null>(null);
  const [ifcRegLoading, setIfcRegLoading] = useState(false);

  // Precedents, Compendium, TCO, Alpha Index, HSEN data
  const [genericData, setGenericData] = useState<Record<string, {data: any[], categories: {key: string, title: string, items: any[]}[], loading: boolean}>>({});

  // Dumping notices data
  const [dumpData, setDumpData] = useState<DumpingRow[]>([]);
  const [dumpCategories, setDumpCategories] = useState<DumpCategoryGroup[]>([]);
  const [expandedDumpCat, setExpandedDumpCat] = useState<string | null>(null);
  const [dumpLoading, setDumpLoading] = useState(false);

  // ABF Reference Files data
  const [refFilesData, setRefFilesData] = useState<RefFileRow[]>([]);
  const [refCategories, setRefCategories] = useState<RefCategoryGroup[]>([]);
  const [expandedRefCat, setExpandedRefCat] = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);

  // CP Questions data
  const [cpData, setCpData] = useState<CPQuestionRow[]>([]);
  const [cpCategories, setCpCategories] = useState<CPCategoryGroup[]>([]);
  const [expandedCpCat, setExpandedCpCat] = useState<string | null>(null);
  const [cpLoading, setCpLoading] = useState(false);

  // AHECC data
  const [aheccData, setAheccData] = useState<AHECCRow[]>([]);
  const [aheccSections, setAheccSections] = useState<AHECCSectionGroup[]>([]);
  const [expandedAheccSection, setExpandedAheccSection] = useState<string | null>(null);
  const [aheccLoading, setAheccLoading] = useState(false);

  // Chemical index data
  const [chemsData, setChemsData] = useState<ChemicalRow[]>([]);
  const [chemGroups, setChemGroups] = useState<ChemScheduleGroup[]>([]);
  const [expandedChemSchedule, setExpandedChemSchedule] = useState<string | null>(null);
  const [chemsLoading, setChemsLoading] = useState(false);

  // Scoped filter state
  const [actFilter, setActFilter] = useState('');
  const [regsFilter, setRegsFilter] = useState('');
  const [chemsFilter, setChemsFilter] = useState('');
  const [aheccFilter, setAheccFilter] = useState('');
  const [refFilter, setRefFilter] = useState('');
  const [cpFilter, setCpFilter] = useState('');
  const [dumpFilter, setDumpFilter] = useState('');
  const [ilActFilter, setIlActFilter] = useState('');
  const [ilRegFilter, setIlRegFilter] = useState('');
  const [ifcActFilter, setIfcActFilter] = useState('');
  const [ifcRegFilter, setIfcRegFilter] = useState('');
  const [genericFilter, setGenericFilter] = useState<Record<string, string>>({});
  const [acnFilter, setAcnFilter] = useState('');
  const [aqisFilter, setAqisFilter] = useState('');
  const [gstActFilter, setGstActFilter] = useState('');
  const [gstRegsFilter, setGstRegsFilter] = useState('');
  const [bioActFilter, setBioActFilter] = useState('');
  const [bioRegsFilter, setBioRegsFilter] = useState('');
  const [tdActFilter, setTdActFilter] = useState('');
  const [tdRegsFilter, setTdRegsFilter] = useState('');
  const [intlObFilter, setIntlObFilter] = useState('');
  const [peFilter, setPeFilter] = useState('');
  const [crFilter, setCrFilter] = useState('');
  const [ctActFilter, setCtActFilter] = useState('');
  const [ctRegsFilter, setCtRegsFilter] = useState('');
  const [adActFilter, setAdActFilter] = useState('');
  const [rulesFilter, setRulesFilter] = useState('');
  const [sectionsFilter, setSectionsFilter] = useState('');
  const [ftaFilter, setFtaFilter] = useState('');

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (complianceDropdownRef.current && !complianceDropdownRef.current.contains(e.target as Node)) {
        setComplianceDropdownOpen(false);
      }
      if (legislationDropdownRef.current && !legislationDropdownRef.current.contains(e.target as Node)) {
        setLegislationDropdownOpen(false);
      }
      if (referenceRef.current && !referenceRef.current.contains(e.target as Node)) {
        setReferenceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Search logic ─────────────────────────────────────────────────

  const [searchActResults, setSearchActResults] = useState<ActSectionRow[]>([]);
  const [searchActTotal, setSearchActTotal] = useState(0);
  const [searchRegsResults, setSearchRegsResults] = useState<RegulationRow[]>([]);
  const [searchRegsTotal, setSearchRegsTotal] = useState(0);
  const [searchChemsResults, setSearchChemsResults] = useState<ChemicalRow[]>([]);
  const [searchChemsTotal, setSearchChemsTotal] = useState(0);
  const [searchAheccResults, setSearchAheccResults] = useState<AHECCRow[]>([]);
  const [searchAheccTotal, setSearchAheccTotal] = useState(0);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setTotal(0); setSearchActResults([]); setSearchActTotal(0); setSearchRegsResults([]); setSearchRegsTotal(0); setSearchChemsResults([]); setSearchChemsTotal(0); setSearchAheccResults([]); setSearchAheccTotal(0); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tariff/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setSearchActResults(data.actResults || []);
      setSearchActTotal(data.actTotal || 0);
      setSearchRegsResults(data.regsResults || []);
      setSearchRegsTotal(data.regsTotal || 0);
      setSearchChemsResults(data.chemsResults || []);
      setSearchChemsTotal(data.chemsTotal || 0);
      setSearchAheccResults(data.aheccResults || []);
      setSearchAheccTotal(data.aheccTotal || 0);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const selectTariff = async (code: string) => {
    const res = await fetch(`/api/tariff/for-entry/${encodeURIComponent(code)}`);
    if (!res.ok) return;
    const data: EntryResponse = await res.json();
    setSelectedEntry(data);
    setCustomsFields(data.customs_entry_fields);
    setCustomsValue('');
  };

  // Recalculate duty when customs value changes
  useEffect(() => {
    if (!customsFields || !customsValue) {
      if (customsFields) setCustomsFields(f => f ? { ...f, duty_payable: null } : null);
      return;
    }
    const cv = parseFloat(customsValue);
    if (isNaN(cv)) return;
    const rate = customsFields.general_duty_rate;
    let duty = 0;
    if (rate !== 'Free' && rate !== 'Free Free') {
      const m = rate.match(/^(\d+(?:\.\d+)?)\s*%/);
      if (m) duty = cv * (parseFloat(m[1]) / 100);
    }
    setCustomsFields(f => f ? { ...f, duty_payable: Math.round(duty * 100) / 100 } : null);
  }, [customsValue]);

  const gstAmount = customsValue && customsFields?.duty_payable !== null && customsFields?.duty_payable !== undefined
    ? (parseFloat(customsValue) + customsFields.duty_payable) * 0.1
    : null;
  const totalPayable = customsFields?.duty_payable !== null && customsFields?.duty_payable !== undefined && gstAmount !== null
    ? customsFields.duty_payable + gstAmount
    : null;

  // ── Schedule selection ───────────────────────────────────────────

  const selectSchedule = async (schedule: ScheduleInfo) => {
    setDropdownOpen(false);
    setActiveSchedule(schedule);
    setActiveView('schedule');
    setScheduleLoading(true);
    setRulesFilter('');
    setSectionsFilter('');
    setFtaFilter('');

    try {
      if (schedule.dataSource === 'countries') {
        const res = await fetch('/api/tariff/countries');
        const data = await res.json();
        setCountries(data);
        setCountryFilter('');
      } else if (schedule.dataSource === 'sections') {
        const res = await fetch('/api/tariff/sections');
        const data = await res.json();
        setSections(data);
        setExpandedSection(null);
      } else if (schedule.dataSource === 'fta' && schedule.ftaScheduleKey) {
        const res = await fetch(`/api/tariff/fta/schedule/${encodeURIComponent(schedule.ftaScheduleKey)}`);
        const data = await res.json();
        setFtaExclusions(data);
      }
    } catch {
      // If fetch fails, user can still view ABF link
    } finally {
      setScheduleLoading(false);
    }
  };

  const goHome = () => {
    setActiveView('search');
    setActiveSchedule(null);
  };

  const browseChapter = (chapterNum: number) => {
    const prefix = String(chapterNum).padStart(2, '0');
    setActiveView('search');
    setActiveSchedule(null);
    setQuery(prefix);
    search(prefix);
  };

  // ── Filtered countries ───────────────────────────────────────────

  const filteredCountries = countryFilter
    ? countries.filter(c =>
        c.country.toLowerCase().includes(countryFilter.toLowerCase()) ||
        c.abbreviation.toLowerCase().includes(countryFilter.toLowerCase()) ||
        c.category.toLowerCase().includes(countryFilter.toLowerCase())
      )
    : countries;

  // ── Filtered data ───────────────────────────────────────────────

  const filteredActParts = actFilter
    ? actParts.filter(p =>
        p.part.toLowerCase().includes(actFilter.toLowerCase()) ||
        p.part_title.toLowerCase().includes(actFilter.toLowerCase()) ||
        p.sections.some(s =>
          s.section_number.toLowerCase().includes(actFilter.toLowerCase()) ||
          s.section_title.toLowerCase().includes(actFilter.toLowerCase()) ||
          (s.division_title || '').toLowerCase().includes(actFilter.toLowerCase())
        )
      )
    : actParts;

  const filteredGstActChapters = gstActFilter
    ? gstActChapters.map(c => ({
        ...c,
        divisions: c.divisions.filter(d =>
          d.division.toLowerCase().includes(gstActFilter.toLowerCase()) ||
          d.division_title.toLowerCase().includes(gstActFilter.toLowerCase()) ||
          (d.part_title || '').toLowerCase().includes(gstActFilter.toLowerCase())
        )
      })).filter(c => c.divisions.length > 0)
    : gstActChapters;

  const filteredGstRegsChapters = gstRegsFilter
    ? gstRegsChapters.map(c => ({
        ...c,
        divisions: c.divisions.filter(d =>
          d.division.toLowerCase().includes(gstRegsFilter.toLowerCase()) ||
          d.division_title.toLowerCase().includes(gstRegsFilter.toLowerCase()) ||
          (d.part_title || '').toLowerCase().includes(gstRegsFilter.toLowerCase()) ||
          (d.subdivision || '').toLowerCase().includes(gstRegsFilter.toLowerCase())
        )
      })).filter(c => c.divisions.length > 0)
    : gstRegsChapters;

  const filteredBioActChapters = bioActFilter
    ? bioActChapters.map(c => ({ ...c, entries: c.entries.filter(e => (e.part_title || '').toLowerCase().includes(bioActFilter.toLowerCase()) || (e.division_title || '').toLowerCase().includes(bioActFilter.toLowerCase()) || (e.section_range || '').toLowerCase().includes(bioActFilter.toLowerCase())) })).filter(c => c.entries.length > 0)
    : bioActChapters;

  const filteredBioRegsChapters = bioRegsFilter
    ? bioRegsChapters.map(c => ({ ...c, entries: c.entries.filter(e => (e.part_title || '').toLowerCase().includes(bioRegsFilter.toLowerCase()) || (e.division_title || '').toLowerCase().includes(bioRegsFilter.toLowerCase()) || (e.section_range || '').toLowerCase().includes(bioRegsFilter.toLowerCase())) })).filter(c => c.entries.length > 0)
    : bioRegsChapters;

  const filteredIntlObParts = intlObFilter
    ? intlObParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_title.toLowerCase().includes(intlObFilter.toLowerCase()) || r.regulation_number.toLowerCase().includes(intlObFilter.toLowerCase()) || (r.division_title || '').toLowerCase().includes(intlObFilter.toLowerCase()) || (r.content || '').toLowerCase().includes(intlObFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : intlObParts;

  const filteredAdActParts = adActFilter
    ? adActParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_title.toLowerCase().includes(adActFilter.toLowerCase()) || s.section_number.toLowerCase().includes(adActFilter.toLowerCase()) || (s.content || '').toLowerCase().includes(adActFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : adActParts;

  const filteredCtActParts = ctActFilter
    ? ctActParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_title.toLowerCase().includes(ctActFilter.toLowerCase()) || s.section_number.toLowerCase().includes(ctActFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : ctActParts;

  const filteredCtRegsParts = ctRegsFilter
    ? ctRegsParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_title.toLowerCase().includes(ctRegsFilter.toLowerCase()) || s.section_number.toLowerCase().includes(ctRegsFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : ctRegsParts;

  const filteredCrParts = crFilter
    ? crParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_title.toLowerCase().includes(crFilter.toLowerCase()) || r.regulation_number.toLowerCase().includes(crFilter.toLowerCase()) || (r.division_title || '').toLowerCase().includes(crFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : crParts;

  const filteredPeParts = peFilter
    ? peParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_title.toLowerCase().includes(peFilter.toLowerCase()) || r.regulation_number.toLowerCase().includes(peFilter.toLowerCase()) || (r.division_title || '').toLowerCase().includes(peFilter.toLowerCase()) || (r.content || '').toLowerCase().includes(peFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : peParts;

  const filteredTdActParts = tdActFilter
    ? tdActParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_title.toLowerCase().includes(tdActFilter.toLowerCase()) || s.section_number.toLowerCase().includes(tdActFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : tdActParts;

  const filteredTdRegsParts = tdRegsFilter
    ? tdRegsParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_title.toLowerCase().includes(tdRegsFilter.toLowerCase()) || r.regulation_number.toLowerCase().includes(tdRegsFilter.toLowerCase()) || (r.division_title || '').toLowerCase().includes(tdRegsFilter.toLowerCase()) || (r.subdivision || '').toLowerCase().includes(tdRegsFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : tdRegsParts;

  const filteredIlActParts = ilActFilter
    ? ilActParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_number.toLowerCase().includes(ilActFilter.toLowerCase()) || s.section_title.toLowerCase().includes(ilActFilter.toLowerCase()) || (s.content || '').toLowerCase().includes(ilActFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : ilActParts;

  const filteredIlRegParts = ilRegFilter
    ? ilRegParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_number.toLowerCase().includes(ilRegFilter.toLowerCase()) || r.regulation_title.toLowerCase().includes(ilRegFilter.toLowerCase()) || (r.content || '').toLowerCase().includes(ilRegFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : ilRegParts;

  const filteredAqisCategories = aqisFilter
    ? aqisCategories.map(c => ({ ...c, items: c.items.filter(i => i.item_title.toLowerCase().includes(aqisFilter.toLowerCase()) || (i.description || '').toLowerCase().includes(aqisFilter.toLowerCase()) || (i.requirements || '').toLowerCase().includes(aqisFilter.toLowerCase()) || (i.notes || '').toLowerCase().includes(aqisFilter.toLowerCase())) })).filter(c => c.items.length > 0)
    : aqisCategories;

  const filteredAcnYears = acnFilter
    ? acnYears.map(y => ({ ...y, notices: y.notices.filter(n => n.notice_number.toLowerCase().includes(acnFilter.toLowerCase()) || n.title.toLowerCase().includes(acnFilter.toLowerCase()) || n.category.toLowerCase().includes(acnFilter.toLowerCase()) || (n.summary || '').toLowerCase().includes(acnFilter.toLowerCase())) })).filter(y => y.notices.length > 0)
    : acnYears;

  const filteredIfcActParts = ifcActFilter
    ? ifcActParts.map(p => ({ ...p, sections: p.sections.filter(s => s.section_number.toLowerCase().includes(ifcActFilter.toLowerCase()) || s.section_title.toLowerCase().includes(ifcActFilter.toLowerCase()) || (s.content || '').toLowerCase().includes(ifcActFilter.toLowerCase())) })).filter(p => p.sections.length > 0)
    : ifcActParts;

  const filteredIfcRegParts = ifcRegFilter
    ? ifcRegParts.map(p => ({ ...p, regulations: p.regulations.filter(r => r.regulation_number.toLowerCase().includes(ifcRegFilter.toLowerCase()) || r.regulation_title.toLowerCase().includes(ifcRegFilter.toLowerCase()) || (r.content || '').toLowerCase().includes(ifcRegFilter.toLowerCase())) })).filter(p => p.regulations.length > 0)
    : ifcRegParts;

  const filteredDumpCategories = dumpFilter
    ? dumpCategories.map(c => ({
        ...c,
        notices: c.notices.filter(n =>
          n.commodity.toLowerCase().includes(dumpFilter.toLowerCase()) ||
          n.countries.toLowerCase().includes(dumpFilter.toLowerCase()) ||
          n.measure_type.toLowerCase().includes(dumpFilter.toLowerCase()) ||
          (n.notes || '').toLowerCase().includes(dumpFilter.toLowerCase()) ||
          (n.tariff_chapters || '').toLowerCase().includes(dumpFilter.toLowerCase())
        )
      })).filter(c => c.notices.length > 0)
    : dumpCategories;

  const filteredRefCategories = refFilter
    ? refCategories.map(c => ({
        ...c,
        files: c.files.filter(f =>
          f.file_code.toLowerCase().includes(refFilter.toLowerCase()) ||
          f.file_name.toLowerCase().includes(refFilter.toLowerCase()) ||
          f.description.toLowerCase().includes(refFilter.toLowerCase())
        )
      })).filter(c => c.files.length > 0)
    : refCategories;

  const filteredCpCategories = cpFilter
    ? cpCategories.map(c => ({
        ...c,
        questions: c.questions.filter(q =>
          q.question_text.toLowerCase().includes(cpFilter.toLowerCase()) ||
          q.cp_number.toLowerCase().includes(cpFilter.toLowerCase()) ||
          (q.applies_to || '').toLowerCase().includes(cpFilter.toLowerCase()) ||
          (q.notes || '').toLowerCase().includes(cpFilter.toLowerCase())
        )
      })).filter(c => c.questions.length > 0)
    : cpCategories;

  const filteredAheccSections = aheccFilter
    ? aheccSections.map(s => ({
        ...s,
        chapters: s.chapters.filter(c =>
          c.chapter_number.includes(aheccFilter) ||
          c.chapter_title.toLowerCase().includes(aheccFilter.toLowerCase()) ||
          s.section_title.toLowerCase().includes(aheccFilter.toLowerCase()) ||
          s.section_number.toLowerCase().includes(aheccFilter.toLowerCase())
        )
      })).filter(s => s.chapters.length > 0)
    : aheccSections;

  const filteredChemGroups = chemsFilter
    ? chemGroups.map(g => ({
        ...g,
        chemicals: g.chemicals.filter(c =>
          c.chemical_name.toLowerCase().includes(chemsFilter.toLowerCase()) ||
          (c.cas_number || '').toLowerCase().includes(chemsFilter.toLowerCase()) ||
          c.category.toLowerCase().includes(chemsFilter.toLowerCase()) ||
          (c.notes || '').toLowerCase().includes(chemsFilter.toLowerCase())
        )
      })).filter(g => g.chemicals.length > 0)
    : chemGroups;

  const filteredRegParts = regsFilter
    ? regParts.filter(p =>
        p.part.toLowerCase().includes(regsFilter.toLowerCase()) ||
        p.part_title.toLowerCase().includes(regsFilter.toLowerCase()) ||
        p.regulations.some(r =>
          r.regulation_number.toLowerCase().includes(regsFilter.toLowerCase()) ||
          r.regulation_title.toLowerCase().includes(regsFilter.toLowerCase()) ||
          (r.category || '').toLowerCase().includes(regsFilter.toLowerCase())
        )
      )
    : regParts;

  const filteredRules = rulesFilter
    ? SCHEDULE_2_RULES.filter(r =>
        r.rule.toLowerCase().includes(rulesFilter.toLowerCase()) ||
        r.title.toLowerCase().includes(rulesFilter.toLowerCase()) ||
        r.description.toLowerCase().includes(rulesFilter.toLowerCase())
      )
    : SCHEDULE_2_RULES;

  const filteredSections = sectionsFilter
    ? sections.filter(s =>
        s.title.toLowerCase().includes(sectionsFilter.toLowerCase()) ||
        `section ${toRoman(s.number)}`.toLowerCase().includes(sectionsFilter.toLowerCase()) ||
        s.chapters.some(c => c.title.toLowerCase().includes(sectionsFilter.toLowerCase()))
      )
    : sections;

  const filteredFta = ftaFilter
    ? ftaExclusions.filter(ex =>
        ex.hs_code.toLowerCase().includes(ftaFilter.toLowerCase()) ||
        ex.description.toLowerCase().includes(ftaFilter.toLowerCase()) ||
        (ex.duty_rate || '').toLowerCase().includes(ftaFilter.toLowerCase())
      )
    : ftaExclusions;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#001a33] to-[#003366] text-white py-2 px-6 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div>
            <h1
              className={`text-xl font-bold ${activeView !== 'search' ? 'cursor-pointer hover:text-blue-200' : ''}`}
              onClick={activeView !== 'search' ? goHome : undefined}
            >
              Australian Tariff Classification
            </h1>
            <p className="text-sm text-blue-200">
              {activeView === 'act'
                ? 'Customs Act 1901 — Table of Contents'
                : activeView === 'regulations'
                  ? 'Customs (Prohibited Imports) Regulations 1956'
                  : activeView === 'gst-act'
                    ? 'GST Act 1999 — Table of Contents'
                    : activeView === 'gst-regs'
                      ? 'GST Regulations 2019'
                      : activeView === 'bio-act'
                        ? 'Biosecurity Act 2015'
                        : activeView === 'bio-regs'
                          ? 'Biosecurity Regulation 2016'
                          : activeView === 'td-act'
                            ? 'Commerce (Trade Descriptions) Act 1905'
                            : activeView === 'td-regs'
                              ? 'Commerce (Trade Descriptions) Regulations 2016'
                              : activeView === 'intl-ob'
                                ? 'Customs (International Obligations) Regulation 2015'
                                : activeView === 'pe-regs'
                                  ? 'Customs (Prohibited Exports) Regulations 1958'
                                  : activeView === 'customs-reg'
                                    ? 'Customs Regulation 2015'
                                    : activeView === 'ct-act'
                                      ? 'Customs Tariff Act 1995'
                                      : activeView === 'ct-regs'
                                        ? 'Customs Tariff Regulations 2004'
                                        : activeView === 'ad-act'
                                          ? 'Customs Tariff (Anti-Dumping) Act 1975'
                                          : activeView === 'il-act'
                                            ? 'Illegal Logging Prohibition Act 2012'
                                            : activeView === 'il-reg'
                                              ? 'Illegal Logging Prohibition Regulation 2012'
                                              : activeView === 'ifc-act'
                                                ? 'Imported Food Control Act 1992'
                                                : activeView === 'ifc-reg'
                                                  ? 'Imported Food Control Regulation 2019'
                                                  : activeView === 'precedents'
                                                    ? 'Tariff Precedents & Classification Rules'
                                                    : activeView === 'compendium'
                                                      ? 'Compendium of Classification Opinions'
                                                      : activeView === 'tco'
                                                        ? 'Tariff Concession Orders (TCOs)'
                                                        : activeView === 'alpha-index'
                                                          ? 'HS Alphabetical Index'
                                                          : activeView === 'hsen'
                                                            ? 'HS Explanatory Notes (HSEN)'
                                                  : activeView === 'chemicals'
                    ? 'Chemical Index — CWC Scheduled Chemicals'
                    : activeView === 'ahecc'
                      ? 'AHECC — Export Commodity Classification'
                      : activeView === 'dumping'
                        ? 'Anti-Dumping & Countervailing Duty Notices'
                        : activeView === 'acn'
                          ? 'Australian Customs Notices'
                          : activeView === 'aqis'
                            ? 'AQIS Producer — Approved Establishments'
                            : activeView === 'reffiles'
                          ? 'ABF Software Reference Files'
                          : activeView === 'cpquestions'
                            ? 'Community Protection Questions'
                            : activeView === 'schedule' && activeSchedule
                  ? `${activeSchedule.label} — ${activeSchedule.title}`
                  : 'Search the Combined Australian Customs Tariff Nomenclature'}
            </p>
          </div>

          {/* Dropdowns row */}
          <div className="relative flex items-center gap-2">

            {/* ── Dropdown 1: Legislation ── */}
            <div className="static" ref={legislationDropdownRef}>
              <button
                onClick={() => { setLegislationDropdownOpen(!legislationDropdownOpen); setDropdownOpen(false); setComplianceDropdownOpen(false); setReferenceDropdownOpen(false); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                Legislation
                <svg className={`w-4 h-4 transition-transform ${legislationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {legislationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-0">
                    <div>
                      {/* Customs section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customs</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('act');
                          setActiveSchedule(null);
                          setActFilter('');
                          setExpandedPart(null);
                          if (actSections.length === 0) {
                            setActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/act');
                              const data: ActSectionRow[] = await res.json();
                              setActSections(data);
                              const groups: ActPartGroup[] = [];
                              const partMap = new Map<string, ActPartGroup>();
                              for (const s of data) {
                                let group = partMap.get(s.part);
                                if (!group) {
                                  group = { part: s.part, part_title: s.part_title, sections: [] };
                                  partMap.set(s.part, group);
                                  groups.push(group);
                                }
                                group.sections.push(s);
                              }
                              setActParts(groups);
                            } catch { /* */ }
                            finally { setActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">Act</span>
                        <span className="text-sm text-gray-700">Customs Act 1901</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('customs-reg');
                          setActiveSchedule(null);
                          setCrFilter('');
                          setExpandedCrPart(null);
                          if (crData.length === 0) {
                            setCrLoading(true);
                            try {
                              const res = await fetch('/api/tariff/customs-reg');
                              const data: IntlObRow[] = await res.json();
                              setCrData(data);
                              const groups: IntlObPartGroup[] = [];
                              const m = new Map<string, IntlObPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setCrParts(groups);
                            } catch { /* */ } finally { setCrLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">Regs</span>
                        <span className="text-sm text-gray-700">Customs Regulation 2015</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('regulations');
                          setActiveSchedule(null);
                          setRegsFilter('');
                          setExpandedRegPart(null);
                          if (regsData.length === 0) {
                            setRegsLoading(true);
                            try {
                              const res = await fetch('/api/tariff/regulations');
                              const data: RegulationRow[] = await res.json();
                              setRegsData(data);
                              const groups: RegPartGroup[] = [];
                              const partMap = new Map<string, RegPartGroup>();
                              for (const r of data) {
                                const key = r.part || 'Other';
                                let group = partMap.get(key);
                                if (!group) {
                                  group = { part: key, part_title: r.part_title || key, regulations: [] };
                                  partMap.set(key, group);
                                  groups.push(group);
                                }
                                group.regulations.push(r);
                              }
                              setRegParts(groups);
                            } catch { /* */ }
                            finally { setRegsLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">Imports</span>
                        <span className="text-sm text-gray-700">Prohibited Imports Regs 1956</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('pe-regs');
                          setActiveSchedule(null);
                          setPeFilter('');
                          setExpandedPePart(null);
                          if (peData.length === 0) {
                            setPeLoading(true);
                            try {
                              const res = await fetch('/api/tariff/prohibited-exports');
                              const data: IntlObRow[] = await res.json();
                              setPeData(data);
                              const groups: IntlObPartGroup[] = [];
                              const m = new Map<string, IntlObPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setPeParts(groups);
                            } catch { /* */ } finally { setPeLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-red-700 w-16 shrink-0 pt-0.5">Exports</span>
                        <span className="text-sm text-gray-700">Prohibited Exports Regs 1958</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('intl-ob');
                          setActiveSchedule(null);
                          setIntlObFilter('');
                          setExpandedIntlObPart(null);
                          if (intlObData.length === 0) {
                            setIntlObLoading(true);
                            try {
                              const res = await fetch('/api/tariff/intl-obligations');
                              const data: IntlObRow[] = await res.json();
                              setIntlObData(data);
                              const groups: IntlObPartGroup[] = [];
                              const m = new Map<string, IntlObPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setIntlObParts(groups);
                            } catch { /* */ } finally { setIntlObLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">Intl Ob</span>
                        <span className="text-sm text-gray-700">Intl Obligations Reg 2015</span>
                      </button>

                      <div className="border-t border-gray-100 mx-3" />

                      {/* Tariff section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tariff</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('ct-act');
                          setActiveSchedule(null);
                          setCtActFilter('');
                          setExpandedCtActPart(null);
                          if (ctActData.length === 0) {
                            setCtActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/customs-tariff-act');
                              const data: TdActRow[] = await res.json();
                              setCtActData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setCtActParts(groups);
                            } catch { /* */ } finally { setCtActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">Act</span>
                        <span className="text-sm text-gray-700">Customs Tariff Act 1995</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('ct-regs');
                          setActiveSchedule(null);
                          setCtRegsFilter('');
                          setExpandedCtRegsPart(null);
                          if (ctRegsData.length === 0) {
                            setCtRegsLoading(true);
                            try {
                              const res = await fetch('/api/tariff/customs-tariff-regs');
                              const data: TdActRow[] = await res.json();
                              setCtRegsData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setCtRegsParts(groups);
                            } catch { /* */ } finally { setCtRegsLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">Regs</span>
                        <span className="text-sm text-gray-700">Customs Tariff Regs 2004</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('ad-act');
                          setActiveSchedule(null);
                          setAdActFilter('');
                          setExpandedAdActPart(null);
                          if (adActData.length === 0) {
                            setAdActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/anti-dumping-act');
                              const data: TdActRow[] = await res.json();
                              setAdActData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setAdActParts(groups);
                            } catch { /* */ } finally { setAdActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-orange-700 w-16 shrink-0 pt-0.5">Anti-Dump</span>
                        <span className="text-sm text-gray-700">Anti-Dumping Act 1975</span>
                      </button>

                      <div className="border-t border-gray-100 mx-3" />

                      {/* Tax section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tax</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('gst-act');
                          setActiveSchedule(null);
                          setGstActFilter('');
                          setExpandedGstActCh(null);
                          if (gstActData.length === 0) {
                            setGstActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/gst-act');
                              const data: GstActRow[] = await res.json();
                              setGstActData(data);
                              const groups: GstActChapterGroup[] = [];
                              const chMap = new Map<string, GstActChapterGroup>();
                              for (const d of data) {
                                let g = chMap.get(d.chapter);
                                if (!g) { g = { chapter: d.chapter, chapter_title: d.chapter_title, divisions: [] }; chMap.set(d.chapter, g); groups.push(g); }
                                g.divisions.push(d);
                              }
                              setGstActChapters(groups);
                            } catch { /* */ }
                            finally { setGstActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">Act</span>
                        <span className="text-sm text-gray-700">GST Act 1999</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('gst-regs');
                          setActiveSchedule(null);
                          setGstRegsFilter('');
                          setExpandedGstRegsCh(null);
                          if (gstRegsData.length === 0) {
                            setGstRegsLoading(true);
                            try {
                              const res = await fetch('/api/tariff/gst-regs');
                              const data: GstRegRow[] = await res.json();
                              setGstRegsData(data);
                              const groups: GstRegChapterGroup[] = [];
                              const chMap = new Map<string, GstRegChapterGroup>();
                              for (const d of data) {
                                let g = chMap.get(d.chapter);
                                if (!g) { g = { chapter: d.chapter, chapter_title: d.chapter_title, divisions: [] }; chMap.set(d.chapter, g); groups.push(g); }
                                g.divisions.push(d);
                              }
                              setGstRegsChapters(groups);
                            } catch { /* */ }
                            finally { setGstRegsLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">Regs</span>
                        <span className="text-sm text-gray-700">GST Regulations 2019</span>
                      </button>
                    </div>
                    <div>
                      {/* Trade section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Trade</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('td-act');
                          setActiveSchedule(null);
                          setTdActFilter('');
                          setExpandedTdActPart(null);
                          if (tdActData.length === 0) {
                            setTdActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/trade-desc-act');
                              const data: TdActRow[] = await res.json();
                              setTdActData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setTdActParts(groups);
                            } catch { /* */ } finally { setTdActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-purple-700 w-16 shrink-0 pt-0.5">Act</span>
                        <span className="text-sm text-gray-700">Trade Descriptions Act 1905</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('td-regs');
                          setActiveSchedule(null);
                          setTdRegsFilter('');
                          setExpandedTdRegsPart(null);
                          if (tdRegsData.length === 0) {
                            setTdRegsLoading(true);
                            try {
                              const res = await fetch('/api/tariff/trade-desc-regs');
                              const data: TdRegRow[] = await res.json();
                              setTdRegsData(data);
                              const groups: TdRegPartGroup[] = [];
                              const m = new Map<string, TdRegPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setTdRegsParts(groups);
                            } catch { /* */ } finally { setTdRegsLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-purple-700 w-16 shrink-0 pt-0.5">Regs</span>
                        <span className="text-sm text-gray-700">Trade Descriptions Regs 2016</span>
                      </button>

                      <div className="border-t border-gray-100 mx-3" />

                      {/* Biosecurity section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Biosecurity</p>
                      </div>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('bio-act');
                          setActiveSchedule(null);
                          setBioActFilter('');
                          setExpandedBioActCh(null);
                          if (bioActData.length === 0) {
                            setBioActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/biosecurity-act');
                              const data: BioActRow[] = await res.json();
                              setBioActData(data);
                              const groups: BioChapterGroup[] = [];
                              const m = new Map<string, BioChapterGroup>();
                              for (const d of data) { let g = m.get(d.chapter); if (!g) { g = { chapter: d.chapter, chapter_title: d.chapter_title, entries: [] }; m.set(d.chapter, g); groups.push(g); } g.entries.push(d); }
                              setBioActChapters(groups);
                            } catch { /* */ } finally { setBioActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">Act</span>
                        <span className="text-sm text-gray-700">Biosecurity Act 2015</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('bio-regs');
                          setActiveSchedule(null);
                          setBioRegsFilter('');
                          setExpandedBioRegsCh(null);
                          if (bioRegsData.length === 0) {
                            setBioRegsLoading(true);
                            try {
                              const res = await fetch('/api/tariff/biosecurity-regs');
                              const data: BioActRow[] = await res.json();
                              setBioRegsData(data);
                              const groups: BioChapterGroup[] = [];
                              const m = new Map<string, BioChapterGroup>();
                              for (const d of data) { let g = m.get(d.chapter); if (!g) { g = { chapter: d.chapter, chapter_title: d.chapter_title, entries: [] }; m.set(d.chapter, g); groups.push(g); } g.entries.push(d); }
                              setBioRegsChapters(groups);
                            } catch { /* */ } finally { setBioRegsLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">Regs</span>
                        <span className="text-sm text-gray-700">Biosecurity Regulation 2016</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('ifc-act');
                          setActiveSchedule(null);
                          setIfcActFilter('');
                          setExpandedIfcActPart(null);
                          if (ifcActData.length === 0) {
                            setIfcActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/imported-food-act');
                              const data: TdActRow[] = await res.json();
                              setIfcActData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setIfcActParts(groups);
                            } catch { /* */ } finally { setIfcActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-amber-700 w-16 shrink-0 pt-0.5">IFC Act</span>
                        <span className="text-sm text-gray-700">Imported Food Control Act 1992</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('ifc-reg');
                          setActiveSchedule(null);
                          setIfcRegFilter('');
                          setExpandedIfcRegPart(null);
                          if (ifcRegData.length === 0) {
                            setIfcRegLoading(true);
                            try {
                              const res = await fetch('/api/tariff/imported-food-reg');
                              const data: IntlObRow[] = await res.json();
                              setIfcRegData(data);
                              const groups: IntlObPartGroup[] = [];
                              const m = new Map<string, IntlObPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setIfcRegParts(groups);
                            } catch { /* */ } finally { setIfcRegLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-amber-700 w-16 shrink-0 pt-0.5">IFC Reg</span>
                        <span className="text-sm text-gray-700">Imported Food Control Reg 2019</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('il-act');
                          setActiveSchedule(null);
                          setIlActFilter('');
                          setExpandedIlActPart(null);
                          if (ilActData.length === 0) {
                            setIlActLoading(true);
                            try {
                              const res = await fetch('/api/tariff/illegal-logging-act');
                              const data: TdActRow[] = await res.json();
                              setIlActData(data);
                              const groups: TdActPartGroup[] = [];
                              const m = new Map<string, TdActPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, sections: [] }; m.set(d.part, g); groups.push(g); } g.sections.push(d); }
                              setIlActParts(groups);
                            } catch { /* */ } finally { setIlActLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">IL Act</span>
                        <span className="text-sm text-gray-700">Illegal Logging Act 2012</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLegislationDropdownOpen(false);
                          setActiveView('il-reg');
                          setActiveSchedule(null);
                          setIlRegFilter('');
                          setExpandedIlRegPart(null);
                          if (ilRegData.length === 0) {
                            setIlRegLoading(true);
                            try {
                              const res = await fetch('/api/tariff/illegal-logging-reg');
                              const data: IntlObRow[] = await res.json();
                              setIlRegData(data);
                              const groups: IntlObPartGroup[] = [];
                              const m = new Map<string, IntlObPartGroup>();
                              for (const d of data) { let g = m.get(d.part); if (!g) { g = { part: d.part, part_title: d.part_title, regulations: [] }; m.set(d.part, g); groups.push(g); } g.regulations.push(d); }
                              setIlRegParts(groups);
                            } catch { /* */ } finally { setIlRegLoading(false); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">IL Reg</span>
                        <span className="text-sm text-gray-700">Illegal Logging Reg 2012</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Dropdown 2: Classification ── */}
            <div className="static" ref={dropdownRef}>
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setLegislationDropdownOpen(false); setComplianceDropdownOpen(false); setReferenceDropdownOpen(false); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                Classification
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-0">
                    <div>
                      {/* Main Schedules */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Main Schedules</p>
                      </div>
                      {SCHEDULES.filter(s => ['1','2','3','4'].includes(s.id)).map(s => (
                        <ScheduleMenuItem key={s.id} schedule={s} onClick={() => selectSchedule(s)} />
                      ))}

                      <div className="border-t border-gray-100 mx-3" />

                      {/* FTA Exclusion Schedules */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">FTA Exclusion Schedules</p>
                      </div>
                      {SCHEDULES.filter(s => !['1','2','3','4'].includes(s.id)).map(s => (
                        <ScheduleMenuItem key={s.id} schedule={s} onClick={() => selectSchedule(s)} />
                      ))}
                    </div>
                    <div>
                      {/* Classification Tools */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Classification Tools</p>
                      </div>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          setActiveView('precedents');
                          setActiveSchedule(null);
                          setGenericFilter(prev => ({ ...prev, precedents: '' }));
                          if (!genericData['precedents']?.data?.length) {
                            setGenericData(prev => ({ ...prev, precedents: { data: [], categories: [], loading: true } }));
                            try {
                              const res = await fetch('/api/tariff/precedents');
                              const data: any[] = await res.json();
                              const groups: {key: string, title: string, items: any[]}[] = [];
                              const m = new Map<string, {key: string, title: string, items: any[]}>();
                              for (const d of data) { const k = d.category || 'General'; let g = m.get(k); if (!g) { g = { key: k, title: k, items: [] }; m.set(k, g); groups.push(g); } g.items.push(d); }
                              setGenericData(prev => ({ ...prev, precedents: { data, categories: groups, loading: false } }));
                            } catch { setGenericData(prev => ({ ...prev, precedents: { data: [], categories: [], loading: false } })); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">Prec</span>
                        <span className="text-sm text-gray-700">Precedents</span>
                      </button>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          setActiveView('compendium');
                          setActiveSchedule(null);
                          setGenericFilter(prev => ({ ...prev, compendium: '' }));
                          if (!genericData['compendium']?.data?.length) {
                            setGenericData(prev => ({ ...prev, compendium: { data: [], categories: [], loading: true } }));
                            try {
                              const res = await fetch('/api/tariff/compendium');
                              const data: any[] = await res.json();
                              const groups: {key: string, title: string, items: any[]}[] = [];
                              const m = new Map<string, {key: string, title: string, items: any[]}>();
                              for (const d of data) { const k = d.section || 'General'; let g = m.get(k); if (!g) { g = { key: k, title: k, items: [] }; m.set(k, g); groups.push(g); } g.items.push(d); }
                              setGenericData(prev => ({ ...prev, compendium: { data, categories: groups, loading: false } }));
                            } catch { setGenericData(prev => ({ ...prev, compendium: { data: [], categories: [], loading: false } })); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">Comp</span>
                        <span className="text-sm text-gray-700">Compendium</span>
                      </button>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          setActiveView('tco');
                          setActiveSchedule(null);
                          setGenericFilter(prev => ({ ...prev, tco: '' }));
                          if (!genericData['tco']?.data?.length) {
                            setGenericData(prev => ({ ...prev, tco: { data: [], categories: [], loading: true } }));
                            try {
                              const res = await fetch('/api/tariff/tco');
                              const data: any[] = await res.json();
                              const groups: {key: string, title: string, items: any[]}[] = [];
                              const m = new Map<string, {key: string, title: string, items: any[]}>();
                              for (const d of data) { const k = d.category || 'General'; let g = m.get(k); if (!g) { g = { key: k, title: k, items: [] }; m.set(k, g); groups.push(g); } g.items.push(d); }
                              setGenericData(prev => ({ ...prev, tco: { data, categories: groups, loading: false } }));
                            } catch { setGenericData(prev => ({ ...prev, tco: { data: [], categories: [], loading: false } })); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">TCO</span>
                        <span className="text-sm text-gray-700">Tariff Concession Orders</span>
                      </button>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          setActiveView('alpha-index');
                          setActiveSchedule(null);
                          setGenericFilter(prev => ({ ...prev, 'alpha-index': '' }));
                          if (!genericData['alpha-index']?.data?.length) {
                            setGenericData(prev => ({ ...prev, 'alpha-index': { data: [], categories: [], loading: true } }));
                            try {
                              const res = await fetch('/api/tariff/alpha-index');
                              const data: any[] = await res.json();
                              const groups: {key: string, title: string, items: any[]}[] = [];
                              const m = new Map<string, {key: string, title: string, items: any[]}>();
                              for (const d of data) { const k = (d.goods_description || 'A').charAt(0).toUpperCase(); let g = m.get(k); if (!g) { g = { key: k, title: k, items: [] }; m.set(k, g); groups.push(g); } g.items.push(d); }
                              groups.sort((a, b) => a.key.localeCompare(b.key));
                              setGenericData(prev => ({ ...prev, 'alpha-index': { data, categories: groups, loading: false } }));
                            } catch { setGenericData(prev => ({ ...prev, 'alpha-index': { data: [], categories: [], loading: false } })); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">A-Z</span>
                        <span className="text-sm text-gray-700">HS Alphabetical Index</span>
                      </button>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          setActiveView('hsen');
                          setActiveSchedule(null);
                          setGenericFilter(prev => ({ ...prev, hsen: '' }));
                          if (!genericData['hsen']?.data?.length) {
                            setGenericData(prev => ({ ...prev, hsen: { data: [], categories: [], loading: true } }));
                            try {
                              const res = await fetch('/api/tariff/hsen');
                              const data: any[] = await res.json();
                              const groups: {key: string, title: string, items: any[]}[] = [];
                              const m = new Map<string, {key: string, title: string, items: any[]}>();
                              for (const d of data) { const k = d.section || 'General'; let g = m.get(k); if (!g) { g = { key: k, title: k, items: [] }; m.set(k, g); groups.push(g); } g.items.push(d); }
                              setGenericData(prev => ({ ...prev, hsen: { data, categories: groups, loading: false } }));
                            } catch { setGenericData(prev => ({ ...prev, hsen: { data: [], categories: [], loading: false } })); }
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                      >
                        <span className="font-mono text-xs font-bold text-indigo-700 w-16 shrink-0 pt-0.5">HSEN</span>
                        <span className="text-sm text-gray-700">HS Explanatory Notes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Dropdown 3: Compliance ── */}
            <div className="relative" ref={complianceDropdownRef}>
              <button
                onClick={() => { setComplianceDropdownOpen(!complianceDropdownOpen); setDropdownOpen(false); setLegislationDropdownOpen(false); setReferenceDropdownOpen(false); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                Compliance
                <svg className={`w-4 h-4 transition-transform ${complianceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {complianceDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={async () => {
                      setComplianceDropdownOpen(false);
                      setActiveView('dumping');
                      setActiveSchedule(null);
                      setDumpFilter('');
                      setExpandedDumpCat(null);
                      if (dumpData.length === 0) {
                        setDumpLoading(true);
                        try {
                          const res = await fetch('/api/tariff/dumping');
                          const data: DumpingRow[] = await res.json();
                          setDumpData(data);
                          const groups: DumpCategoryGroup[] = [];
                          const catMap = new Map<string, DumpCategoryGroup>();
                          for (const n of data) {
                            let group = catMap.get(n.category);
                            if (!group) {
                              group = { category: n.category, notices: [] };
                              catMap.set(n.category, group);
                              groups.push(group);
                            }
                            group.notices.push(n);
                          }
                          setDumpCategories(groups);
                        } catch { /* */ }
                        finally { setDumpLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-orange-700 w-16 shrink-0 pt-0.5">Dumping</span>
                    <span className="text-sm text-gray-700">Anti-Dumping Notices</span>
                  </button>
                  <button
                    onClick={async () => {
                      setComplianceDropdownOpen(false);
                      setActiveView('acn');
                      setActiveSchedule(null);
                      setAcnFilter('');
                      setExpandedAcnYear(null);
                      if (acnData.length === 0) {
                        setAcnLoading(true);
                        try {
                          const res = await fetch('/api/tariff/customs-notices');
                          const data: CustomsNoticeRow[] = await res.json();
                          setAcnData(data);
                          const groups: NoticeYearGroup[] = [];
                          const m = new Map<number, NoticeYearGroup>();
                          for (const n of data) { let g = m.get(n.year); if (!g) { g = { year: n.year, notices: [] }; m.set(n.year, g); groups.push(g); } g.notices.push(n); }
                          setAcnYears(groups);
                        } catch { /* */ } finally { setAcnLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-orange-700 w-16 shrink-0 pt-0.5">ACN</span>
                    <span className="text-sm text-gray-700">Australian Customs Notices</span>
                  </button>
                  <button
                    onClick={async () => {
                      setComplianceDropdownOpen(false);
                      setActiveView('aqis');
                      setActiveSchedule(null);
                      setAqisFilter('');
                      setExpandedAqisCat(null);
                      if (aqisData.length === 0) {
                        setAqisLoading(true);
                        try {
                          const res = await fetch('/api/tariff/aqis-producer');
                          const data: AqisRow[] = await res.json();
                          setAqisData(data);
                          const groups: AqisCategoryGroup[] = [];
                          const m = new Map<string, AqisCategoryGroup>();
                          for (const d of data) { let g = m.get(d.category); if (!g) { g = { category: d.category, category_title: d.category_title, items: [] }; m.set(d.category, g); groups.push(g); } g.items.push(d); }
                          setAqisCategories(groups);
                        } catch { /* */ } finally { setAqisLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">AQIS</span>
                    <span className="text-sm text-gray-700">AQIS Producer</span>
                  </button>
                  <button
                    onClick={async () => {
                      setComplianceDropdownOpen(false);
                      setActiveView('chemicals');
                      setActiveSchedule(null);
                      setChemsFilter('');
                      setExpandedChemSchedule(null);
                      if (chemsData.length === 0) {
                        setChemsLoading(true);
                        try {
                          const res = await fetch('/api/tariff/chemicals');
                          const data: ChemicalRow[] = await res.json();
                          setChemsData(data);
                          const groups: ChemScheduleGroup[] = [];
                          const schedMap = new Map<string, ChemScheduleGroup>();
                          for (const c of data) {
                            let group = schedMap.get(c.cwc_schedule);
                            if (!group) {
                              group = { schedule: c.cwc_schedule, chemicals: [] };
                              schedMap.set(c.cwc_schedule, group);
                              groups.push(group);
                            }
                            group.chemicals.push(c);
                          }
                          setChemGroups(groups);
                        } catch { /* */ }
                        finally { setChemsLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-red-700 w-16 shrink-0 pt-0.5">Chem</span>
                    <span className="text-sm text-gray-700">Chemical Index</span>
                  </button>
                  <button
                    onClick={async () => {
                      setComplianceDropdownOpen(false);
                      setActiveView('cpquestions');
                      setActiveSchedule(null);
                      setCpFilter('');
                      setExpandedCpCat(null);
                      if (cpData.length === 0) {
                        setCpLoading(true);
                        try {
                          const res = await fetch('/api/tariff/cp-questions');
                          const data: CPQuestionRow[] = await res.json();
                          setCpData(data);
                          const groups: CPCategoryGroup[] = [];
                          const catMap = new Map<string, CPCategoryGroup>();
                          for (const q of data) {
                            let group = catMap.get(q.category);
                            if (!group) {
                              group = { category: q.category, questions: [] };
                              catMap.set(q.category, group);
                              groups.push(group);
                            }
                            group.questions.push(q);
                          }
                          setCpCategories(groups);
                        } catch { /* */ }
                        finally { setCpLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-amber-700 w-16 shrink-0 pt-0.5">CP Q&apos;s</span>
                    <span className="text-sm text-gray-700">CP Questions</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── Dropdown 4: Reference ── */}
            <div className="relative" ref={referenceRef}>
              <button
                onClick={() => { setReferenceDropdownOpen(!referenceDropdownOpen); setDropdownOpen(false); setLegislationDropdownOpen(false); setComplianceDropdownOpen(false); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                Reference
                <svg className={`w-4 h-4 transition-transform ${referenceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {referenceDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={async () => {
                      setReferenceDropdownOpen(false);
                      setActiveView('ahecc');
                      setActiveSchedule(null);
                      setAheccFilter('');
                      setExpandedAheccSection(null);
                      if (aheccData.length === 0) {
                        setAheccLoading(true);
                        try {
                          const res = await fetch('/api/tariff/ahecc');
                          const data: AHECCRow[] = await res.json();
                          setAheccData(data);
                          const groups: AHECCSectionGroup[] = [];
                          const secMap = new Map<string, AHECCSectionGroup>();
                          for (const r of data) {
                            let group = secMap.get(r.section_number);
                            if (!group) {
                              group = { section_number: r.section_number, section_title: r.section_title, chapters: [] };
                              secMap.set(r.section_number, group);
                              groups.push(group);
                            }
                            group.chapters.push(r);
                          }
                          setAheccSections(groups);
                        } catch { /* */ }
                        finally { setAheccLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">AHECC</span>
                    <span className="text-sm text-gray-700">AHECC Export Codes</span>
                  </button>
                  <button
                    onClick={async () => {
                      setReferenceDropdownOpen(false);
                      setActiveView('reffiles');
                      setActiveSchedule(null);
                      setRefFilter('');
                      setExpandedRefCat(null);
                      if (refFilesData.length === 0) {
                        setRefLoading(true);
                        try {
                          const res = await fetch('/api/tariff/reference-files');
                          const data: RefFileRow[] = await res.json();
                          setRefFilesData(data);
                          const groups: RefCategoryGroup[] = [];
                          const catMap = new Map<string, RefCategoryGroup>();
                          for (const f of data) {
                            let group = catMap.get(f.category);
                            if (!group) {
                              group = { category: f.category, files: [] };
                              catMap.set(f.category, group);
                              groups.push(group);
                            }
                            group.files.push(f);
                          }
                          setRefCategories(groups);
                        } catch { /* */ }
                        finally { setRefLoading(false); }
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-amber-700 w-16 shrink-0 pt-0.5">Ref Files</span>
                    <span className="text-sm text-gray-700">ABF Reference Files</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {activeView === 'search' ? (
          // ── Search View ──────────────────────────────────────────
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by HS Code or Description
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder='e.g. 0101.21 or "live horses" or "salmon"...'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-3 top-3.5">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} results found</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results Panel */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Search Results</h2>
                {results.length === 0 && searchActResults.length === 0 && searchRegsResults.length === 0 && searchChemsResults.length === 0 && searchAheccResults.length === 0 && query.length >= 2 && !loading && (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {/* Tariff classification results */}
                  {results.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Tariff Classifications ({total})
                      </p>
                      {results.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => selectTariff(r.code)}
                          className={`w-full text-left bg-white rounded-lg shadow p-4 mb-2 hover:bg-blue-50 hover:border-blue-300 border-2 transition-colors ${
                            selectedEntry?.tariff_code === r.code ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-700">{r.code}</span>
                                {r.statistical_code && (
                                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                    Stat: {r.statistical_code}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{r.description}</p>
                              <p className="text-xs text-gray-400 mt-1">Ch.{r.chapter_number} &mdash; {r.chapter_title}</p>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                r.is_free ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.duty_rate || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Customs Act results */}
                  {searchActResults.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Customs Act 1901 ({searchActTotal})
                      </p>
                      {searchActResults.map((s: ActSectionRow) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveView('act');
                            setActiveSchedule(null);
                          }}
                          className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-green-50 border-2 border-transparent hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">s.{s.section_number}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{s.section_title}</p>
                              <p className="text-xs text-gray-400">{s.part} — {s.part_title}</p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded shrink-0">Act</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Prohibited Imports Regulations results */}
                  {searchRegsResults.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Prohibited Imports Regulations 1956 ({searchRegsTotal})
                      </p>
                      {searchRegsResults.map((r: RegulationRow) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setActiveView('regulations');
                            setActiveSchedule(null);
                          }}
                          className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs font-bold text-purple-700 w-16 shrink-0 pt-0.5">r.{r.regulation_number}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{r.regulation_title}</p>
                              <p className="text-xs text-gray-400">{r.part} — {r.part_title}</p>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded shrink-0">Regs</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chemical Index results */}
                  {searchChemsResults.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Chemical Index — CWC ({searchChemsTotal})
                      </p>
                      {searchChemsResults.map((c: ChemicalRow) => {
                        const color = c.cwc_schedule === '1' ? 'red' : c.cwc_schedule === '2' ? 'orange' : 'yellow';
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setActiveView('chemicals');
                              setActiveSchedule(null);
                            }}
                            className={`w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-${color}-50 border-2 border-transparent hover:border-${color}-300 transition-colors`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`font-mono text-xs font-bold text-${color}-700 w-16 shrink-0 pt-0.5`}>S{c.cwc_schedule}.{c.item_number}</span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{c.chemical_name}</p>
                                <p className="text-xs text-gray-400">{c.cas_number ? `CAS: ${c.cas_number}` : ''} {c.category}</p>
                              </div>
                              <span className={`text-xs bg-${color}-100 text-${color}-700 px-2 py-0.5 rounded shrink-0`}>CWC {c.cwc_schedule}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* AHECC results */}
                  {searchAheccResults.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        AHECC Export Classification ({searchAheccTotal})
                      </p>
                      {searchAheccResults.map((a: AHECCRow) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            setActiveView('ahecc');
                            setActiveSchedule(null);
                          }}
                          className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-teal-50 border-2 border-transparent hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">Ch.{a.chapter_number}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{a.chapter_title}</p>
                              <p className="text-xs text-gray-400">Section {a.section_number} — {a.section_title}</p>
                            </div>
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded shrink-0">AHECC</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Customs Entry Panel */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Customs Entry Fields</h2>
                {!selectedEntry ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
                    Select a tariff code to populate customs entry fields
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                    {/* Header */}
                    <div className="p-4 bg-blue-50">
                      <h3 className="font-semibold text-blue-900">
                        {selectedEntry.tariff_code}
                        {selectedEntry.statistical_code && ` (Stat: ${selectedEntry.statistical_code})`}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">{selectedEntry.description}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        Section {selectedEntry.section.number}: {selectedEntry.section.title} &rarr; Ch.{selectedEntry.chapter.number}: {selectedEntry.chapter.title}
                      </p>
                    </div>

                    {/* Auto-populated fields */}
                    {customsFields && (
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Auto-Populated Fields</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Tariff Code" value={customsFields.tariff_classification_code} />
                          <Field label="Statistical Code" value={customsFields.tariff_stat_code || '\u2014'} />
                          <Field label="Unit of Quantity" value={customsFields.unit_of_quantity} />
                          <Field label="Duty Rate" value={customsFields.general_duty_rate} highlight={customsFields.general_duty_rate === 'Free'} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Goods Description</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm text-gray-800"
                            rows={2}
                            value={customsFields.goods_description}
                            readOnly
                          />
                        </div>

                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider pt-2">Duty Calculation</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Customs Value (AUD)</label>
                            <input
                              type="number"
                              value={customsValue}
                              onChange={(e) => setCustomsValue(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                              placeholder="Enter value..."
                            />
                          </div>
                          <Field
                            label="Duty Payable"
                            value={customsFields.duty_payable !== null ? `$${customsFields.duty_payable.toFixed(2)}` : '\u2014'}
                            highlight={customsFields.duty_payable === 0}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="GST Rate" value={`${customsFields.gst_rate}%`} />
                          <Field label="GST Amount" value={gstAmount !== null ? `$${gstAmount.toFixed(2)}` : '\u2014'} />
                        </div>

                        {totalPayable !== null && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                            <div className="text-sm font-semibold text-amber-900">Total Payable</div>
                            <div className="text-2xl font-bold text-amber-700">${totalPayable.toFixed(2)}</div>
                            <div className="text-xs text-amber-600 mt-1">
                              Duty ${customsFields.duty_payable!.toFixed(2)} + GST ${gstAmount!.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FTA Exclusions */}
                    {selectedEntry.fta_exclusions.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          FTA Exclusions ({selectedEntry.fta_exclusions.length})
                        </h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {selectedEntry.fta_exclusions.map((f, i) => (
                            <div key={i} className="text-xs flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">{f.fta_name || f.schedule}</span>
                              <span className="font-mono">{f.duty_rate || '\u2014'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TCO References */}
                    {selectedEntry.tco_references.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Tariff Concession Orders
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedEntry.tco_references.map((tco, i) => (
                            <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {tco}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeView === 'act' ? (
          // ── Customs Act 1901 ─────────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Customs Act 1901</h2>
              <input
                type="text"
                value={actFilter}
                onChange={(e) => setActFilter(e.target.value)}
                placeholder="Search parts, divisions, or sections..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-2">
                {filteredActParts.length} of {actParts.length} parts ({actSections.length} sections total)
              </p>
            </div>

            {actLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading Customs Act...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActParts.map((pg) => (
                  <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedPart(expandedPart === pg.part ? null : pg.part)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-700 mr-3">{pg.part}</span>
                        <span className="text-gray-800">{pg.part_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{pg.sections.length} sections</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedPart === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedPart === pg.part && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {pg.sections.map((s) => (
                          <div
                            key={s.id}
                            className="px-6 py-2 text-sm hover:bg-blue-50 transition-colors"
                          >
                            <button onClick={() => setExpandedActSection(expandedActSection === s.id ? null : s.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-blue-600 font-medium w-16 shrink-0">s.{s.section_number}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{s.section_title}</span>
                                {s.division_title && (
                                  <span className="text-xs text-gray-400 ml-2">({s.division_title})</span>
                                )}
                                {s.content && <span className="text-xs text-blue-400 ml-2">{expandedActSection === s.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedActSection === s.id && s.content && (
                              <div className="mt-2 ml-16 pl-4 border-l-2 border-blue-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                                {s.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'regulations' ? (
          // ── Prohibited Imports Regulations ───────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Customs (Prohibited Imports) Regulations 1956</h2>
              <input
                type="text"
                value={regsFilter}
                onChange={(e) => setRegsFilter(e.target.value)}
                placeholder="Search regulations..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-2">
                {filteredRegParts.length} of {regParts.length} parts ({regsData.length} regulations total)
              </p>
            </div>

            {regsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading regulations...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRegParts.map((pg) => (
                  <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedRegPart(expandedRegPart === pg.part ? null : pg.part)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-700 mr-3">{pg.part}</span>
                        <span className="text-gray-800">{pg.part_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{pg.regulations.length} regs</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedRegPart === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedRegPart === pg.part && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {pg.regulations.map((r) => (
                          <div key={r.id} className="px-6 py-2 text-sm hover:bg-blue-50 transition-colors">
                            <button onClick={() => setExpandedRegSection(expandedRegSection === r.id ? null : r.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-blue-600 font-medium w-24 shrink-0">r.{r.regulation_number}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{r.regulation_title}</span>
                                {r.category && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{r.category}</span>
                                )}
                                {r.content && <span className="text-xs text-blue-400 ml-2">{expandedRegSection === r.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedRegSection === r.id && r.content && (
                              <div className="mt-2 ml-24 pl-4 border-l-2 border-blue-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                                {r.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'gst-act' ? (
          // ── GST Act 1999 ───────────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">A New Tax System (Goods and Services Tax) Act 1999</h2>
              <p className="text-xs text-gray-500 mb-3">6 Chapters, {gstActData.length} divisions — covers GST on supplies, acquisitions, and importations</p>
              <input type="text" value={gstActFilter} onChange={(e) => setGstActFilter(e.target.value)} placeholder="Search divisions..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            {gstActLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading GST Act...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGstActChapters.map((ch) => (
                  <div key={ch.chapter} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedGstActCh(expandedGstActCh === ch.chapter ? null : ch.chapter)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-green-50 transition-colors">
                      <div>
                        <span className="font-mono font-bold text-green-700 mr-3">{ch.chapter}</span>
                        <span className="text-gray-800">{ch.chapter_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{ch.divisions.length} divs</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedGstActCh === ch.chapter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedGstActCh === ch.chapter && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {ch.divisions.map((d) => (
                          <div key={d.id} className="px-6 py-2 text-sm hover:bg-green-50 transition-colors">
                            <button onClick={() => setExpandedGstActDiv(expandedGstActDiv === d.id ? null : d.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-green-600 font-medium w-28 shrink-0">{d.division}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{d.division_title}</span>
                                {d.part && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{d.part}</span>}
                                {d.content && <span className="text-xs text-green-400 ml-2">{expandedGstActDiv === d.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedGstActDiv === d.id && d.content && (
                              <div className="mt-2 ml-28 pl-4 border-l-2 border-green-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                {d.content}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'gst-regs' ? (
          // ── GST Regulations 2019 ───────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">A New Tax System (Goods and Services Tax) Regulations 2019</h2>
              <p className="text-xs text-gray-500 mb-3">Supporting regulations for the GST Act — {gstRegsData.length} divisions</p>
              <input type="text" value={gstRegsFilter} onChange={(e) => setGstRegsFilter(e.target.value)} placeholder="Search regulations..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            {gstRegsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading GST Regulations...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGstRegsChapters.map((ch) => (
                  <div key={ch.chapter} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedGstRegsCh(expandedGstRegsCh === ch.chapter ? null : ch.chapter)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-green-50 transition-colors">
                      <div>
                        <span className="font-mono font-bold text-green-700 mr-3">{ch.chapter}</span>
                        <span className="text-gray-800">{ch.chapter_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{ch.divisions.length} divs</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedGstRegsCh === ch.chapter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedGstRegsCh === ch.chapter && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {ch.divisions.map((d) => (
                          <div key={d.id} className="px-6 py-2 text-sm hover:bg-green-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-green-600 font-medium w-28 shrink-0">{d.division}</span>
                              <div className="flex-1">
                                <span className="text-gray-700">{d.division_title}</span>
                                {d.part && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{d.part}</span>}
                                {d.subdivision && <p className="text-xs text-gray-400 mt-0.5">{d.subdivision}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (activeView === 'bio-act' || activeView === 'bio-regs') ? (
          // ── Biosecurity Act / Regs ─────────────────────────────
          (() => {
            const isBioAct = activeView === 'bio-act';
            const title = isBioAct ? 'Biosecurity Act 2015' : 'Biosecurity Regulation 2016';
            const data = isBioAct ? bioActData : bioRegsData;
            const chapters = isBioAct ? filteredBioActChapters : filteredBioRegsChapters;
            const allChapters = isBioAct ? bioActChapters : bioRegsChapters;
            const loading = isBioAct ? bioActLoading : bioRegsLoading;
            const filter = isBioAct ? bioActFilter : bioRegsFilter;
            const setFilter = isBioAct ? setBioActFilter : setBioRegsFilter;
            const expanded = isBioAct ? expandedBioActCh : expandedBioRegsCh;
            const setExpanded = isBioAct ? setExpandedBioActCh : setExpandedBioRegsCh;
            return (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Search
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
                  <p className="text-xs text-gray-500 mb-3">{allChapters.length} chapters, {data.length} entries</p>
                  <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                </div>
                {loading ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-500 mt-4">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((ch) => (
                      <div key={ch.chapter} className="bg-white rounded-lg shadow overflow-hidden">
                        <button onClick={() => setExpanded(expanded === ch.chapter ? null : ch.chapter)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-teal-50 transition-colors">
                          <div>
                            <span className="font-mono font-bold text-teal-700 mr-3">{ch.chapter}</span>
                            <span className="text-gray-800">{ch.chapter_title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-xs text-gray-400">{ch.entries.length}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === ch.chapter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </button>
                        {expanded === ch.chapter && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {ch.entries.map((e) => (
                              <div key={e.id} className="px-6 py-2 text-sm hover:bg-teal-50 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    {e.part && <span className="font-medium text-teal-600 mr-2">{e.part}</span>}
                                    {e.part_title && <span className="text-gray-700">{e.part_title}</span>}
                                    {e.division && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{e.division}{e.division_title ? `: ${e.division_title}` : ''}</span>}
                                    {e.section_range && <span className="text-xs text-gray-400 ml-2">({e.section_range})</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : (activeView === 'ct-act' || activeView === 'ct-regs' || activeView === 'ad-act') ? (
          // ── Customs Tariff Act / Regs / Anti-Dumping Act ─────
          (() => {
            const isAct = activeView === 'ct-act';
            const isAD = activeView === 'ad-act';
            const title = isAD ? 'Customs Tariff (Anti-Dumping) Act 1975' : isAct ? 'Customs Tariff Act 1995' : 'Customs Tariff Regulations 2004';
            const data = isAD ? adActData : isAct ? ctActData : ctRegsData;
            const loading = isAD ? adActLoading : isAct ? ctActLoading : ctRegsLoading;
            const filter = isAD ? adActFilter : isAct ? ctActFilter : ctRegsFilter;
            const setFilter = isAD ? setAdActFilter : isAct ? setCtActFilter : setCtRegsFilter;
            const parts = isAD ? filteredAdActParts : isAct ? filteredCtActParts : filteredCtRegsParts;
            const allParts = isAD ? adActParts : isAct ? ctActParts : ctRegsParts;
            const expanded = isAD ? expandedAdActPart : isAct ? expandedCtActPart : expandedCtRegsPart;
            const setExpanded = isAD ? setExpandedAdActPart : isAct ? setExpandedCtActPart : setExpandedCtRegsPart;
            return (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Search
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
                  <p className="text-xs text-gray-500 mb-3">{allParts.length} parts, {data.length} {isAct ? 'sections' : 'regulations'}</p>
                  <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                </div>
                {loading ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
                ) : (
                  <div className="space-y-3">
                    {parts.map((pg) => (
                      <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                        <button onClick={() => setExpanded(expanded === pg.part ? null : pg.part)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors">
                          <div><span className="font-mono font-bold text-indigo-700 mr-3">{pg.part}</span><span className="text-gray-800">{pg.part_title}</span></div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-xs text-gray-400">{pg.sections.length}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </button>
                        {expanded === pg.part && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {pg.sections.map((s) => (
                              <div key={s.id} className="px-6 py-2 text-sm hover:bg-indigo-50 transition-colors">
                                <button onClick={() => setExpandedCtSection(expandedCtSection === s.id ? null : s.id)} className="w-full text-left flex items-start gap-3">
                                  <span className="font-mono text-indigo-600 font-medium w-20 shrink-0">s.{s.section_number}</span>
                                  <div className="flex-1">
                                    <span className="text-gray-700 font-medium">{s.section_title}</span>
                                    {s.content && <span className="text-xs text-indigo-400 ml-2">{expandedCtSection === s.id ? '\u25B2' : '\u25BC'}</span>}
                                  </div>
                                </button>
                                {expandedCtSection === s.id && s.content && (
                                  <div className="mt-2 ml-20 pl-4 border-l-2 border-indigo-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{s.content}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : activeView === 'customs-reg' ? (
          // ── Customs Regulation 2015 ────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Customs Regulation 2015</h2>
              <p className="text-xs text-gray-500 mb-3">{crParts.length} parts, {crData.length} regulations — cargo reporting, warehousing, duty free, brokers, duties, exports</p>
              <input type="text" value={crFilter} onChange={(e) => setCrFilter(e.target.value)} placeholder="Search regulations..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            {crLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
            ) : (
              <div className="space-y-3">
                {filteredCrParts.map((pg) => (
                  <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedCrPart(expandedCrPart === pg.part ? null : pg.part)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
                      <div><span className="font-mono font-bold text-blue-700 mr-3">{pg.part}</span><span className="text-gray-800">{pg.part_title}</span></div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{pg.regulations.length}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedCrPart === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedCrPart === pg.part && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {pg.regulations.map((r) => (
                          <div key={r.id} className="px-6 py-2 text-sm hover:bg-blue-50 transition-colors">
                            <button onClick={() => setExpandedCrSection(expandedCrSection === r.id ? null : r.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-blue-600 font-medium w-16 shrink-0">r.{r.regulation_number}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{r.regulation_title}</span>
                                {r.division && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{r.division}</span>}
                                {r.content && <span className="text-xs text-blue-400 ml-2">{expandedCrSection === r.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedCrSection === r.id && r.content && (
                              <div className="mt-2 ml-16 pl-4 border-l-2 border-blue-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{r.content}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'pe-regs' ? (
          // ── Prohibited Exports Regulations ─────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Customs (Prohibited Exports) Regulations 1958</h2>
              <p className="text-xs text-gray-500 mb-3">{peParts.length} parts, {peData.length} regulations — covers export prohibitions, sanctions, defence goods, drugs, LNG</p>
              <input type="text" value={peFilter} onChange={(e) => setPeFilter(e.target.value)} placeholder="Search regulations..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            {peLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
            ) : (
              <div className="space-y-3">
                {filteredPeParts.map((pg) => (
                  <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedPePart(expandedPePart === pg.part ? null : pg.part)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-red-50 transition-colors">
                      <div><span className="font-mono font-bold text-red-700 mr-3">{pg.part}</span><span className="text-gray-800">{pg.part_title}</span></div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{pg.regulations.length}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedPePart === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedPePart === pg.part && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {pg.regulations.map((r) => (
                          <div key={r.id} className="px-6 py-2 text-sm hover:bg-red-50 transition-colors">
                            <button onClick={() => setExpandedPeSection(expandedPeSection === r.id ? null : r.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-red-600 font-medium w-16 shrink-0">r.{r.regulation_number}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{r.regulation_title}</span>
                                {r.division && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{r.division}</span>}
                                {r.content && <span className="text-xs text-red-400 ml-2">{expandedPeSection === r.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedPeSection === r.id && r.content && (
                              <div className="mt-2 ml-16 pl-4 border-l-2 border-red-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{r.content}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'intl-ob' ? (
          // ── International Obligations Regulation ───────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Customs (International Obligations) Regulation 2015</h2>
              <p className="text-xs text-gray-500 mb-3">{intlObParts.length} parts, {intlObData.length} regulations — covers FTA record keeping, drawback, anti-dumping, UN sanctions</p>
              <input type="text" value={intlObFilter} onChange={(e) => setIntlObFilter(e.target.value)} placeholder="Search regulations..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            </div>
            {intlObLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
            ) : (
              <div className="space-y-3">
                {filteredIntlObParts.map((pg) => (
                  <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedIntlObPart(expandedIntlObPart === pg.part ? null : pg.part)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
                      <div><span className="font-mono font-bold text-blue-700 mr-3">{pg.part}</span><span className="text-gray-800">{pg.part_title}</span></div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{pg.regulations.length}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedIntlObPart === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedIntlObPart === pg.part && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {pg.regulations.map((r) => (
                          <div key={r.id} className="px-6 py-2 text-sm hover:bg-blue-50 transition-colors">
                            <button onClick={() => setExpandedIntlObSection(expandedIntlObSection === r.id ? null : r.id)} className="w-full text-left flex items-start gap-3">
                              <span className="font-mono text-blue-600 font-medium w-16 shrink-0">r.{r.regulation_number}</span>
                              <div className="flex-1">
                                <span className="text-gray-700 font-medium">{r.regulation_title}</span>
                                {r.division && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{r.division}</span>}
                                {r.content && <span className="text-xs text-blue-400 ml-2">{expandedIntlObSection === r.id ? '\u25B2' : '\u25BC'}</span>}
                              </div>
                            </button>
                            {expandedIntlObSection === r.id && r.content && (
                              <div className="mt-2 ml-16 pl-4 border-l-2 border-blue-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{r.content}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (activeView === 'td-act' || activeView === 'td-regs' || activeView === 'il-act' || activeView === 'il-reg' || activeView === 'ifc-act' || activeView === 'ifc-reg') ? (
          // ── Trade Descriptions / Illegal Logging / Imported Food ──
          (() => {
            const isAct = activeView === 'td-act' || activeView === 'il-act' || activeView === 'ifc-act';
            const title = activeView === 'td-act' ? 'Commerce (Trade Descriptions) Act 1905'
              : activeView === 'td-regs' ? 'Commerce (Trade Descriptions) Regulations 2016'
              : activeView === 'il-act' ? 'Illegal Logging Prohibition Act 2012'
              : activeView === 'il-reg' ? 'Illegal Logging Prohibition Regulation 2012'
              : activeView === 'ifc-act' ? 'Imported Food Control Act 1992'
              : 'Imported Food Control Regulation 2019';
            const data = activeView === 'td-act' ? tdActData : activeView === 'td-regs' ? tdRegsData : activeView === 'il-act' ? ilActData : activeView === 'il-reg' ? ilRegData : activeView === 'ifc-act' ? ifcActData : ifcRegData;
            const loading = activeView === 'td-act' ? tdActLoading : activeView === 'td-regs' ? tdRegsLoading : activeView === 'il-act' ? ilActLoading : activeView === 'il-reg' ? ilRegLoading : activeView === 'ifc-act' ? ifcActLoading : ifcRegLoading;
            const filter = activeView === 'td-act' ? tdActFilter : activeView === 'td-regs' ? tdRegsFilter : activeView === 'il-act' ? ilActFilter : activeView === 'il-reg' ? ilRegFilter : activeView === 'ifc-act' ? ifcActFilter : ifcRegFilter;
            const setFilter = activeView === 'td-act' ? setTdActFilter : activeView === 'td-regs' ? setTdRegsFilter : activeView === 'il-act' ? setIlActFilter : activeView === 'il-reg' ? setIlRegFilter : activeView === 'ifc-act' ? setIfcActFilter : setIfcRegFilter;
            const parts = activeView === 'td-act' ? filteredTdActParts : activeView === 'td-regs' ? filteredTdRegsParts : activeView === 'il-act' ? filteredIlActParts : activeView === 'il-reg' ? filteredIlRegParts : activeView === 'ifc-act' ? filteredIfcActParts : filteredIfcRegParts;
            const allParts = activeView === 'td-act' ? tdActParts : activeView === 'td-regs' ? tdRegsParts : activeView === 'il-act' ? ilActParts : activeView === 'il-reg' ? ilRegParts : activeView === 'ifc-act' ? ifcActParts : ifcRegParts;
            const expanded = activeView === 'td-act' ? expandedTdActPart : activeView === 'td-regs' ? expandedTdRegsPart : activeView === 'il-act' ? expandedIlActPart : activeView === 'il-reg' ? expandedIlRegPart : activeView === 'ifc-act' ? expandedIfcActPart : expandedIfcRegPart;
            const setExpanded = activeView === 'td-act' ? setExpandedTdActPart : activeView === 'td-regs' ? setExpandedTdRegsPart : activeView === 'il-act' ? setExpandedIlActPart : activeView === 'il-reg' ? setExpandedIlRegPart : activeView === 'ifc-act' ? setExpandedIfcActPart : setExpandedIfcRegPart;
            return (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Search
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
                  <p className="text-xs text-gray-500 mb-3">{allParts.length} parts, {data.length} {isAct ? 'sections' : 'regulations'}</p>
                  <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Search ${isAct ? 'sections' : 'regulations'}...`} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                </div>
                {loading ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(parts as (TdActPartGroup | TdRegPartGroup)[]).map((pg) => {
                      const items = 'sections' in pg ? pg.sections : pg.regulations;
                      return (
                        <div key={pg.part} className="bg-white rounded-lg shadow overflow-hidden">
                          <button onClick={() => setExpanded(expanded === pg.part ? null : pg.part)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
                            <div>
                              <span className="font-mono font-bold text-purple-700 mr-3">{pg.part}</span>
                              <span className="text-gray-800">{pg.part_title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              <span className="text-xs text-gray-400">{items.length}</span>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === pg.part ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </button>
                          {expanded === pg.part && (
                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                              {items.map((item) => {
                                const isSection = 'section_number' in item;
                                const num = isSection ? (item as TdActRow).section_number : (item as TdRegRow).regulation_number;
                                const title2 = isSection ? (item as TdActRow).section_title : (item as TdRegRow).regulation_title;
                                const reg = !isSection ? (item as TdRegRow) : null;
                                const sectionContent = isSection ? (item as TdActRow).content : (item as TdRegRow).content;
                                const isExpanded = expandedTdSection === item.id;
                                return (
                                  <div key={item.id} className="px-6 py-2 text-sm hover:bg-purple-50 transition-colors">
                                    <button onClick={() => setExpandedTdSection(isExpanded ? null : item.id)} className="w-full text-left flex items-start gap-3">
                                      <span className="font-mono text-purple-600 font-medium w-16 shrink-0">{isSection ? `s.${num}` : `r.${num}`}</span>
                                      <div className="flex-1">
                                        <span className="text-gray-700 font-medium">{title2}</span>
                                        {reg?.division && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">{reg.division}</span>}
                                        {reg?.subdivision && <p className="text-xs text-gray-400 mt-0.5">{reg.subdivision}</p>}
                                        {sectionContent && <span className="text-xs text-purple-400 ml-2">{isExpanded ? '▲' : '▼'}</span>}
                                      </div>
                                    </button>
                                    {isExpanded && sectionContent && (
                                      <div className="mt-2 ml-19 pl-16 border-l-2 border-purple-200 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                                        {sectionContent}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()
        ) : activeView === 'dumping' ? (
          // ── Anti-Dumping Notices ────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Anti-Dumping & Countervailing Duty Notices</h2>
              <p className="text-xs text-gray-500 mb-3">Current measures from the Dumping Commodity Register (DCR) — goods subject to additional dumping/countervailing duties on import</p>
              <input type="text" value={dumpFilter} onChange={(e) => setDumpFilter(e.target.value)} placeholder="Search by commodity, country, tariff chapter..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              <p className="text-xs text-gray-400 mt-2">{filteredDumpCategories.reduce((s, c) => s + c.notices.length, 0)} of {dumpData.length} measures</p>
            </div>

            {dumpLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading dumping notices...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDumpCategories.map((cg) => (
                  <div key={cg.category} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedDumpCat(expandedDumpCat === cg.category ? null : cg.category)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-orange-50 transition-colors">
                      <div>
                        <span className="font-semibold text-orange-800">{cg.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{cg.notices.length} measures</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedDumpCat === cg.category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedDumpCat === cg.category && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {cg.notices.map((n) => (
                          <div key={n.id} className="px-5 py-3 text-sm">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-gray-800">{n.commodity}</span>
                              <span className={`text-xs px-2 py-0.5 rounded shrink-0 ml-2 ${n.measure_type.includes('Countervailing') ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{n.measure_type}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Countries:</span> {n.countries}</p>
                            {n.tariff_chapters && <p className="text-xs text-gray-500"><span className="font-medium">Tariff:</span> {n.tariff_chapters}</p>}
                            {n.duty_info && <p className="text-xs text-orange-700 font-medium mt-1">{n.duty_info}</p>}
                            {n.expiry_info && <p className="text-xs text-blue-600 mt-1">{n.expiry_info}</p>}
                            {n.notes && <p className="text-xs text-gray-400 mt-1 italic">{n.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'acn' ? (
          // ── Australian Customs Notices ──────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Australian Customs Notices (ACNs)</h2>
              <p className="text-xs text-gray-500 mb-3">Official notices from the Australian Border Force covering duty rates, broker licensing, prohibited goods, and FTA implementation</p>
              <input type="text" value={acnFilter} onChange={(e) => setAcnFilter(e.target.value)} placeholder="Search by notice number, title, category..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              <p className="text-xs text-gray-400 mt-2">{filteredAcnYears.reduce((s, y) => s + y.notices.length, 0)} of {acnData.length} notices</p>
            </div>

            {acnLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAcnYears.map((yg) => (
                  <div key={yg.year} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedAcnYear(expandedAcnYear === yg.year ? null : yg.year)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-orange-50 transition-colors">
                      <div>
                        <span className="font-semibold text-orange-800 text-lg">{yg.year}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{yg.notices.length} notices</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedAcnYear === yg.year ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedAcnYear === yg.year && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {yg.notices.map((n) => (
                          <div key={n.id} className="px-5 py-3 text-sm">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-start gap-3">
                                <span className="font-mono text-orange-600 font-medium w-28 shrink-0">{n.notice_number}</span>
                                <span className="font-medium text-gray-800">{n.title}</span>
                              </div>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded shrink-0 ml-2">{n.category}</span>
                            </div>
                            {n.summary && <p className="text-xs text-gray-500 ml-31 pl-28">{n.summary}</p>}
                            {n.effective_date && <p className="text-xs text-blue-600 ml-31 pl-28 mt-0.5">Effective: {n.effective_date}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'aqis' ? (
          // ── AQIS Producer ──────────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">AQIS Producer — Approved Establishments</h2>
              <p className="text-xs text-gray-500 mb-3">Commodity programmes, establishment types, approved arrangements, and registration data managed by DAFF (formerly AQIS)</p>
              <input type="text" value={aqisFilter} onChange={(e) => setAqisFilter(e.target.value)} placeholder="Search by commodity, establishment type, requirements..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              <p className="text-xs text-gray-400 mt-2">{filteredAqisCategories.reduce((s, c) => s + c.items.length, 0)} of {aqisData.length} entries</p>
            </div>

            {aqisLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAqisCategories.map((cg) => (
                  <div key={cg.category} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedAqisCat(expandedAqisCat === cg.category ? null : cg.category)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-teal-50 transition-colors">
                      <div>
                        <span className="font-semibold text-teal-800">{cg.category_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{cg.items.length} items</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedAqisCat === cg.category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandedAqisCat === cg.category && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {cg.items.map((item) => (
                          <div key={item.id} className="px-5 py-3 text-sm">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-gray-800">{item.item_title}</span>
                              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.item_type}</span>
                            </div>
                            {item.description && <p className="text-xs text-gray-600 mb-1">{item.description}</p>}
                            {item.requirements && <p className="text-xs text-gray-500"><span className="font-medium">Requirements:</span> {item.requirements}</p>}
                            {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (activeView === 'precedents' || activeView === 'compendium' || activeView === 'tco' || activeView === 'alpha-index' || activeView === 'hsen') ? (
          // ── Generic Classification Tools ──────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {activeView === 'precedents' ? 'Tariff Precedents & Classification Rules'
                  : activeView === 'compendium' ? 'Compendium of Classification Opinions'
                  : activeView === 'tco' ? 'Tariff Concession Orders (TCOs)'
                  : activeView === 'alpha-index' ? 'HS Alphabetical Index'
                  : 'HS Explanatory Notes (HSEN)'}
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                {activeView === 'precedents' ? 'Binding classification precedents and rules used by the ABF for tariff determination'
                  : activeView === 'compendium' ? 'WCO classification opinions for consistent HS code interpretation worldwide'
                  : activeView === 'tco' ? 'Concession orders granting duty-free or reduced-duty import of specific goods'
                  : activeView === 'alpha-index' ? 'Alphabetical listing of goods mapped to HS codes for quick lookup'
                  : 'Detailed explanatory notes supporting HS classification decisions'}
              </p>
              <input
                type="text"
                value={genericFilter[activeView] || ''}
                onChange={(e) => setGenericFilter(prev => ({ ...prev, [activeView]: e.target.value }))}
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-2">
                {(() => {
                  const gd = genericData[activeView];
                  if (!gd) return '0 items';
                  const filter = (genericFilter[activeView] || '').toLowerCase();
                  const total = gd.data.length;
                  if (!filter) return `${total} items`;
                  const filtered = gd.categories.reduce((s, c) => s + c.items.filter((item: any) => JSON.stringify(item).toLowerCase().includes(filter)).length, 0);
                  return `${filtered} of ${total} items`;
                })()}
              </p>
            </div>

            {genericData[activeView]?.loading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(genericData[activeView]?.categories || [])
                  .map(cg => {
                    const filter = (genericFilter[activeView] || '').toLowerCase();
                    const filteredItems = filter ? cg.items.filter((item: any) => JSON.stringify(item).toLowerCase().includes(filter)) : cg.items;
                    if (filter && filteredItems.length === 0) return null;
                    return { ...cg, items: filteredItems };
                  })
                  .filter(Boolean)
                  .map((cg: any) => (
                  <div key={cg.key} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setGenericFilter(prev => ({ ...prev, [`_expanded_${activeView}`]: prev[`_expanded_${activeView}`] === cg.key ? '' : cg.key }))}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-indigo-800">{cg.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{cg.items.length} items</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${genericFilter[`_expanded_${activeView}`] === cg.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {genericFilter[`_expanded_${activeView}`] === cg.key && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {cg.items.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="px-5 py-3 text-sm">
                            {activeView === 'precedents' && (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-gray-800">{item.goods_description}</span>
                                  {item.tariff_classification && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.tariff_classification}</span>}
                                </div>
                                {item.reasoning && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Reasoning:</span> {item.reasoning}</p>}
                                {item.scope && <p className="text-xs text-gray-500"><span className="font-medium">Scope:</span> {item.scope}</p>}
                                {item.chapter && <p className="text-xs text-gray-400 mt-1">Chapter: {item.chapter}</p>}
                              </>
                            )}
                            {activeView === 'compendium' && (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-gray-800">{item.section_title}</span>
                                  {item.chapters && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.chapters}</span>}
                                </div>
                                {item.example_opinion && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Opinion:</span> {item.example_opinion}</p>}
                                {item.example_code && <p className="text-xs text-gray-500"><span className="font-medium">Code:</span> {item.example_code}</p>}
                                {item.example_reasoning && <p className="text-xs text-gray-500"><span className="font-medium">Reasoning:</span> {item.example_reasoning}</p>}
                                {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
                              </>
                            )}
                            {activeView === 'tco' && (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-gray-800">{item.item_title}</span>
                                  {item.reference && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.reference}</span>}
                                </div>
                                {item.description && <p className="text-xs text-gray-600 mb-1">{item.description}</p>}
                                {item.detail && <p className="text-xs text-gray-500"><span className="font-medium">Detail:</span> {item.detail}</p>}
                                {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
                              </>
                            )}
                            {activeView === 'alpha-index' && (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-gray-800">{item.goods_description}</span>
                                  {item.hs_code && <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.hs_code}</span>}
                                </div>
                                {item.chapter && <p className="text-xs text-gray-500">Chapter: {item.chapter}</p>}
                                {item.section && <p className="text-xs text-gray-400">Section: {item.section}</p>}
                              </>
                            )}
                            {activeView === 'hsen' && (
                              <>
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-medium text-gray-800">{item.section_title}</span>
                                  {item.chapters && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 ml-2">{item.chapters}</span>}
                                </div>
                                {item.scope && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Scope:</span> {item.scope}</p>}
                                {item.key_notes && <p className="text-xs text-gray-500"><span className="font-medium">Key Notes:</span> {item.key_notes}</p>}
                                {item.classification_guidance && <p className="text-xs text-gray-500"><span className="font-medium">Guidance:</span> {item.classification_guidance}</p>}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'cpquestions' ? (
          // ── CP Questions ────────────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Community Protection Questions</h2>
              <p className="text-xs text-gray-500 mb-3">Questions required on import declarations to assess biosecurity, prohibited goods, and compliance risks</p>
              <input type="text" value={cpFilter} onChange={(e) => setCpFilter(e.target.value)} placeholder="Search by keyword, category, regulation..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              <p className="text-xs text-gray-400 mt-2">{filteredCpCategories.reduce((s, c) => s + c.questions.length, 0)} of {cpData.length} questions</p>
            </div>

            {cpLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading CP questions...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCpCategories.map((cg) => (
                  <div key={cg.category} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedCpCat(expandedCpCat === cg.category ? null : cg.category)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-amber-50 transition-colors">
                      <div>
                        <span className="font-semibold text-amber-800">{cg.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{cg.questions.length} Q&apos;s</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedCpCat === cg.category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedCpCat === cg.category && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {cg.questions.map((q) => (
                          <div key={q.id} className="px-5 py-3 text-sm">
                            <div className="flex items-start gap-3 mb-2">
                              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded shrink-0">CP {q.cp_number}</span>
                              {q.effective_date && <span className="text-xs text-gray-400">Effective: {q.effective_date}</span>}
                            </div>
                            <p className="text-gray-700 mb-2">{q.question_text}</p>
                            {q.applies_to && <p className="text-xs text-gray-500 mb-1"><span className="font-medium">Applies to:</span> {q.applies_to}</p>}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {q.answer_y && (
                                <div className="bg-red-50 rounded p-2">
                                  <span className="text-xs font-bold text-red-700">Y:</span>
                                  <span className="text-xs text-red-600 ml-1">{q.answer_y}</span>
                                </div>
                              )}
                              {q.answer_n && (
                                <div className="bg-green-50 rounded p-2">
                                  <span className="text-xs font-bold text-green-700">N:</span>
                                  <span className="text-xs text-green-600 ml-1">{q.answer_n}</span>
                                </div>
                              )}
                            </div>
                            {q.notes && <p className="text-xs text-gray-400 mt-2 italic">{q.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'reffiles' ? (
          // ── ABF Reference Files ─────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
              <a href="https://www.ccf.customs.gov.au/reference" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                CCF Portal <ExternalIcon />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">ABF Software Reference Files</h2>
              <p className="text-xs text-gray-500 mb-3">ICS reference data files used for import/export declaration validation, tariff classification, and compliance</p>
              <input type="text" value={refFilter} onChange={(e) => setRefFilter(e.target.value)} placeholder="Search by file code or description..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              <p className="text-xs text-gray-400 mt-2">{filteredRefCategories.reduce((s, c) => s + c.files.length, 0)} of {refFilesData.length} files</p>
            </div>

            {refLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading reference files...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRefCategories.map((cg) => (
                  <div key={cg.category} className="bg-white rounded-lg shadow overflow-hidden">
                    <button onClick={() => setExpandedRefCat(expandedRefCat === cg.category ? null : cg.category)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
                      <div>
                        <span className="font-semibold text-blue-800">{cg.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{cg.files.length} files</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedRefCat === cg.category ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedRefCat === cg.category && (
                      <div className="border-t border-gray-100">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-28">Code</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-48">Name</th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {cg.files.map((f) => (
                              <tr key={f.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-2 font-mono text-blue-600 text-xs font-bold">{f.file_code}</td>
                                <td className="px-4 py-2 text-gray-700">{f.file_name}</td>
                                <td className="px-4 py-2 text-gray-500 text-xs">{f.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'ahecc' ? (
          // ── AHECC Export Classification ─────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
              <a
                href="https://www.abs.gov.au/statistics/classifications/australian-harmonized-export-commodity-classification-ahecc/latest-release"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View on ABS <ExternalIcon />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Australian Harmonized Export Commodity Classification (AHECC)</h2>
              <p className="text-xs text-gray-500 mb-3">
                8-digit export classification codes — first 6 digits align with HS codes, last 2 digits are Australian statistical extensions
              </p>
              <input
                type="text"
                value={aheccFilter}
                onChange={(e) => setAheccFilter(e.target.value)}
                placeholder="Search by chapter number or description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-2">
                {filteredAheccSections.reduce((sum, s) => sum + s.chapters.length, 0)} of {aheccData.length} chapters across {filteredAheccSections.length} sections
              </p>
            </div>

            {aheccLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading AHECC codes...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAheccSections.map((sg) => (
                  <div key={sg.section_number} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedAheccSection(expandedAheccSection === sg.section_number ? null : sg.section_number)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-teal-700 mr-3">Section {sg.section_number}</span>
                        <span className="text-gray-800">{sg.section_title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{sg.chapters.length} ch.</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedAheccSection === sg.section_number ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedAheccSection === sg.section_number && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {sg.chapters.map((ch) => (
                          <div key={ch.id} className="px-6 py-2.5 text-sm hover:bg-blue-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="font-mono text-teal-600 font-medium w-10 shrink-0">Ch.{ch.chapter_number}</span>
                              <span className="text-gray-700">{ch.chapter_title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeView === 'chemicals' ? (
          // ── Chemical Index ──────────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
              <a
                href="https://www.opcw.org/chemical-weapons-convention/annexes/annex-chemicals"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View on OPCW <ExternalIcon />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Chemical Index — CWC Scheduled Chemicals</h2>
              <p className="text-xs text-gray-500 mb-3">
                Schedule 11 of the Customs (Prohibited Imports) Regulations 1956 — Chemical Weapons Convention Schedules 1-3
              </p>
              <input
                type="text"
                value={chemsFilter}
                onChange={(e) => setChemsFilter(e.target.value)}
                placeholder="Search by chemical name, CAS number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-2">
                {filteredChemGroups.reduce((sum, g) => sum + g.chemicals.length, 0)} of {chemsData.length} chemicals
              </p>
            </div>

            {chemsLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading chemicals...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChemGroups.map((g) => {
                  const scheduleLabel = g.schedule === '1' ? 'CWC Schedule 1 — Highest risk' : g.schedule === '2' ? 'CWC Schedule 2 — Significant risk' : 'CWC Schedule 3 — Dual-use chemicals';
                  const scheduleColor = g.schedule === '1' ? 'text-red-700' : g.schedule === '2' ? 'text-orange-700' : 'text-yellow-700';
                  const badgeColor = g.schedule === '1' ? 'bg-red-100 text-red-700' : g.schedule === '2' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
                  return (
                    <div key={g.schedule} className="bg-white rounded-lg shadow overflow-hidden">
                      <button
                        onClick={() => setExpandedChemSchedule(expandedChemSchedule === g.schedule ? null : g.schedule)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                      >
                        <div>
                          <span className={`font-mono font-bold mr-3 ${scheduleColor}`}>Schedule {g.schedule}</span>
                          <span className="text-gray-800">{scheduleLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <span className="text-xs text-gray-400">{g.chemicals.length} chemicals</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedChemSchedule === g.schedule ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {expandedChemSchedule === g.schedule && (
                        <div className="border-t border-gray-100">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-16">Item</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Chemical Name</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-32">CAS No.</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-28">Category</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {g.chemicals.map((c) => (
                                  <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-4 py-2 font-mono text-blue-600 text-xs">{c.item_number}</td>
                                    <td className="px-4 py-2 text-gray-700">
                                      {c.chemical_name}
                                      {c.notes && <span className="text-xs text-gray-400 ml-2">({c.notes})</span>}
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.cas_number || '—'}</td>
                                    <td className="px-4 py-2">
                                      <span className={`text-xs px-2 py-0.5 rounded ${badgeColor}`}>{c.category}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeSchedule ? (
          // ── Schedule Browse View ─────────────────────────────────
          <div>
            {/* Back + ABF link bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>

            {scheduleLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading schedule data...</p>
              </div>
            ) : activeSchedule.dataSource === 'external' ? (
              // ── External only ────────────────────────────────────
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{activeSchedule.label}</h2>
                <p className="text-gray-600 mb-4">{activeSchedule.title}</p>
                <p className="text-gray-500 mb-6">This schedule is available on the Australian Border Force website.</p>
                <a
                  href={activeSchedule.abfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                >
                  Open {activeSchedule.label} on ABF <ExternalIcon />
                </a>
              </div>
            ) : activeSchedule.dataSource === 'countries' ? (
              // ── Schedule 1: Countries ────────────────────────────
              <div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <input
                    type="text"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    placeholder="Filter countries..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2">{filteredCountries.length} of {countries.length} countries</p>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Schedule</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCountries.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50">
                          <td className="px-4 py-2 text-gray-800">{c.country}</td>
                          <td className="px-4 py-2 font-mono text-gray-600">{c.abbreviation}</td>
                          <td className="px-4 py-2 text-gray-600">{c.schedule}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{c.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeSchedule.dataSource === 'rules' ? (
              // ── Schedule 2: Interpretative Rules ─────────────────
              <div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <input
                    type="text"
                    value={rulesFilter}
                    onChange={(e) => setRulesFilter(e.target.value)}
                    placeholder="Search rules..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2">{filteredRules.length} of {SCHEDULE_2_RULES.length} rules</p>
                </div>
                <div className="space-y-3">
                  {filteredRules.map((r) => (
                    <div key={r.rule} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-start gap-3">
                        <span className="font-mono font-bold text-blue-700 w-20 shrink-0">{r.rule}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{r.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeSchedule.dataSource === 'sections' ? (
              // ── Schedule 3: Sections & Chapters ──────────────────
              <div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <input
                    type="text"
                    value={sectionsFilter}
                    onChange={(e) => setSectionsFilter(e.target.value)}
                    placeholder="Search sections and chapters..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2">{filteredSections.length} of {sections.length} sections</p>
                </div>
              <div className="space-y-3">
                {filteredSections.map((section) => (
                  <div key={section.number} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.number ? null : section.number)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-700 mr-3">Section {toRoman(section.number)}</span>
                        <span className="text-gray-800">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{section.chapters.length} chapters</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === section.number ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedSection === section.number && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {section.chapters.map((ch) => (
                          <button
                            key={ch.number}
                            onClick={() => browseChapter(ch.number)}
                            className="w-full text-left px-6 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors"
                          >
                            <span className="font-mono text-blue-600 font-medium w-8">
                              {String(ch.number).padStart(2, '0')}
                            </span>
                            <span className="text-gray-700">{ch.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </div>
            ) : activeSchedule.dataSource === 'fta' ? (
              // ── FTA Exclusion Schedules ──────────────────────────
              <div>
                {ftaExclusions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500 mb-4">No local data available for {activeSchedule.label} yet.</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                      <input
                        type="text"
                        value={ftaFilter}
                        onChange={(e) => setFtaFilter(e.target.value)}
                        placeholder="Search by HS code or description..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                      <p className="text-xs text-gray-400 mt-2">{filteredFta.length} of {ftaExclusions.length} exclusions</p>
                    </div>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">HS Code</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Duty Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredFta.map((ex, i) => (
                            <tr key={i} className="hover:bg-blue-50">
                              <td className="px-4 py-2 font-mono text-blue-700 whitespace-nowrap">{ex.hs_code}</td>
                              <td className="px-4 py-2 text-gray-700">{ex.description}</td>
                              <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{ex.duty_rate || '\u2014'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <div className={`mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono ${
        highlight ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-800'
      }`}>
        {value}
      </div>
    </div>
  );
}

function ScheduleMenuItem({ schedule, onClick }: { schedule: ScheduleInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
    >
      <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">{schedule.label}</span>
      <span className="text-sm text-gray-700">{schedule.title}</span>
      {schedule.dataSource === 'external' && (
        <ExternalIcon className="shrink-0 mt-0.5 ml-auto" />
      )}
    </button>
  );
}

function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 text-gray-400 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function toRoman(num: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}
