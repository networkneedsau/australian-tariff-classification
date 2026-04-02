import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs Regulation 2015 updater — EPUB-based.
 * Series ID: F2015L00659
 */
export class CustomsRegsUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'F2015L00659',
      tableName: 'customs_regulation',
      sourceId: 'customs_regs',
      sourceName: 'Customs Regulation 2015',
      defaultCron: '0 3 1 * *',
      columns: {
        partColumn: 'part',
        partTitleColumn: 'part_title',
        divisionColumn: 'division',
        divisionTitleColumn: 'division_title',
        subdivisionColumn: null,
        subdivisionTitleColumn: null,
        sectionColumn: 'regulation_number',
        titleColumn: 'regulation_title',
        contentColumn: 'content',
        categoryColumn: null,
        sectionRangeColumn: null,
      },
      ftsTable: 'customs_regulation_fts',
    });
  }
}
