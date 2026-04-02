import { DualLegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Imported Food Control Act 1992 and Regulation updater — EPUB-based.
 * Act Series ID: C2004A04489
 * Reg Series ID: F2019L00792
 */
export class ImportedFoodUpdater extends DualLegislationEpubUpdater {
  constructor() {
    super({
      sourceId: 'imported_food',
      sourceName: 'Imported Food Control Act 1992',
      defaultCron: '0 3 1 * *',
      act: {
        seriesId: 'C2004A04489',
        tableName: 'imported_food_act',
        sourceId: 'imported_food',
        sourceName: 'Imported Food Control Act 1992',
        defaultCron: '0 3 1 * *',
        columns: {
          partColumn: 'part',
          partTitleColumn: 'part_title',
          divisionColumn: 'division',
          divisionTitleColumn: 'division_title',
          subdivisionColumn: null,
          subdivisionTitleColumn: null,
          sectionColumn: 'section_number',
          titleColumn: 'section_title',
          contentColumn: 'content',
          categoryColumn: null,
          sectionRangeColumn: null,
        },
        ftsTable: 'imported_food_act_fts',
      },
      reg: {
        seriesId: 'F2019L00792',
        tableName: 'imported_food_reg',
        sourceId: 'imported_food',
        sourceName: 'Imported Food Control Regulation 2019',
        defaultCron: '0 3 1 * *',
        columns: {
          partColumn: 'part',
          partTitleColumn: 'part_title',
          divisionColumn: 'division',
          divisionTitleColumn: 'division_title',
          subdivisionColumn: 'subdivision',
          subdivisionTitleColumn: null,
          sectionColumn: 'regulation_number',
          titleColumn: 'regulation_title',
          contentColumn: 'content',
          categoryColumn: null,
          sectionRangeColumn: null,
        },
        ftsTable: 'imported_food_reg_fts',
      },
    });
  }
}
