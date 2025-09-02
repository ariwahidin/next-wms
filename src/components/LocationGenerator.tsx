"use client";

import React, { useState, useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";

interface LocationGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationGenerator({
  isOpen,
  onClose,
}: LocationGeneratorProps) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Load locations from localStorage on mount
    const stored = localStorage.getItem("locationCodes");
    if (stored) {
      setLocations(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage whenever locations change
    localStorage.setItem("locationCodes", JSON.stringify(locations));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("locationsUpdated"));
  }, [locations]);

  // Generate location code menggunakan timestamp untuk uniqueness
  // const generateLocation = () => {
  //   const timestamp = Date.now();
  //   // Ambil 7 digit terakhir dari timestamp untuk memastikan 9 karakter total (ST + 7 digit)
  //   const uniqueCode = timestamp.toString().slice(-7);
  //   const locationCode = `ST${uniqueCode}`;

  //   const newLocation = {
  //     id: timestamp.toString(),
  //     code: locationCode,
  //     timestamp: timestamp,
  //     area: "Storage",
  //     zone: "A",
  //     position: uniqueCode,
  //   };

  //   setLocations((prev) => [...prev, newLocation]);
  // };

  let counter = 0;

  const generateLocation = () => {
    const timestamp = Date.now().toString().slice(-6); // 6 digit terakhir
    counter = (counter + 1) % 100; // 2 digit counter
    const locationCode = `ST${timestamp}${counter.toString().padStart(2, "0")}`;

    const newLocation = {
      id: `${timestamp}${counter}`,
      code: locationCode,
      timestamp: Date.now(),
      area: "Storage",
      zone: "A",
      position: counter,
    };

    setLocations((prev) => [...prev, newLocation]);
  };

  // Clear all locations
  const clearLocations = () => {
    setLocations([]);
  };

  const generateBarcodeDataURL = (code: string): string => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, code, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL();
  };

  const handlePrint = async () => {
    if (locations.length === 0) return;

    // Generate all barcode data URLs first
    const barcodeDataUrls = locations.map((location) => ({
      ...location,
      barcodeDataUrl: generateBarcodeDataURL(location.code),
    }));

    // const printContent = `
    //   <!DOCTYPE html>
    //   <html>
    //     <head>
    //       <title>Location Codes</title>
    //       <style>
    //         @page {
    //           size: A4;
    //           margin: 15mm;
    //         }

    //         body {
    //           font-family: Arial, sans-serif;
    //           margin: 0;
    //           padding: 0;
    //           background: white;
    //         }

    //         .print-container {
    //           display: grid;
    //           grid-template-columns: 1fr 1fr;
    //           gap: 8mm;
    //           width: 100%;
    //           height: 100vh;
    //           box-sizing: border-box;
    //         }

    //         .location-item {
    //           border: 2px solid #333;
    //           border-radius: 8px;
    //           padding: 12mm;
    //           display: flex;
    //           flex-direction: column;
    //           align-items: center;
    //           justify-content: center;
    //           text-align: center;
    //           background: white;
    //           box-sizing: border-box;
    //           page-break-inside: avoid;
    //         }

    //         .location-code {
    //           font-size: 24px;
    //           font-weight: bold;
    //           margin-bottom: 8mm;
    //           font-family: 'Courier New', monospace;
    //           color: #333;
    //         }

    //         .barcode-container {
    //           margin: 6mm 0;
    //           display: flex;
    //           justify-content: center;
    //           align-items: center;
    //         }

    //         .barcode-image {
    //           max-width: 100%;
    //           height: auto;
    //           border: 1px solid #ddd;
    //           border-radius: 4px;
    //         }

    //         .location-info {
    //           font-size: 12px;
    //           color: #666;
    //           margin-top: 4mm;
    //         }

    //         .page-break {
    //           page-break-before: always;
    //         }
    //       </style>
    //     </head>
    //     <body>
    //       ${barcodeDataUrls
    //         .map(
    //           (location, index) => `
    //         <div class="print-container ${index > 0 && index % 4 === 0 ? "page-break" : ""}">
    //           ${barcodeDataUrls
    //             .slice(index, index + 4)
    //             .map(
    //               (loc) => `
    //             <div class="location-item">
    //               <div class="location-code">${loc.code}</div>
    //               <div class="barcode-container">
    //                 <img src="${loc.barcodeDataUrl}" alt="Barcode ${loc.code}" class="barcode-image" />
    //               </div>
    //               <div class="location-info">
    //                 Storage Location<br>
    //                 Generated: ${new Date(loc.timestamp).toLocaleDateString("id-ID")}
    //               </div>
    //             </div>
    //           `,
    //             )
    //             .join("")}
    //         </div>
    //       `,
    //         )
    //         .filter((_, index) => index % 4 === 0)
    //         .join("")}
    //     </body>
    //   </html>
    // `

    const printContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Location Codes</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm; /* margin lebih kecil */
        }

        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
        }

        .page {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 277mm; /* tinggi A4 dikurangi margin */
          box-sizing: border-box;
          page-break-after: always;
        }

        .location-item {
          flex: 1; /* otomatis bagi rata */
          border: 1px solid #333;
          border-radius: 6px;
          margin: 2mm 0;
          padding: 4mm; /* kecilin padding */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: white;
          box-sizing: border-box;
        }

        .location-code {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4mm;
          font-family: 'Courier New', monospace;
          color: #333;
        }

        .barcode-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .barcode-image {
          min-width: 120%;
          max-width: 150%;
          max-height: 60%;
        }

        .location-info {
          font-size: 11px;
          color: #666;
          margin-top: 2mm;
        }
      </style>
    </head>
    <body>
