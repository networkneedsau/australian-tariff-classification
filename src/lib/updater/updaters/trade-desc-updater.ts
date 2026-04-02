import { DualLegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Commerce (Trade Descriptions) Act 1905 and Regulations updater — EPUB-based.
 * Act Series ID: C2004A07524
 * Regs Series ID: F2016L00515
 */
export class TradeDescUpdater extends DualLegislationEpubUpdater {
  constructor() {
    super({
      sourceId: 'trade_desc',
      sourceName: 'Commerce (Trade Descriptions) Act 1905',
      defaultCron: '0 3 1 * *',
      act: {
        seriesId: 'C2004A07524',
        tableName: 'trade_desc_act',
        sourceId: 'trade_desc',
        sourceName: 'Commerce (Trade Descriptions) Act 1905',
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
        ftsTable: 'trade_desc_act_fts',
      },
      reg: {
        seriesId: 'F2016L00515',
        tableName: 'trade_desc_regs',
        sourceId: 'trade_desc',
        sourceName: 'Commerce (Trade Descriptions) Regulations 2016',
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
        ftsTable: 'trade_desc_regs_fts',
      },
    });
  }
}
