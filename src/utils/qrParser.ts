export interface ParsedQRData {
    sku?: string;
    ean?: string;
    product?: string;
    brand?: string;
    model?: string;
    serial?: string;
    cartonSerial?: string;
    batch?: string;
    mfgDate?: string;
    qtyPerCarton?: number;
    labelType?: "UNIT" | "CARTON" | "UNKNOWN";
    innerSerialStart?: string;
    innerSerialEnd?: string;
    innerSerials?: string[];
    innerSerialRangeError?: string;
}

export function parseQRCode(raw: string): ParsedQRData | null {
    const pattern = /\((\d+)\)([A-Z_]+)=([^(]*)/g
    const map: Record<string, string> = {}
    let match: RegExpExecArray | null
    let found = false

    while ((match = pattern.exec(raw)) !== null) {
        found = true
        map[match[2].trim()] = match[3].trim()
    }

    if (!found) return null

    let mfgDate: string | undefined
    if (map["MFG_DATE"]?.length === 8) {
        const d = map["MFG_DATE"]
        mfgDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    }

    const labelType = map["SERIAL"]
        ? "UNIT"
        : (map["CARTON_SERIAL"] || map["CARTON"])
            ? "CARTON"
            : "UNKNOWN"

    let innerSerials: string[] | undefined
    let innerSerialRangeError: string | undefined
    const start = map["INNER_SERIAL_START"]
    const end = map["INNER_SERIAL_END"]
    const qty = map["QTY_PER_CARTON"] ? parseInt(map["QTY_PER_CARTON"], 10) : undefined

    if (start) {
        const numMatch = start.match(/^(.*?)(\d+)$/)

        if (numMatch) {
            const prefix = numMatch[1]
            const startNum = parseInt(numMatch[2], 10)
            const padLen = numMatch[2].length

            let endNum: number | undefined

            if (end) {
                endNum = parseInt(end.replace(prefix, ""), 10)
            } else if (qty && qty > 0) {
                endNum = startNum + qty - 1
            }

            if (endNum !== undefined && !isNaN(startNum) && !isNaN(endNum) && endNum >= startNum) {
                innerSerials = []
                for (let i = startNum; i <= endNum; i++) {
                    innerSerials.push(prefix + String(i).padStart(padLen, "0"))
                }

                const lastGenerated = innerSerials[innerSerials.length - 1]

                if (end && lastGenerated !== end) {
                    innerSerialRangeError = `Range tidak valid: last generated "${lastGenerated}" ≠ INNER_SERIAL_END "${end}"`
                    innerSerials = undefined
                }

                if (!innerSerialRangeError && qty && innerSerials && innerSerials.length !== qty) {
                    innerSerialRangeError = `Jumlah serial ${innerSerials.length} ≠ QTY_PER_CARTON ${qty}`
                    innerSerials = undefined
                }

            } else if (start) {
                innerSerialRangeError = "Cannot parse INNER_SERIAL_END / Invalid number format in INNER_SERIAL_START or END"
            }
        } else {
            innerSerialRangeError = "Cannot parse INNER_SERIAL_START format (expecting prefix + number)"
        }
    }

    return {
        sku: map["SKU"],
        ean: map["EAN"],
        product: map["PRODUCT"],
        brand: map["BRAND"],
        model: map["MODEL"],
        serial: map["SERIAL"],
        cartonSerial: map["CARTON_SERIAL"] ?? map["CARTON"],
        batch: map["BATCH"],
        mfgDate,
        qtyPerCarton: qty,
        labelType,
        innerSerialStart: start,
        innerSerialEnd: end,
        innerSerials,
        innerSerialRangeError,
    }
}