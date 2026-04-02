import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs Tariff (Anti-Dumping) Act 1975 updater — EPUB-based.
 * Series ID: C2004A01400
 */
export class AntiDumpingActUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'C2004A01400',
      tableName: 'anti_dumping_act',
      sourceId: 'anti_dumping_act',
      sourceName: 'Customs Tariff (Anti-Dumping) Act 1975',
      defaultCron: '0 3 1 * *',
      columns: {
        partColumn: 'part',
        partTitleColumn: 'part_title',
        divisionColumn: null,
        divisionTitleColumn: null,
        subdivisionColumn: null,
        subdivisionTitleColumn: null,
        sectionColumn: 'section_number',
        titleColumn: 'section_title',
        contentColumn: 'content',
        categoryColumn: null,
        sectionRangeColumn: null,
      },
      ftsTable: 'anti_dumping_act_fts',
    });
  }
}
