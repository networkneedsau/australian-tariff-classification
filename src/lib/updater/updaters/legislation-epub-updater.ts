import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import {
  fetchLegislation,
  type LegislationSection,
} from '../scrapers/epub-parser';
import { logInfo, logWarn, logError } from '../update-logger';

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

/**
 * Column mapping that defines how LegislationSection fields map to a specific
 * database table's columns. Each key is the DB column name, each value is the
 * LegislationSection field (or a static string prefixed with '=').
 */
export interface ColumnMapping {
  /** Maps to LegislationSection.part (or 'chapter' alias) */
  partColumn: string;
  /** Maps to LegislationSection.part_title */
  partTitleColumn: string;
  /** Maps to LegislationSection.division — set to null to omit */
  divisionColumn: string | null;
  /** Maps to LegislationSection.division_title — set to null to omit */
  divisionTitleColumn: string | null;
  /** Subdivision column name — set to null to omit (always empty for EPUB) */
  subdivisionColumn: string | null;
  /** Subdivision title column name — set to null to omit */
  subdivisionTitleColumn: string | null;
  /** Section/regulation number column name */
  sectionColumn: string;
  /** Section/regulation title column name */
  titleColumn: string;
  /** Content column name — set to null if table has no content column */
  contentColumn: string | null;
  /** Category column name (for prohibited imports) — set to null to omit */
  categoryColumn: string | null;
  /** Section range column name (for biosecurity tables) — set to null to omit */
  sectionRangeColumn: string | null;
}

export interface LegislationConfig {
  /** legislation.gov.au Series ID, e.g. "C1901A00006" */
  seriesId: string;
  /** Database table name, e.g. "customs_act_sections" */
  tableName: string;
  /** Source ID for update_status, e.g. "customs_act" */
  sourceId: string;
  /** Human-readable name, e.g. "Customs Act 1901" */
  sourceName: string;
  /** Default cron schedule */
  defaultCron: string;
  /** Column mapping for the target table */
  columns: ColumnMapping;
  /** FTS table name suffix for rebuild (e.g. "customs_act_sections_fts"). null to skip. */
  ftsTable: string | null;
}

/**
 * Configuration for updaters that handle BOTH an Act and its Regulation
 * in a single updater (e.g. Biosecurity Act + Biosecurity Regulation).
 */
export interface DualLegislationConfig {
  sourceId: string;
  sourceName: string;
  defaultCron: string;
  act: LegislationConfig;
  reg: LegislationConfig;
}

// ---------------------------------------------------------------------------
// Single-legislation EPUB updater
// ---------------------------------------------------------------------------

export class LegislationEpubUpdater extends BaseUpdater {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly defaultCron: string;
  readonly targetTables: string[];

  constructor(private config: LegislationConfig) {
    super();
    this.sourceId = config.sourceId;
    this.sourceName = config.sourceName;
    this.defaultCron = config.defaultCron;
    this.targetTables = [config.tableName];
  }

  async fetch(): Promise<LegislationSection[]> {
    return fetchLegislation(this.config.seriesId);
  }

