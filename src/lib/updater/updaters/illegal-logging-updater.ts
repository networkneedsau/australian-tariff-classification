import { DualLegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Illegal Logging Prohibition Act 2012 and Regulation updater — EPUB-based.
 * Act Series ID: C2012A00166
 * Reg Series ID: F2012L02240
 */
export class IllegalLoggingUpdater extends DualLegislationEpubUpdater {
  constructor() {
    super({
      sourceId: 'illegal_logging',
      sourceName: 'Illegal Logging Prohibition Act 2012',
      defaultCron: '0 3 1 * *',
      act: {
        seriesId: 'C2012A00166',
        tableName: 'illegal_logging_act',
        sourceId: 'illegal_logging',
        sourceName: 'Illegal Logging Prohibition Act 2012',
        defaultCron: '0 3 1 * *',
        columns: {
          partColumn: 'part',
          partTitleColumn: 'part_title',
          divisionColumn: 'division',
          divisionTitleColumn: 'division_title',
          subdivisionColumn: 'subdivision',
          subdivisionTitleColumn: null,
          sectionColumn: 'section_number',
          titleColumn: 'section_title',
          contentColumn: 'content',
          categoryColumn: null,
          sectionRangeColumn: null,
        },
        ftsTable: 'illegal_logging_act_fts',
      },
      reg: {
        seriesId: 'F2012L02240',
        tableName: 'illegal_logging_reg',
        sourceId: 'illegal_logging',
        sourceName: 'Illegal Logging Prohibition Regulation 2012',
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
        ftsTable: 'illegal_logging_reg_fts',
      },
    });
  }
}
