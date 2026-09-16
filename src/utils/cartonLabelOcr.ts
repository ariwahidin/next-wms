/**
 * cartonLabelOcr.ts
 *
 * Parser khusus Carton Label.
 *
 * OCR tidak selalu mengembalikan text
 * dalam urutan/layout yang sama dengan
 * yang terlihat manusia.
 *
 * Contoh:
 *
 * C/NO.: 52 OF 56
 *
 * bisa menjadi:
 *
 * Cc/NO.: 52 OF
 * 56
 *
 * atau:
 *
 * 56
 * C/NO.: 52 OF
 *
 * Parser harus tolerate kondisi tersebut.
 */

export interface CartonOcrResult {
  case_number: string | null;
  ctn_no: number | null;
  total_ctn: number | null;
  raw_text: string;
  confidence: number | null;
}

/**
 * ============================================================
 * CASE NUMBER
 * ============================================================
 */
const CASE_PATTERN =
  /\bFID[\s-]*([A-Z0-9]{2,})[\s-]*([0-9O]{2})[\s-]*([0-9O]{4})\b/i;

/**
 * ============================================================
 * FULL C/NO
 * ============================================================
 *
 * Examples:
 *
 * C/NO.: 52 OF 56
 * C/NO 52 OF 56
 * C/INO.: 52 OF 56
 */
const CTN_PATTERN =
  /C\s*\/?\s*[I1]?\s*NO\.?\s*[:.]?\s*([0-9O]{1,5})\s*(?:O\s*F|0\s*F|OF)\s*([0-9O]{1,5})/i;

/**
 * ============================================================
 * C/NO WITHOUT TOTAL
 * ============================================================
 *
 * Example:
 *
 * C/NO.: 52 OF
 *
 * Total might be on another line.
 */
const CTN_PARTIAL_PATTERN =
  /C\s*\/?\s*[I1]?\s*NO\.?\s*[:.]?\s*([0-9O]{1,5})\s*(?:O\s*F|0\s*F|OF)\b/i;

/**
 * ============================================================
 * NUMBER OF NUMBER
 * ============================================================
 *
 * Example:
 *
 * 52 OF 56
 * 52 0F 56
 */
const CTN_ONLY_PATTERN =
  /\b([0-9O]{1,5})\s*(?:O\s*F|0\s*F|OF)\s*([0-9O]{1,5})\b/i;

/**
 * ============================================================
 * DIGIT NORMALIZATION
 * ============================================================
 */
function normalizeDigits(
  value: string,
) {
  return value
    .toUpperCase()
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1");
}

/**
 * ============================================================
 * OCR TEXT NORMALIZATION
 * ============================================================
 */
function normalizeOcrText(
  text: string,
) {
  return text
    .toUpperCase()

    // Normalize dash
    .replace(
      /[\u2010-\u2015\u2212]/g,
      "-",
    )

    // CRLF
    .replace(/\r/g, "")

    // NBSP
    .replace(/\u00A0/g, " ")

    // Common FID OCR mistakes
    .replace(/\bFLD\b/g, "FID")
    .replace(/\bF1D\b/g, "FID")

    // C/INO → C/NO
    .replace(
      /C\s*\/\s*INO/g,
      "C/NO",
    )

    // C/1NO → C/NO
    .replace(
      /C\s*\/\s*1NO/g,
      "C/NO",
    )

    // O F → OF
    .replace(
      /\bO\s+F\b/g,
      "OF",
    )

    // 0 F → OF
    .replace(
      /\b0\s+F\b/g,
      "OF",
    )

    // Collapse spaces
    .replace(
      /[ \t]+/g,
      " ",
    );
}

/**
 * ============================================================
 * CASE NUMBER NORMALIZATION
 * ============================================================
 */
function normalizeCaseNumber(
  match: RegExpExecArray,
) {
  const prefix =
    match[1].replace(
      /\s+/g,
      "",
    );

  const year =
    normalizeDigits(
      match[2],
    );

  const sequence =
    normalizeDigits(
      match[3],
    );

  return `FID-${prefix}-${year}-${sequence}`;
}

/**
 * ============================================================
 * FIND C/NO FROM MULTIPLE LINES
 * ============================================================
 *
 * This is the important part.
 *
 * Example OCR:
 *
 * 56
 *
 * C/NO.: 52 OF
 *
 * We detect:
 *
 * ctn_no = 52
 *
 * then look around the C/NO text
 * for the missing total.
 */
