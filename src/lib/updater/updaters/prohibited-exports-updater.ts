import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs (Prohibited Exports) Regulations 1958 updater — EPUB-based.
 * Series ID: F1996B02828
 */
export class ProhibitedExportsUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'F1996B02828',
      tableName: 'prohibited_exports_regs',
      sourceId: 'prohibited_exports',
      sourceName: 'Customs (Prohibited Exports) Regulations 1958',
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
      ftsTable: 'prohibited_exports_regs_fts',
    });
  }
}
