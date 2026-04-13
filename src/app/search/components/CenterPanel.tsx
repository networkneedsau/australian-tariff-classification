'use client';

import type { ActiveView, EntryResponse, CustomsEntryFields, ScheduleInfo } from '../types';
import type { TariffResult, ActSectionRow, RegulationRow, ChemicalRow, AHECCRow } from '../types';
import type { LegislationViewProps } from './views/LegislationView';
import {
  TariffTableView,
  TariffDetailView,
  LegislationView,
  ScheduleBrowseView,
  GenericCategoryView,
  SearchResultsView,
} from './views';

// ── Legislation configuration map ────────────────────────────────

const LEGISLATION_CONFIGS: Record<string, LegislationViewProps> = {
  'act': {
    title: 'Customs Act 1901',
    apiEndpoint: '/api/tariff/act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'regulations': {
    title: 'Customs (Prohibited Imports) Regulations 1956',
    apiEndpoint: '/api/tariff/regulations',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'gst-act': {
    title: 'A New Tax System (GST) Act 1999',
    apiEndpoint: '/api/tariff/gst-act',
    groupByField: 'chapter',
    groupTitleField: 'chapter_title',
    itemKeyField: 'division',
    itemTitleField: 'division_title',
    hasContent: true,
    itemPrefix: 'div.',
  },
  'customs-reg': {
    title: 'Customs Regulation 2015',
    apiEndpoint: '/api/tariff/customs-reg',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'ct-act': {
    title: 'Customs Tariff Act 1995',
    apiEndpoint: '/api/tariff/customs-tariff-act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'ct-regs': {
    title: 'Customs Tariff Regulations 2004',
    apiEndpoint: '/api/tariff/customs-tariff-regs',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'ad-act': {
    title: 'Customs Tariff (Anti-Dumping) Act 1975',
    apiEndpoint: '/api/tariff/anti-dumping-act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'pe-regs': {
    title: 'Customs (Prohibited Exports) Regulations 1958',
    apiEndpoint: '/api/tariff/prohibited-exports',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'intl-ob': {
    title: 'Customs (International Obligations) Regulation 2015',
    apiEndpoint: '/api/tariff/intl-obligations',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'bio-act': {
    title: 'Biosecurity Act 2015',
    apiEndpoint: '/api/tariff/biosecurity-act',
    groupByField: 'chapter',
    groupTitleField: 'chapter_title',
    itemKeyField: 'section_range',
    itemTitleField: 'part_title',
    hasContent: true,
    itemPrefix: '',
  },
  'bio-regs': {
    title: 'Biosecurity Regulation 2016',
    apiEndpoint: '/api/tariff/biosecurity-regs',
    groupByField: 'chapter',
    groupTitleField: 'chapter_title',
    itemKeyField: 'section_range',
    itemTitleField: 'part_title',
    hasContent: true,
    itemPrefix: '',
  },
  'td-act': {
    title: 'Commerce (Trade Descriptions) Act 1905',
    apiEndpoint: '/api/tariff/trade-desc-act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'td-regs': {
    title: 'Commerce (Trade Descriptions) Regulations 2016',
    apiEndpoint: '/api/tariff/trade-desc-regs',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'il-act': {
    title: 'Illegal Logging Prohibition Act 2012',
    apiEndpoint: '/api/tariff/illegal-logging-act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'il-reg': {
    title: 'Illegal Logging Prohibition Regulation 2012',
    apiEndpoint: '/api/tariff/illegal-logging-reg',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'ifc-act': {
    title: 'Imported Food Control Act 1992',
    apiEndpoint: '/api/tariff/imported-food-act',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'section_number',
    itemTitleField: 'section_title',
    hasContent: true,
    itemPrefix: 's.',
  },
  'ifc-reg': {
    title: 'Imported Food Control Regulation 2019',
    apiEndpoint: '/api/tariff/imported-food-reg',
    groupByField: 'part',
    groupTitleField: 'part_title',
    itemKeyField: 'regulation_number',
    itemTitleField: 'regulation_title',
    hasContent: true,
    itemPrefix: 'r.',
  },
  'gst-regs': {
    title: 'GST Regulations 2019',
    apiEndpoint: '/api/tariff/gst-regs',
    groupByField: 'chapter',
    groupTitleField: 'chapter_title',
    itemKeyField: 'division',
    itemTitleField: 'division_title',
    hasContent: false,
    itemPrefix: 'div.',
  },
};

// ── GenericCategoryView keys ─────────────────────────────────────

const GENERIC_CATEGORY_VIEWS: Set<ActiveView> = new Set([
  'chemicals',
  'ahecc',
  'dumping',
  'aqis',
  'reffiles',
  'cpquestions',
  'precedents',
  'compendium',
  'tco',
  'alpha-index',
  'hsen',
  'cbp-rulings',
  'acn',
]);

// ── Props ────────────────────────────────────────────────────────

interface CenterPanelProps {
  activeView: ActiveView;
  searchQuery: string;
  searchResults: TariffResult[];
  searchTotal: number;
  searchLoading: boolean;
  selectedEntry: EntryResponse | null;
  customsFields: CustomsEntryFields | null;
  activeSchedule: ScheduleInfo | null;
  onSelectTariffCode: (code: string) => void;
  onNavigateToView: (view: ActiveView) => void;
  // Secondary search results
  actResults?: ActSectionRow[];
  actTotal?: number;
  regsResults?: RegulationRow[];
  regsTotal?: number;
  chemsResults?: ChemicalRow[];
  chemsTotal?: number;
  aheccResults?: AHECCRow[];
  aheccTotal?: number;
}

export default function CenterPanel({
  activeView,
  searchQuery,
  searchResults,
  searchTotal,
  searchLoading,
  selectedEntry,
  customsFields,
  activeSchedule,
  onSelectTariffCode,
  onNavigateToView,
  actResults = [],
  actTotal = 0,
  regsResults = [],
  regsTotal = 0,
  chemsResults = [],
  chemsTotal = 0,
  aheccResults = [],
  aheccTotal = 0,
}: CenterPanelProps) {
  // ── Legislation views ──────────────────────────────────────────
  const legConfig = LEGISLATION_CONFIGS[activeView];
  if (legConfig) {
    return <LegislationView {...legConfig} />;
  }

  // ── Schedule browser ───────────────────────────────────────────
  const scheduleMap: Record<string, ScheduleInfo> = {
    'schedule-1': { id: 'schedule-1', label: 'Schedule 1', title: 'Countries & Places', dataSource: 'countries', abfUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-1' },
    'schedule-2': { id: 'schedule-2', label: 'Schedule 2', title: 'Interpretative Rules', dataSource: 'rules', abfUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-2' },
    'schedule-3': { id: 'schedule-3', label: 'Schedule 3', title: 'Classification of Goods', dataSource: 'sections', abfUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3' },
    'schedule-4': { id: 'schedule-4', label: 'Schedule 4', title: 'Concessional Rates', dataSource: 'fta', abfUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-4' },
    'schedule': activeSchedule ? { id: 'schedule', label: activeSchedule.label, title: activeSchedule.title, dataSource: activeSchedule.dataSource, abfUrl: activeSchedule.abfUrl } : null!,
  };
  const scheduleInfo = scheduleMap[activeView];
  if (scheduleInfo) {
    return (
      <ScheduleBrowseView
        schedule={scheduleInfo}
        onNavigateToCode={onSelectTariffCode}
      />
    );
  }

  // ── Generic category views (chemicals, dumping, tco, etc.) ────
  if (GENERIC_CATEGORY_VIEWS.has(activeView)) {
    return <GenericCategoryView viewKey={activeView} />;
  }

  // ── Default: search results view ──────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search results with optional tariff detail below */}
      <div className={`${selectedEntry ? 'h-1/2' : 'flex-1'} overflow-y-auto`}>
        <SearchResultsView
          searchQuery={searchQuery}
          results={searchResults}
          totalResults={searchTotal}
          actResults={actResults}
          actTotal={actTotal}
          regsResults={regsResults}
          regsTotal={regsTotal}
          chemsResults={chemsResults}
          chemsTotal={chemsTotal}
          aheccResults={aheccResults}
          aheccTotal={aheccTotal}
          loading={searchLoading}
          onSelectTariffCode={onSelectTariffCode}
          onNavigateToSource={onNavigateToView}
          selectedTariffCode={selectedEntry?.tariff_code}
        />
      </div>

      {/* Tariff detail panel (bottom half) */}
      {selectedEntry && (
        <div className="h-1/2 border-t border-gray-200 overflow-y-auto">
          <TariffDetailView
            entry={selectedEntry}
            customsFields={customsFields}
            onSelectCode={onSelectTariffCode}
          />
        </div>
      )}
    </div>
  );
}
