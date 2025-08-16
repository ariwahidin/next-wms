import React from "react";

type StockCardData = {
  page: number;
  date: string;
  location: string;
  gmc: string;
  itemCode: string;
  desc: string;
};

const dummyCards: StockCardData[] = [
  {
    page: 1,
    date: "7/31/2025",
    location: "YMG01A101",
    gmc: "WY14620",
    itemCode: "PNGB1KPAW//AZ",
    desc: "CKY",
  },
  {
    page: 2,
    date: "7/31/2025",
    location: "YMG01B101",
    gmc: "VEG8730",
    itemCode: "EPYDP145WH",
    desc: "CKY",
  },
  {
    page: 1,
    date: "7/31/2025",
    location: "YMG01A101",
    gmc: "WY14620",
    itemCode: "PNGB1KPAW//AZ",
    desc: "CKY",
  },
  {
    page: 2,
    date: "7/31/2025",
    location: "YMG01B101",
    gmc: "VEG8730",
    itemCode: "EPYDP145WH",
    desc: "CKY",
  },
];

const StockCardPageOld: React.FC = () => {
  return (
    <div>
      <style>
        {`
        @media print {
          body {
            margin: 0;
          }
          .print-page {
            page-break-after: always;
            width: 100%;
            height: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-content: space-between;
          }
        }

        .print-page {
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          box-sizing: border-box;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-content: space-between;
        }

        .stock-card {
          width: 48%;
          border: 1px solid black;
          padding: 10px;
          margin-bottom: 10px;
          box-sizing: border-box;
          font-size: 12px;
          height: 48%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .location, .gmc, .item-code, .desc {
          margin: 5px 0;
        }

        .qty-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          border-top: 1px solid black;
          border-bottom: 1px solid black;
          padding: 5px 0;
        }

        .counting, .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        `}
      </style>

      {/* Bagi jadi beberapa halaman (maks 4 per halaman) */}
      {Array.from({ length: Math.ceil(dummyCards.length / 4) }).map(
        (_, pageIndex) => (
          <div className="print-page" key={pageIndex}>
            {dummyCards
              .slice(pageIndex * 4, pageIndex * 4 + 4)
              .map((card, index) => (
                <div key={index} className="stock-card">
                  <div className="header">
                    <div>{card.page}</div>
                    <div>STOCK CARD BIN</div>
                    <div>{card.date}</div>
                  </div>

                  <div className="location">
                    LOCATION:
                    <br />
                    <div style={{ fontWeight: "bold", textAlign: "center", fontSize: "24px" }}>
                      <strong>{card.location}</strong>
                    </div>
                  </div>

                  <div className="gmc" style={{ textAlign: "center" }}>
                    GMC
                    <br />
                    <strong style={{ fontSize: "24px" }}>{card.gmc}</strong>
                  </div>

                  <div className="item-code" style={{ textAlign: "center" }}>
                    ITEM CODE
                    <br />
                    <strong style={{ fontSize: "24px" }}>{card.itemCode}</strong>
                  </div>

                  <div className="desc" style={{ textAlign: "center" , fontSize: "20px" }}>
                    <strong>{card.desc}</strong>
                  </div>

                  <div className="qty-section" style={{ fontSize: "10px" }}>
                    <div>QTY PRESTOCK</div>
                    <div>QTY STOCK TAKE (Diisi)</div>
                  </div>

                  <div className="counting" style={{ fontSize: "8px" }}>
                    <div>COUNTED BY (YP ID)</div>
                    <div>CONFIRMED BY (YP ID)</div>
                    <div>COUNTED BY (YM ID)</div>
                  </div>

                  <div className="signatures" style={{ fontSize: "8px" }}>
                    <div>NAME: ____________</div>
                    <div>NAME: ____________</div>
                    <div>NAME: ____________</div>
                  </div>
                </div>
              ))}
          </div>
        )
      )}
    </div>
  );
};

export default StockCardPageOld;
