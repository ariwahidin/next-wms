export interface CartonOcrResult {
  case_number: string | null;
  ctn_no: number | null;
  total_ctn: number | null;
  raw_text: string;
  confidence: number | null;
}

const CASE_PATTERN =
  /\bFID[\s-]*([A-Z0-9]{2,})[\s-]*([0-9O]{2})[\s-]*([0-9O]{4})\b/i;

// Full-label pattern: C/NO.: 155 OF 156
const CTN_PATTERN =
  /C\s*\/?\s*[I1]?\s*NO\.?\s*[:.]?\s*([0-9O]+)\s*(?:O\s*F|0\s*F|OF)\s*([0-9O]+)/i;

// Crop OCR may only return: 155 OF 156
const CTN_ONLY_PATTERN =
  /\b([0-9O]{1,5})\s*(?:O\s*F|0\s*F|OF)\s*([0-9O]{1,5})\b/i;

const normalizeDigits = (value: string) =>
  value
    .toUpperCase()
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1");

const normalizeOcrText = (text: string) =>
  text
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\bFLD\b/g, "FID")
    .replace(/\bF1D\b/g, "FID")
    .replace(/C\s*\/\s*INO/g, "C/NO")
    .replace(/C\s*\/\s*1NO/g, "C/NO");

const normalizeCaseNumber = (match: RegExpExecArray) => {
  const prefix = match[1].replace(/\s+/g, "");
  const year = normalizeDigits(match[2]);
  const sequence = normalizeDigits(match[3]);

  return `FID-${prefix}-${year}-${sequence}`;
};

export function parseCartonLabelOcr(
  rawText: string,
  confidence: number | null = null,
): CartonOcrResult {
  const text = normalizeOcrText(rawText);

  const caseMatch = CASE_PATTERN.exec(text);
  const ctnMatch = CTN_PATTERN.exec(text) ?? CTN_ONLY_PATTERN.exec(text);

  const ctnNo = ctnMatch ? Number(normalizeDigits(ctnMatch[1])) : null;
  const totalCtn = ctnMatch ? Number(normalizeDigits(ctnMatch[2])) : null;

  return {
    case_number: caseMatch ? normalizeCaseNumber(caseMatch) : null,
    ctn_no: Number.isFinite(ctnNo) ? ctnNo : null,
    total_ctn: Number.isFinite(totalCtn) ? totalCtn : null,
    raw_text: rawText,
    confidence,
  };
}

export function isCartonOcrComplete(result: CartonOcrResult) {
  return (
    Boolean(result.case_number) &&
    result.ctn_no !== null &&
    result.ctn_no > 0 &&
    result.total_ctn !== null &&
    result.total_ctn > 0 &&
    result.ctn_no <= result.total_ctn
  );
}

export function getCartonOcrErrorMessage(result: CartonOcrResult) {
  if (!result.case_number && result.ctn_no === null && result.total_ctn === null) {
    return "No carton data could be detected. Please scan the label again.";
  }

  if (!result.case_number) {
    return "Case Number could not be detected. Please scan the label again.";
  }

  if (result.ctn_no === null || result.ctn_no <= 0) {
    return "Ctn No could not be detected. Please scan the label again.";
  }

  if (result.total_ctn === null || result.total_ctn <= 0) {
    return "Total Ctn could not be detected. Please scan the label again.";
  }

  if (result.ctn_no > result.total_ctn) {
    return `Invalid carton number: Ctn No ${result.ctn_no} cannot be greater than Total Ctn ${result.total_ctn}. Please scan the label again.`;
  }

  return "The carton label could not be verified. Please scan the label again.";
}
