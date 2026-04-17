import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs Act 1901 updater — EPUB-based.
 * Series ID: C1901A00006
 */
export class CustomsActUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'C1901A00006',
      tableName: 'customs_act_sections',
      sourceId: 'customs_act',
      sourceName: 'Customs Act 1901',
      defaultCron: '0 3 1 * *',
      columns: {
        partColumn: 'part',
        partTitleColumn: 'part_title',
        divisionColumn: 'division',
        divisionTitleColumn: 'division_title',
        subdivisionColumn: 'subdivision',
        subdivisionTitleColumn: 'subdivision_title',
        sectionColumn: 'section_number',
        titleColumn: 'section_title',
        contentColumn: 'content',
        categoryColumn: null,
        sectionRangeColumn: null,
      },
      ftsTable: 'customs_act_sections_fts',
    });
  }
}
