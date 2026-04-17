import type { ScheduleInfo, RuleData } from '../types';

const ABF_BASE = 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff';

export const SCHEDULES: ScheduleInfo[] = [
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

export const SCHEDULE_2_RULES: RuleData[] = [
  { rule: 'Rule 1', title: 'Classification by heading', description: 'Classification is determined by the terms of the headings and any relative Section or Chapter Notes. Classification by other rules applies only when headings or Notes do not otherwise require.' },
  { rule: 'Rule 2', title: 'Incomplete articles and mixtures', description: '(a) References to an article include that article incomplete or unfinished, provided it has the essential character of the complete article, including articles presented unassembled or disassembled. (b) References to a material or substance include mixtures or combinations of that material with other materials or substances. Goods of two or more materials are classified per Rule 3.' },
  { rule: 'Rule 3', title: 'Multiple heading classification', description: 'When goods are classifiable under two or more headings: (a) the most specific description is preferred; (b) mixtures, composite goods, and goods in sets are classified by the material or component giving essential character; (c) when (a) and (b) do not apply, classify under the last in numerical order.' },
  { rule: 'Rule 4', title: 'Most akin goods', description: 'Goods which cannot be classified under Rules 1 to 3 shall be classified under the heading appropriate to the goods to which they are most akin.' },
  { rule: 'Rule 5', title: 'Containers and packing', description: '(a) Camera cases, musical instrument cases, and similar containers specially shaped for specific articles are classified with those articles when presented with them and of a kind normally sold therewith. (b) Packing materials and containers presented with goods are classified with those goods if they are of a kind normally used for packing, unless clearly suitable for repetitive use.' },
  { rule: 'Rule 6', title: 'Subheading classification', description: 'Classification at the subheading level is determined by the terms of those subheadings and any related Subheading Notes, applying Rules 1 to 5 mutatis mutandis. Only subheadings at the same level are comparable.' },
];

export { ABF_BASE };
