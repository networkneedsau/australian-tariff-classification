// ── ICS N10 Import Declaration XML Generator ────────────────────────

export interface IcsEntryFields {
  tariffCode: string;
  statisticalCode: string;
  goodsDescription: string;
  countryOfOrigin: string;
  customsValue: number;
  currency: string;
  dutyRate: string;
  dutyAmount: number;
  gstAmount: number;
  unitOfQuantity: string;
  quantity: number;
  grossWeight?: number;
  netWeight?: number;
  ftaScheme?: string;
  preferenceRate?: string;
  tcoNumber?: string;
  lineNumber?: number;
}

export interface DeclarationInfo {
  importerABN?: string;
  customsBrokerCode?: string;
  portOfDischarge?: string;
  vesselName?: string;
  voyageNumber?: string;
}

// ── XML special-character escaping ──────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fmtAmount(n: number): string {
  return n.toFixed(2);
}

// ── Single goods-line XML fragment ──────────────────────────────────

function buildGoodsLine(fields: IcsEntryFields, lineNum: number): string {
  const lines: string[] = [];
  lines.push(`  <GoodsLine lineNumber="${lineNum}">`);
  lines.push(`    <TariffClassification>${escapeXml(fields.tariffCode)}</TariffClassification>`);
  lines.push(`    <StatisticalCode>${escapeXml(fields.statisticalCode)}</StatisticalCode>`);
  lines.push(`    <GoodsDescription>${escapeXml(fields.goodsDescription)}</GoodsDescription>`);
  lines.push(`    <CountryOfOrigin>${escapeXml(fields.countryOfOrigin)}</CountryOfOrigin>`);
  lines.push(`    <CustomsValue currency="${escapeXml(fields.currency)}">${fmtAmount(fields.customsValue)}</CustomsValue>`);
  lines.push(`    <DutyRate>${escapeXml(fields.dutyRate)}</DutyRate>`);
  lines.push(`    <DutyAmount>${fmtAmount(fields.dutyAmount)}</DutyAmount>`);
  lines.push(`    <GSTAmount>${fmtAmount(fields.gstAmount)}</GSTAmount>`);
  lines.push(`    <UnitOfQuantity>${escapeXml(fields.unitOfQuantity)}</UnitOfQuantity>`);
  lines.push(`    <Quantity>${fields.quantity}</Quantity>`);

  if (fields.grossWeight != null) {
    lines.push(`    <GrossWeight unit="KG">${fmtAmount(fields.grossWeight)}</GrossWeight>`);
  }
  if (fields.netWeight != null) {
    lines.push(`    <NetWeight unit="KG">${fmtAmount(fields.netWeight)}</NetWeight>`);
  }
  if (fields.ftaScheme) {
    lines.push(`    <PreferenceScheme>${escapeXml(fields.ftaScheme)}</PreferenceScheme>`);
  }
  if (fields.preferenceRate) {
    lines.push(`    <PreferenceRate>${escapeXml(fields.preferenceRate)}</PreferenceRate>`);
  }
  if (fields.tcoNumber) {
    lines.push(`    <TariffConcessionOrder>${escapeXml(fields.tcoNumber)}</TariffConcessionOrder>`);
  }

  lines.push(`  </GoodsLine>`);
  return lines.join('\n');
}

// ── Public: single-line declaration ─────────────────────────────────

export function generateIcsXml(fields: IcsEntryFields): string {
  const lineNum = fields.lineNumber ?? 1;
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<CustomsDeclaration xmlns="urn:abf:ics:n10" version="1.0">`,
    `  <DeclarationHeader>`,
    `    <MessageType>N10</MessageType>`,
    `  </DeclarationHeader>`,
    buildGoodsLine(fields, lineNum),
    `</CustomsDeclaration>`,
  ].join('\n');
}

// ── Public: multi-line declaration with header info ─────────────────

export function generateMultiLineIcsXml(
  lines: IcsEntryFields[],
  declarationInfo: DeclarationInfo,
): string {
  const headerParts: string[] = [];
  headerParts.push(`  <DeclarationHeader>`);
  headerParts.push(`    <MessageType>N10</MessageType>`);
  if (declarationInfo.importerABN) {
    headerParts.push(`    <ImporterABN>${escapeXml(declarationInfo.importerABN)}</ImporterABN>`);
  }
  if (declarationInfo.customsBrokerCode) {
    headerParts.push(`    <CustomsBrokerCode>${escapeXml(declarationInfo.customsBrokerCode)}</CustomsBrokerCode>`);
  }
  if (declarationInfo.portOfDischarge) {
    headerParts.push(`    <PortOfDischarge>${escapeXml(declarationInfo.portOfDischarge)}</PortOfDischarge>`);
  }
  if (declarationInfo.vesselName) {
    headerParts.push(`    <VesselName>${escapeXml(declarationInfo.vesselName)}</VesselName>`);
  }
  if (declarationInfo.voyageNumber) {
    headerParts.push(`    <VoyageNumber>${escapeXml(declarationInfo.voyageNumber)}</VoyageNumber>`);
  }
  headerParts.push(`  </DeclarationHeader>`);

  const goodsLines = lines.map((entry, idx) => {
    const lineNum = entry.lineNumber ?? idx + 1;
    return buildGoodsLine(entry, lineNum);
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<CustomsDeclaration xmlns="urn:abf:ics:n10" version="1.0">`,
    headerParts.join('\n'),
    goodsLines.join('\n'),
    `</CustomsDeclaration>`,
  ].join('\n');
}
