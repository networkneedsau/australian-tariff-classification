import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * Customs Tariff Act 1995 updater — EPUB-based.
 * Series ID: C2004A04997
 */
export class CustomsTariffActUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'C2004A04997',
      tableName: 'customs_tariff_act',
      sourceId: 'customs_tariff_act',
      sourceName: 'Customs Tariff Act 1995',
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
      ftsTable: 'customs_tariff_act_fts',
    });
  }
}
