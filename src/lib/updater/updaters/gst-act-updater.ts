import { LegislationEpubUpdater } from './legislation-epub-updater';

/**
 * A New Tax System (Goods and Services Tax) Act 1999 updater — EPUB-based.
 * Series ID: C2004A00446
 *
 * The gst_act table uses chapter/chapter_title as its primary grouping,
 * with division/division_title. The EPUB parser maps Part -> chapter and
 * Division -> division for this Act.
 */
export class GstActUpdater extends LegislationEpubUpdater {
  constructor() {
    super({
      seriesId: 'C2004A00446',
      tableName: 'gst_act',
      sourceId: 'gst_act',
      sourceName: 'GST Act 1999',
      defaultCron: '0 3 1 * *',
      columns: {
        partColumn: 'chapter',
        partTitleColumn: 'chapter_title',
        divisionColumn: 'part',
        divisionTitleColumn: 'part_title',
        subdivisionColumn: null,
        subdivisionTitleColumn: null,
        sectionColumn: 'division',
        titleColumn: 'division_title',
        contentColumn: 'content',
        categoryColumn: null,
        sectionRangeColumn: null,
      },
      ftsTable: 'gst_act_fts',
    });
  }
}
