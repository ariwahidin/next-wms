// "use client";

// import { AgGridReact } from "ag-grid-react";
// import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
// import api from "@/lib/api";
// import { ChangeEvent, useCallback, useEffect, useState } from "react";
// import styles from "./BarcodeTable.module.css";
// import { Card, CardContent, CardTitle } from "@/components/ui/card";
// import DataTableModal from "./DataTableModal";

// const PalletTable = ({ dataToPost }: { dataToPost: any }) => {
//   console.log("Data To Post : ", dataToPost);

//   const inbound_id = dataToPost.inbound_id;
//   const [rowData, setRowData] = useState([]);
//   const [dataModal, setDataModal] = useState(null);
//   const [modalIsOpen, setModalIsOpen] = useState(false);

//   const [columnDefs, setColumnDefs] = useState<ColDef[]>([
//     {
//       headerName: "No.",
//       maxWidth: 60,
//       valueGetter: (params) => params.node?.rowIndex + 1, // Gunakan node.rowIndex
//     },
//     { field: "pallet", headerName: "Pallet", width: 120 },
//     { field: "total_item", headerName: "Total Item", width: 120 },
//     { field: "total_qty", headerName: "Total Qty", width: 120 },
//   ]);

//   const [quickFilterText, setQuickFilterText] = useState<string>();
//   const onFilterTextBoxChanged = useCallback(
//     ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
//       setQuickFilterText(value),
//     []
//   );

//   const getScanned = (inbound_id: number) => {
//     api
//       .get(`/rf/inbound/scan/pallet/${inbound_id}`, { withCredentials: true })
//       .then((res) => {
//         if (res.data.success && res.data.data.scan_pallet) {
//           setRowData(res.data.data.scan_pallet);
//         } else {
//           setRowData([]);
//         }
//       });
//   };

//   useEffect(() => {
//     getScanned(inbound_id);
//   }, [inbound_id]);

//   return (
//     <div>
//       <Card>
//         <CardTitle></CardTitle>
//         <CardContent className="pt-5">
//           <div style={{ width: "100%", height: "600px", overflow: "auto" }}>
//             <div className="justify-self-start">
//               <div
//                 className={styles.inputWrapper}
//                 style={{ marginBottom: "1rem" }}
//               >
//                 <svg
//                   className={styles.searchIcon}
//                   width="16"
//                   height="16"
//                   viewBox="0 0 16 16"
//                   fill="none"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     clipRule="evenodd"
//                     d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.7461 13.8058 14.7682 13.9052 14.77 14.0059C14.7717 14.1066 14.7532 14.2066 14.7155 14.3C14.6778 14.3934 14.6216 14.4782 14.5504 14.5494C14.4792 14.6206 14.3943 14.6768 14.301 14.7145C14.2076 14.7522 14.1075 14.7708 14.0068 14.769C13.9061 14.7672 13.8068 14.7452 13.7148 14.7042C13.6228 14.6632 13.54 14.6041 13.4714 14.5304L10.6814 11.7404Z"
//                     fill="currentColor"
//                   />
//                 </svg>

//                 <input
//                   type="text"
//                   id="filter-text-box"
//                   placeholder="Search ..."
//                   onInput={onFilterTextBoxChanged}
//                 />
//               </div>
//             </div>
//             <AgGridReact
//               onRowClicked={(e) => {
//                 setDataModal(e.data);
//                 setModalIsOpen(true);
//               }}
//               domLayout="autoHeight"
//               headerHeight={35}
//               rowHeight={35}
//               rowData={rowData}
//               columnDefs={columnDefs}
//               quickFilterText={quickFilterText}
//             />
//           </div>
//         </CardContent>
//       </Card>

//       <DataTableModal
//         data={dataModal}
//         modalIsOpen={modalIsOpen}
//         setModalIsOpen={setModalIsOpen}
//       />
//     </div>
//   );
// };

// export default PalletTable;

