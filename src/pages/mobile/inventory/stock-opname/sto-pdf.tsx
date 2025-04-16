"use client";

import { useState } from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button"; // pastikan kamu punya komponen Button atau pakai komponen lain

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 20,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    padding: 5,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    padding: 5,
    border: "1px solid #ccc",
  },
  signature: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 10,
    color: "gray",
  },
});

const dummyItems = [
  { name: "Item A", barcode: "123456", location: "Location A", systemQty: 10, physicalQty: 9 },
  { name: "Item B", barcode: "234567", location: "Location B", systemQty: 15, physicalQty: 15 },
  { name: "Item C", barcode: "345678", location: "Location C", systemQty: 8, physicalQty: 7 },
];

const StockOpnamePage = () => {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);

    const doc = (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.title}>Stock Opname Report</Text>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.cell}>Item Name</Text>
              <Text style={styles.cell}>Barcode</Text>
              <Text style={styles.cell}>Location</Text>
              <Text style={styles.cell}>System Qty</Text>
              <Text style={styles.cell}>Physical Qty</Text>
              <Text style={styles.cell}>Difference</Text>
            </View>
            {dummyItems.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.barcode}</Text>
                <Text style={styles.cell}>{item.location}</Text>
                <Text style={styles.cell}>{item.systemQty}</Text>
                <Text style={styles.cell}>{item.physicalQty}</Text>
                <Text style={styles.cell}>{item.physicalQty - item.systemQty}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.signature}>Signatures: ____________________________</Text>
          <Text style={styles.signature}>Person 1         Person 2         Person 3</Text>
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stock-opname.pdf";
    link.click();

    setLoading(false);
  };

  return (
    <div className="px-4 pt-4 pb-20 min-h-screen bg-gray-50">
      <h1 className="text-xl font-semibold mb-4">Stock Opname</h1>
      <Button onClick={handleExportPDF} disabled={loading}>
        {loading ? "Exporting..." : "Export to PDF"}
      </Button>
    </div>
  );
};

export default StockOpnamePage;