function parseCartonNumbers(
  normalizedText: string,
) {
  /**
   * ----------------------------------------------------------
   * Attempt #1
   *
   * Standard:
   *
   * 52 OF 56
   * ----------------------------------------------------------
   */
  const fullMatch =
    CTN_PATTERN.exec(
      normalizedText,
    );

  if (fullMatch) {
    return {
      ctn_no: Number(
        normalizeDigits(
          fullMatch[1],
        ),
      ),

      total_ctn: Number(
        normalizeDigits(
          fullMatch[2],
        ),
      ),
    };
  }

  /**
   * ----------------------------------------------------------
   * Attempt #2
   *
   * Search specifically around C/NO.
   *
   * Keep line structure because line order
   * may contain the missing number.
   * ----------------------------------------------------------
   */
  const lines =
    normalizedText
      .split("\n")
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean);

  /**
   * Find line containing C/NO.
   */
  const cartonLineIndex =
    lines.findIndex(
      (line) =>
        /C\s*\/?\s*[I1]?\s*NO/i.test(
          line,
        ),
    );

  if (
    cartonLineIndex >= 0
  ) {
    /**
     * Combine:
     *
     * previous line
     * current line
     * next line
     *
     * This handles:
     *
     * 56
     * C/NO.: 52 OF
     */
    const contextLines =
      lines.slice(
        Math.max(
          0,
          cartonLineIndex - 1,
        ),
        Math.min(
          lines.length,
          cartonLineIndex + 2,
        ),
      );

    const context =
      contextLines.join(
        " ",
      );

    /**
     * --------------------------------------------------------
     * Find:
     *
     * C/NO.: 52 OF
     * --------------------------------------------------------
     */
    const partialMatch =
      CTN_PARTIAL_PATTERN.exec(
        context,
      );

    if (partialMatch) {
      const ctnNo =
        Number(
          normalizeDigits(
            partialMatch[1],
          ),
        );

      /**
       * Everything after the C/NO match.
       */
      const afterMatch =
        context.slice(
          partialMatch.index +
            partialMatch[0]
              .length,
        );

      /**
       * Find first numeric token.
       */
      const afterNumber =
        /\b([0-9O]{1,5})\b/.exec(
          afterMatch,
        );

      if (afterNumber) {
        const totalCtn =
          Number(
            normalizeDigits(
              afterNumber[1],
            ),
          );

        if (
          Number.isFinite(
            ctnNo,
          ) &&
          Number.isFinite(
            totalCtn,
          )
        ) {
          return {
            ctn_no: ctnNo,
            total_ctn: totalCtn,
          };
        }
      }

      /**
       * ------------------------------------------------------
       * Important fallback:
       *
       * Sometimes OCR puts TOTAL before C/NO.
       *
       * Example:
       *
       * 56
       * C/NO.: 52 OF
       *
       * Search previous line.
       * ------------------------------------------------------
       */
      for (
        let i =
          cartonLineIndex - 1;
        i >=
          Math.max(
            0,
            cartonLineIndex - 2,
          );
        i--
      ) {
        const previousLine =
          lines[i];

        const numberMatch =
          /\b([0-9O]{1,5})\b/.exec(
            previousLine,
          );

        if (
          numberMatch
        ) {
          const totalCtn =
            Number(
              normalizeDigits(
                numberMatch[1],
              ),
            );

          if (
            Number.isFinite(
              ctnNo,
            ) &&
            Number.isFinite(
              totalCtn,
            )
          ) {
            return {
              ctn_no: ctnNo,
              total_ctn:
                totalCtn,
            };
          }
        }
      }
    }
  }

  /**
   * ----------------------------------------------------------
   * Attempt #3
   *
   * No C/NO label:
   *
   * 52 OF 56
   * ----------------------------------------------------------
   */
  const onlyMatch =
    CTN_ONLY_PATTERN.exec(
      normalizedText,
    );

  if (onlyMatch) {
    return {
      ctn_no: Number(
        normalizeDigits(
          onlyMatch[1],
        ),
      ),

      total_ctn: Number(
        normalizeDigits(
          onlyMatch[2],
        ),
      ),
    };
  }

  return {
    ctn_no: null,
    total_ctn: null,
  };
}

/**
 * ============================================================
 * MAIN PARSER
 * ============================================================
 */
export function parseCartonLabelOcr(
  rawText: string,
  confidence: number | null = null,
): CartonOcrResult {
  const normalizedText =
    normalizeOcrText(
      rawText,
    );

  /**
   * Case Number.
   */
  const caseMatch =
    CASE_PATTERN.exec(
      normalizedText,
    );

  /**
   * Carton numbers.
   */
  const cartonNumbers =
    parseCartonNumbers(
      normalizedText,
    );

  return {
    case_number:
      caseMatch
        ? normalizeCaseNumber(
            caseMatch,
          )
        : null,

    ctn_no:
      Number.isFinite(
        cartonNumbers.ctn_no,
      )
        ? cartonNumbers.ctn_no
        : null,

    total_ctn:
      Number.isFinite(
        cartonNumbers.total_ctn,
      )
        ? cartonNumbers.total_ctn
        : null,

    raw_text:
      rawText,

    confidence,
  };
}

/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */
export function isCartonOcrComplete(
  result: CartonOcrResult,
) {
  return (
    Boolean(
      result.case_number,
    ) &&

    result.ctn_no !== null &&
    result.ctn_no > 0 &&

    result.total_ctn !== null &&
    result.total_ctn > 0 &&

    result.ctn_no <=
      result.total_ctn
  );
}

/**
 * ============================================================
 * ERROR MESSAGE
 * ============================================================
 */
export function getCartonOcrErrorMessage(
  result: CartonOcrResult,
) {
  if (
    !result.case_number &&
    result.ctn_no === null &&
    result.total_ctn === null
  ) {
    return "No carton data could be detected. Please scan the label again.";
  }

  if (
    !result.case_number
  ) {
    return "Case Number could not be detected. Please scan the label again.";
  }

  if (
    result.ctn_no === null ||
    result.ctn_no <= 0
  ) {
    return "Ctn No could not be detected. Please scan the label again.";
  }

  if (
    result.total_ctn === null ||
    result.total_ctn <= 0
  ) {
    return "Total Ctn could not be detected. Please scan the label again.";
  }

  if (
    result.ctn_no >
    result.total_ctn
  ) {
    return `Invalid carton number: Ctn No ${result.ctn_no} cannot be greater than Total Ctn ${result.total_ctn}. Please scan the label again.`;
  }

  return "The carton label could not be verified. Please scan the label again.";
}