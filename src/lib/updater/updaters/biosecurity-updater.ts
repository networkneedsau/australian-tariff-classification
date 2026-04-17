import { DualLegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Biosecurity Act 2015 and Biosecurity Regulation 2016 updater — EPUB-based.
 * Act Series ID: C2015A00061
 * Regs Series ID: F2016L00770
 *
 * These tables use chapter/chapter_title as grouping and section_range
 * instead of individual section numbers.
 */
export class BiosecurityUpdater extends DualLegislationEpubUpdater {
  constructor() {
    super({
      sourceId: 'biosecurity',
      sourceName: 'Biosecurity Act 2015',
      defaultCron: '0 3 1 * *',
      act: {
        seriesId: 'C2015A00061',
        tableName: 'biosecurity_act',
        sourceId: 'biosecurity',
        sourceName: 'Biosecurity Act 2015',
        defaultCron: '0 3 1 * *',
        columns: {
          partColumn: 'chapter',
          partTitleColumn: 'chapter_title',
          divisionColumn: 'part',
          divisionTitleColumn: 'part_title',
          subdivisionColumn: 'division',
          subdivisionTitleColumn: 'division_title',
          sectionColumn: 'section_range',
          titleColumn: 'section_range',
          contentColumn: null,
          categoryColumn: null,
          sectionRangeColumn: 'section_range',
        },
        ftsTable: 'biosecurity_act_fts',
      },
      reg: {
        seriesId: 'F2016L00770',
        tableName: 'biosecurity_regs',
        sourceId: 'biosecurity',
        sourceName: 'Biosecurity Regulation 2016',
        defaultCron: '0 3 1 * *',
        columns: {
          partColumn: 'chapter',
          partTitleColumn: 'chapter_title',
          divisionColumn: 'part',
          divisionTitleColumn: 'part_title',
          subdivisionColumn: 'division',
          subdivisionTitleColumn: 'division_title',
          sectionColumn: 'section_range',
          titleColumn: 'section_range',
          contentColumn: null,
          categoryColumn: null,
          sectionRangeColumn: 'section_range',
        },
        ftsTable: 'biosecurity_regs_fts',
      },
    });
  }
}
