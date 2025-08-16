import React, { useEffect, useState } from 'react';

export type StockCardData = {
  page?: number;
  item_code: string;
  barcode ?: string;
  item_name: string;
  location: string;
  qa_status: string;
  whs_code: string;
};

type Props = {
  data: StockCardData[];
};

const StockCardComponent: React.FC<Props> = ({ data }) => {
  // Buat duplikat untuk setiap item (2 kartu per barang)
  const duplicatedData = data.flatMap((item) => [item, { ...item }]);

  // Bagi data menjadi chunk berisi 4 kartu per halaman
  const chunkData = (array: StockCardData[], size: number) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const pages = chunkData(duplicatedData, 4);

  return (
    <div>
      <style>
        {`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          .page-break:last-child {
            page-break-after: avoid;
          }
          
          .cut-line {
            border-color: #000 !important;
          }
        }

        .page-container {
          width: 210mm;
          height: 297mm;
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          position: relative;
        }

        /* Garis putus-putus untuk memotong */
        .page-container::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: repeating-linear-gradient(
            to right,
            #000 0,
            #000 3mm,
            transparent 3mm,
            transparent 6mm
          );
          z-index: 10;
        }

        .page-container::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: repeating-linear-gradient(
            to bottom,
            #000 0,
            #000 3mm,
            transparent 3mm,
            transparent 6mm
          );
          z-index: 10;
        }

        .stock-card {
          width: 100%;
          height: 100%;
          border: none;
          padding: 8mm;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          position: relative;
          border: 2px solid #000;
        }

        .stock-card:nth-child(1) {
          border-right: 1px dashed #000;
          border-bottom: 1px dashed #000;
        }

        .stock-card:nth-child(2) {
          border-left: 1px dashed #000;
          border-bottom: 1px dashed #000;
        }

        .stock-card:nth-child(3) {
          border-right: 1px dashed #000;
          border-top: 1px dashed #000;
        }

        .stock-card:nth-child(4) {
          border-left: 1px dashed #000;
          border-top: 1px dashed #000;
        }

        .header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .section {
          border: 2px solid black;
          padding: 4px;
          margin: 4px 0;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          min-height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .label {
          font-size: 10px;
          text-align: left;
          margin-top: 6px;
          margin-bottom: 2px;
          font-weight: bold;
        }

        .bold-label {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 4px 0;
          min-height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .desc-box {
          border: 2px solid black;
          padding: 8px;
          margin: 8px 0;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-table {
          width: 100%;
          border: 2px solid black;
          border-collapse: collapse;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .qty-table th, .qty-table td {
          border: 1px solid black;
          text-align: center;
          padding: 6px;
          height: 35px;
          font-size: 10px;
        }

        .qty-table th {
          font-weight: bold;
          background-color: #f5f5f5;
        }

        .footer-table {
          width: 100%;
          border: 2px solid black;
          border-collapse: collapse;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .footer-table th, .footer-table td {
          border: 1px solid black;
          text-align: center;
          height: 30px;
          padding: 3px;
          font-size: 9px;
        }

        .footer-table th {
          font-weight: bold;
          background-color: #f5f5f5;
        }

        .footer-table td small {
          display: block;
          text-align: left;
          margin-top: 10px;
          font-size: 8px;
        }
        
        @media screen {
          .page-container {
            border: 2px solid #333;
            margin: 20px auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .stock-card {
            border: 1px solid #ccc !important;
          }
        }
        `}
      </style>

      {pages.map((pageData, pageIndex) => (
        <div
          key={pageIndex}
          className={`page-container ${
            pageIndex < pages.length - 1 ? "page-break" : ""
          }`}
        >
          {Array.from({ length: 4 }, (_, cardIndex) => {
            const card = pageData[cardIndex];
            return card ? (
              <div className="stock-card" key={`${pageIndex}-${cardIndex}`}>
                <div className="header">
                  <div>{card.page}</div>
                  <div style={{ marginLeft: "40px" }}>STOCK CARD BIN</div>
                  {/* current date dd/mm/yyyy in indo */}
                  <div>{new Date().toLocaleDateString("id-ID")}</div>
                </div>

                <div className="label">LOCATION:</div>
                <div className="bold-label">{card.location}</div>

                <div className="label">GMC</div>
                <div className="bold-label">{card.barcode}</div>

                <div className="label">ITEM CODE</div>
                <div className="bold-label">{card.item_code}</div>

                <div className="desc-box">{card.whs_code}</div>

                <table className="qty-table">
                  <thead>
                    <tr>
                      <th>QTY PRESTOCK</th>
                      <th>QTY STOCK TAKE (Diisi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <table className="footer-table">
                  <thead>
                    <tr>
                      <th>COUNTED BY (YPID)</th>
                      <th>CONFIRMED BY (YPID)</th>
                      <th>COUNTED BY (YMID)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr style={{ height: "25px" }}>
                      <td>
                        <small>NAMA:</small>
                      </td>
                      <td>
                        <small>NAMA:</small>
                      </td>
                      <td>
                        <small>NAMA:</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="stock-card"
                key={`${pageIndex}-${cardIndex}-empty`}
              >
                {/* Kartu kosong jika data tidak cukup */}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Main page component
export default function StockCardPrintPage() {
  const [stockData, setStockData] = useState<StockCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data dari URL params atau sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlData = urlParams.get('data');
    
    if (urlData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(urlData));
        setStockData(parsedData);
      } catch (error) {
        console.error('Error parsing URL data:', error);
        // Fallback ke sessionStorage
        const savedData = sessionStorage.getItem('stockCardData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setStockData(parsedData);
        }
      }
    } else {
      // Ambil dari sessionStorage
      const savedData = sessionStorage.getItem('stockCardData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setStockData(parsedData);
        } catch (error) {
          console.error('Error parsing stock card data:', error);
        }
      }
    }
    setLoading(false);

    // Auto print setelah page load (optional)
    const timer = setTimeout(() => {
      window.print();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (stockData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No data to print</div>
      </div>
    );
  }

  return <StockCardComponent data={stockData} />;
}