"use client";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, ColDef } from "ag-grid-community";
import api from "@/lib/api";
import { ChangeEvent, useCallback, useEffect, useState, useRef } from "react";
import styles from "./BarcodeTable.module.css";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import DataTableModal from "./DataTableModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PalletTable = ({ dataToPost }: { dataToPost: any }) => {
  console.log("Data To Post : ", dataToPost);

  const inbound_id = dataToPost.inbound_id;
  const [rowData, setRowData] = useState([]);
  const [dataModal, setDataModal] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isPutawayModalOpen, setIsPutawayModalOpen] = useState(false);
  const [rackLocation, setRackLocation] = useState("");
  const gridRef = useRef(null);

  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    {
      headerName: "",
      field: "checkboxSelection",
      maxWidth: 50,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true,
    },
    {
      headerName: "No.",
      maxWidth: 60,
      valueGetter: (params) => params.node?.rowIndex + 1,
    },
    { field: "pallet", headerName: "Pallet", width: 120 },
    { field: "total_item", headerName: "Total Item", width: 120 },
    { field: "total_qty", headerName: "Total Qty", width: 120 },
  ]);

  const [quickFilterText, setQuickFilterText] = useState<string>();
  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const getScanned = (inbound_id: number) => {
    api
      .get(`/rf/inbound/scan/pallet/${inbound_id}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success && res.data.data.scan_pallet) {
          setRowData(res.data.data.scan_pallet);
        } else {
          setRowData([]);
        }
      });
  };

  useEffect(() => {
    getScanned(inbound_id);
  }, [inbound_id]);

  const onSelectionChanged = () => {
    if (gridRef.current) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      const selectedData = selectedNodes.map((node) => node.data);
      setSelectedRows(selectedData);
    }
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one pallet to delete");
      return;
    }

    const palletIds = selectedRows.map((row) => row.pallet);

    // Call API to delete selected pallets
    if (
      confirm(
        `Are you sure you want to delete ${selectedRows.length} pallet(s)?`
      )
    ) {
      console.log("Deleting pallets:", palletIds);
      // Implement your delete API call here
      // api.delete("/rf/inbound/scan/pallet", {
      //   data: { inbound_id, palletIds },
      //   withCredentials: true
      // }).then((res) => {
      //   if (res.data.success) {
      //     getScanned(inbound_id);
      //   }
      // });
    }
  };

  const handleOpenPutawayModal = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one pallet for putaway");
      return;
    }
    setIsPutawayModalOpen(true);
  };

  const handleSubmitPutaway = () => {
    if (!rackLocation.trim()) {
      alert("Please enter a rack location");
      return;
    }

    const palletIds = selectedRows.map((row) => row.pallet);
    const payload = {
      inbound_id,
      pallets: palletIds,
      rack_location: rackLocation,
    };

    console.log("Submitting putaway with payload:", payload);

    // Implement your putaway API call here
    api.post("/rf/inbound/scan/pallet/putaway", payload, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setIsPutawayModalOpen(false);
          setRackLocation("");
          getScanned(inbound_id);
          alert("Putaway completed successfully");
        } else {
          alert("Failed to complete putaway operation");
        }
      })
      .catch((error) => {
        console.error("Error during putaway:", error);
        alert("An error occurred during putaway operation");
      });

    // For demo purposes
    // setTimeout(() => {
    //   setIsPutawayModalOpen(false);
    //   setRackLocation("");
    //   alert("Putaway completed successfully");
    // }, 1000);
  };

  return (
    <div>
      <Card>
        <CardTitle></CardTitle>
        <CardContent className="pt-5">
          <div className="flex justify-between mb-4">
            <div className={styles.inputWrapper}>
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.5014 7.00039C11.5014 7.59133 11.385 8.1765 11.1588 8.72246C10.9327 9.26843 10.6012 9.7645 10.1833 10.1824C9.76548 10.6002 9.2694 10.9317 8.72344 11.1578C8.17747 11.384 7.59231 11.5004 7.00136 11.5004C6.41041 11.5004 5.82525 11.384 5.27929 11.1578C4.73332 10.9317 4.23725 10.6002 3.81938 10.1824C3.40152 9.7645 3.07005 9.26843 2.8439 8.72246C2.61776 8.1765 2.50136 7.59133 2.50136 7.00039C2.50136 5.80691 2.97547 4.66232 3.81938 3.81841C4.6633 2.97449 5.80789 2.50039 7.00136 2.50039C8.19484 2.50039 9.33943 2.97449 10.1833 3.81841C11.0273 4.66232 11.5014 5.80691 11.5014 7.00039ZM10.6814 11.7404C9.47574 12.6764 7.95873 13.1177 6.43916 12.9745C4.91959 12.8314 3.51171 12.1145 2.50211 10.9698C1.49252 9.8251 0.957113 8.33868 1.0049 6.81314C1.05268 5.28759 1.68006 3.83759 2.75932 2.75834C3.83857 1.67908 5.28856 1.0517 6.81411 1.00392C8.33966 0.956136 9.82608 1.49154 10.9708 2.50114C12.1154 3.51073 12.8323 4.91862 12.9755 6.43819C13.1187 7.95775 12.6773 9.47476 11.7414 10.6804L14.5314 13.4704C14.605 13.539 14.6642 13.6218 14.7051 13.7138C14.7461 13.8058 14.7682 13.9052 14.77 14.0059C14.7717 14.1066 14.7532 14.2066 14.7155 14.3C14.6778 14.3934 14.6216 14.4782 14.5504 14.5494C14.4792 14.6206 14.3943 14.6768 14.301 14.7145C14.2076 14.7522 14.1075 14.7708 14.0068 14.769C13.9061 14.7672 13.8068 14.7452 13.7148 14.7042C13.6228 14.6632 13.54 14.6041 13.4714 14.5304L10.6814 11.7404Z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                id="filter-text-box"
                placeholder="Search ..."
                onInput={onFilterTextBoxChanged}
              />
            </div>

            {selectedRows.length > 0 && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDelete}>
                  Delete ({selectedRows.length})
                </Button>
                <Button variant="default" onClick={handleOpenPutawayModal}>
                  Confirm Putaway ({selectedRows.length})
                </Button>
              </div>
            )}
          </div>

          <div style={{ width: "100%", height: "600px", overflow: "auto" }}>
            <AgGridReact
              ref={gridRef}
              domLayout="autoHeight"
              headerHeight={35}
              rowHeight={35}
              rowData={rowData}
              columnDefs={columnDefs}
              quickFilterText={quickFilterText}
              rowSelection="multiple"
              onSelectionChanged={onSelectionChanged}
              // onRowClicked={(e) => {
              //   setDataModal(e.data);
              //   setModalIsOpen(true);
              // }}
            />
          </div>
        </CardContent>
      </Card>

      <DataTableModal
        data={dataModal}
        modalIsOpen={modalIsOpen}
        setModalIsOpen={setModalIsOpen}
      />

      {/* Putaway Modal */}
      <Dialog open={isPutawayModalOpen} onOpenChange={setIsPutawayModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Putaway Location</DialogTitle>
            <DialogDescription>
              Transfer {selectedRows.length} pallet(s) to a new rack location
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rack-location" className="text-right">
                Rack Location
              </Label>
              <Input
                id="rack-location"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                placeholder="Enter rack location"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Pallets</Label>
              <div className="col-span-3">
                {selectedRows.map((row, index) => (
                  <div key={index} className="mb-1">
                    {row.pallet}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPutawayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmitPutaway}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PalletTable;
