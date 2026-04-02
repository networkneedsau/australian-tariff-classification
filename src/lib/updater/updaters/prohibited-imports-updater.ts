import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs (Prohibited Imports) Regulations 1956 updater — EPUB-based.
 * Series ID: F1996B02827
 */
export class ProhibitedImportsUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'F1996B02827',
      tableName: 'prohibited_imports_regs',
      sourceId: 'prohibited_imports',
      sourceName: 'Customs (Prohibited Imports) Regulations 1956',
      defaultCron: '0 3 1 * *',
      columns: {
        partColumn: 'part',
        partTitleColumn: 'part_title',
        divisionColumn: null,
        divisionTitleColumn: null,
        subdivisionColumn: null,
        subdivisionTitleColumn: null,
        sectionColumn: 'regulation_number',
        titleColumn: 'regulation_title',
        contentColumn: 'content',
        categoryColumn: 'category',
        sectionRangeColumn: null,
      },
      ftsTable: 'prohibited_imports_fts',
    });
  }
}