  apply(db: Database.Database, data: LegislationSection[]): ApplyResult {
    // Safety: don't delete existing data if EPUB returned nothing
    if (!data || data.length === 0) {
      logWarn(
        this.sourceId,
        `EPUB returned 0 sections for ${this.config.sourceName} — keeping existing data`
      );
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    const { tableName, columns, ftsTable } = this.config;

    // Build INSERT column list and placeholder list dynamically
    const colNames: string[] = [];
    const placeholders: string[] = [];

    colNames.push(columns.partColumn);
    placeholders.push('?');

    colNames.push(columns.partTitleColumn);
    placeholders.push('?');

    if (columns.divisionColumn) {
      colNames.push(columns.divisionColumn);
      placeholders.push('?');
    }
    if (columns.divisionTitleColumn) {
      colNames.push(columns.divisionTitleColumn);
      placeholders.push('?');
    }
    if (columns.subdivisionColumn) {
      colNames.push(columns.subdivisionColumn);
      placeholders.push('?');
    }
    if (columns.subdivisionTitleColumn) {
      colNames.push(columns.subdivisionTitleColumn);
      placeholders.push('?');
    }

    // Section range column (biosecurity) — if present, we skip section/title/content
    if (columns.sectionRangeColumn) {
      colNames.push(columns.sectionRangeColumn);
      placeholders.push('?');
    } else {
      colNames.push(columns.sectionColumn);
      placeholders.push('?');

      colNames.push(columns.titleColumn);
      placeholders.push('?');

      if (columns.contentColumn) {
        colNames.push(columns.contentColumn);
        placeholders.push('?');
      }
    }

    if (columns.categoryColumn) {
      colNames.push(columns.categoryColumn);
      placeholders.push('?');
    }

    db.prepare(`DELETE FROM ${tableName}`).run();

    const insertSql = `INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const insert = db.prepare(insertSql);

    for (const row of data) {
      const values: (string | null)[] = [];

      values.push(row.part || '');
      values.push(row.part_title || '');

      if (columns.divisionColumn) values.push(row.division || '');
      if (columns.divisionTitleColumn) values.push(row.division_title || '');
      if (columns.subdivisionColumn) values.push('');
      if (columns.subdivisionTitleColumn) values.push('');

      if (columns.sectionRangeColumn) {
        // For biosecurity-style tables, put section_number in section_range
        values.push(row.section_number || '');
      } else {
        values.push(row.section_number || '');
        values.push(row.section_title || '');
        if (columns.contentColumn) values.push(row.content || '');
      }

      if (columns.categoryColumn) values.push('');

      insert.run(...values);
    }

    // Rebuild FTS index if configured
    if (ftsTable) {
      try {
        db.exec(`INSERT INTO ${ftsTable}(${ftsTable}) VALUES('rebuild')`);
      } catch {
        // FTS table may not exist yet — non-fatal
      }
    }

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}

// ---------------------------------------------------------------------------
// Dual-legislation EPUB updater (Act + Regulation in one updater)
// ---------------------------------------------------------------------------

export class DualLegislationEpubUpdater extends BaseUpdater {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly defaultCron: string;
  readonly targetTables: string[];

  constructor(private config: DualLegislationConfig) {
    super();
    this.sourceId = config.sourceId;
    this.sourceName = config.sourceName;
    this.defaultCron = config.defaultCron;
    this.targetTables = [config.act.tableName, config.reg.tableName];
  }

  async fetch(): Promise<{
    act: LegislationSection[];
    reg: LegislationSection[];
  }> {
    const act = await fetchLegislation(this.config.act.seriesId);

    let reg: LegislationSection[] = [];
    try {
      reg = await fetchLegislation(this.config.reg.seriesId);
    } catch (err: any) {
      logWarn(
        this.sourceId,
        `Could not fetch regulation EPUB (${this.config.reg.seriesId}): ${err?.message} — keeping existing reg data`
      );
    }

    return { act, reg };
  }

  apply(
    db: Database.Database,
    data: { act: LegislationSection[]; reg: LegislationSection[] }
  ): ApplyResult {
    // Safety: don't delete existing data if both fetches returned nothing
    if (data.act.length === 0 && data.reg.length === 0) {
      logWarn(
        this.sourceId,
        `Both act and reg EPUBs returned 0 sections — keeping existing data`
      );
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    let totalAdded = 0;

    // Apply act data
    if (data.act.length > 0) {
      const actUpdater = new LegislationEpubUpdater(this.config.act);
      const actResult = actUpdater.apply(db, data.act);
      totalAdded += actResult.added;
    }

    // Apply reg data
    if (data.reg.length > 0) {
      const regUpdater = new LegislationEpubUpdater(this.config.reg);
      const regResult = regUpdater.apply(db, data.reg);
      totalAdded += regResult.added;
    }

    return { added: totalAdded, removed: 0, modified: 0, total: totalAdded };
  }
}

// ---------------------------------------------------------------------------
// Factory: create updater from a simple config
// ---------------------------------------------------------------------------

/** Shorthand config for creating a single-legislation updater. */
export interface SimpleLegislationConfig {
  seriesId: string;
  tableName: string;
  sourceId: string;
  sourceName: string;
  defaultCron?: string;
  /** 'act' uses section_number/section_title, 'reg' uses regulation_number/regulation_title */
  type: 'act' | 'reg';
  /** Extra columns the table has (auto-detected where possible) */
  hasContent?: boolean;
  hasDivision?: boolean;
  hasSubdivision?: boolean;
  hasSubdivisionTitle?: boolean;
  hasCategory?: boolean;
  /** For biosecurity-style tables with section_range instead of section/content */
  hasSectionRange?: boolean;
  /** Uses chapter/chapter_title instead of part/part_title */
  usesChapter?: boolean;
  /** Custom FTS table name. Set false to skip FTS rebuild. */
  ftsTable?: string | false;
}

export function createLegislationEpubUpdater(
  cfg: SimpleLegislationConfig
): LegislationEpubUpdater {
  const sectionCol = cfg.type === 'reg' ? 'regulation_number' : 'section_number';
  const titleCol = cfg.type === 'reg' ? 'regulation_title' : 'section_title';
  const partCol = cfg.usesChapter ? 'chapter' : 'part';
  const partTitleCol = cfg.usesChapter ? 'chapter_title' : 'part_title';

  const columns: ColumnMapping = {
    partColumn: partCol,
    partTitleColumn: partTitleCol,
    divisionColumn: cfg.hasDivision !== false ? 'division' : null,
    divisionTitleColumn: cfg.hasDivision !== false ? 'division_title' : null,
    subdivisionColumn: cfg.hasSubdivision ? 'subdivision' : null,
    subdivisionTitleColumn: cfg.hasSubdivisionTitle ? 'subdivision_title' : null,
    sectionColumn: sectionCol,
    titleColumn: titleCol,
    contentColumn: cfg.hasContent !== false ? 'content' : null,
    categoryColumn: cfg.hasCategory ? 'category' : null,
    sectionRangeColumn: cfg.hasSectionRange ? 'section_range' : null,
  };

  let ftsTable: string | null = null;
  if (cfg.ftsTable === false) {
    ftsTable = null;
  } else if (cfg.ftsTable) {
    ftsTable = cfg.ftsTable;
  } else {
    // Default: tableName_fts
    ftsTable = `${cfg.tableName}_fts`;
  }

  return new LegislationEpubUpdater({
    seriesId: cfg.seriesId,
    tableName: cfg.tableName,
    sourceId: cfg.sourceId,
    sourceName: cfg.sourceName,
    defaultCron: cfg.defaultCron || '0 3 1 * *',
    columns,
    ftsTable,
  });
}