${(() => {
  const pages = [];
  for (let i = 0; i < barcodeDataUrls.length; i += 4) {
    const items = barcodeDataUrls.slice(i, i + 4);

    // kalau sisa < 4, tambahin placeholder kosong
    while (items.length < 4) {
      items.push(null);
    }

    const htmlItems = items
      .map((loc) => {
        if (!loc) {
          return `
            <div class="location-item" style="border: none; background: transparent;"></div>
          `;
        }
        return `
          <div class="location-item">
            <div class="location-code">${loc.code}</div>
            <div class="barcode-container">
              <img src="${loc.barcodeDataUrl}" alt="Barcode ${
          loc.code
        }" class="barcode-image" />
            </div>
            <div class="location-info">
              Storage Location<br>
              Generated: ${new Date(loc.timestamp).toLocaleDateString("id-ID")}
            </div>
          </div>
        `;
      })
      .join("");

    pages.push(`<div class="page">${htmlItems}</div>`);
  }
  return pages.join("");
})()}

    </body>
  </html>
`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-0">
                    Generate ST Location
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-green-200 text-2xl sm:text-3xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-green-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              {/* Controls */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
                <button
                  onClick={generateLocation}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm sm:text-base"
                >
                  ➕ Generate
                </button>

                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={locations.length === 0}
                >
                  📄 Print ({locations.length})
                </button>

                <button
                  onClick={clearLocations}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  disabled={locations.length === 0}
                >
                  🗑️ Clear All
                </button>
              </div>

              {/* Generated Locations List */}
              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                  📋 Generated Locations ({locations.length})
                </h3>

                {locations.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-4xl sm:text-6xl mb-4">📍</div>
                    <p className="text-gray-500 text-base sm:text-lg mb-2">
                      No locations have been generated yet
                    </p>
                    <p className="text-gray-400 text-sm sm:text-base">
                      Click [Generate] to create a new location code.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 sm:max-h-80 overflow-y-auto border rounded-xl bg-white shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 sm:p-6">
                      {locations.map((location, index) => {
                        // const date = new Date(location.timestamp);
                        return (
                          <div
                            key={location.id}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200 shadow-sm"
                          >
                            <div className="text-xs text-blue-600 mb-1">
                              #{index + 1}
                            </div>
                            <div className="font-bold text-blue-800 font-mono text-sm sm:text-base mb-2">
                              {location.code}
                            </div>
                            {/* <div className="text-xs text-gray-500">
                              {date.toLocaleTimeString("id-ID")}
                            </div> */}
                            <div className="mt-2">
                              <BarcodePreview code={location.code} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarcodePreview({ code }) {
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      JsBarcode(canvasRef.current, code, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: false,
        margin: 2,
        background: "#ffffff",
        lineColor: "#000000",
      });
    }
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[120px] h-auto border border-gray-300 rounded"
    />
  );
}
