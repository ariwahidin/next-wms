import JsBarcode from "jsbarcode"

export const generateBarcodeDataURL = (code: string): string => {
  const canvas = document.createElement("canvas")
  JsBarcode(canvas, code, {
    format: "CODE128",
    width: 2,
    height: 80,
    displayValue: true,
    fontSize: 14,
    margin: 10,
    background: "#ffffff",
    lineColor: "#000000",
  })
  return canvas.toDataURL()
}
