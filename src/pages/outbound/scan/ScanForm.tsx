/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCcw} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Select from "react-select";
import eventBus from "@/utils/eventBus";

// const useAutoFocus = (
//   value: string,
//   maxLength: number,
//   nextElementId: string | null,
//   ref: React.RefObject<HTMLInputElement> | null,
//   callBack?: () => void
// ) => {
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const isFirstRender = useRef<boolean>(true);

//   useEffect(() => {
//     if (isFirstRender.current) {
//       isFirstRender.current = false;
//       return;
//     }

//     console.log("useAutoFocus dijalankan");
//     // Jika panjang karakter kurang dari maxLength, batal pindah focus
//     if (value.length < maxLength) {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//       return;
//     }

//     // Set timeout untuk pindah focus setelah 3 detik
//     timerRef.current = setTimeout(() => {
//       if (callBack) {
//         if (nextElementId) {
//           const nextInput = document.getElementById(
//             nextElementId
//           ) as HTMLInputElement;
//           nextInput?.focus();
//           console.log("Pindah ke ID : ", nextElementId);
//         } else {
//           ref?.current?.focus();
//           console.log("Pindah ke Ref : ", nextElementId);
//         }
//         callBack?.();
//       } else {
//         if (nextElementId) {
//           const nextInput = document.getElementById(
//             nextElementId
//           ) as HTMLInputElement;
//           nextInput?.focus();
//           console.log("Pindah ke ID : ", nextElementId);
//         } else {
//           ref?.current?.focus();
//           console.log("Pindah ke Ref : ", nextElementId);
//         }
//         console.log("Tidak ada callBack");
//       }
//     }, 500);

//     return () => {
//       // Hapus timer jika user masih mengetik sebelum 3 detik
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//     };
//   }, [value, maxLength, nextElementId, ref]);
// };

const getDetailOutbound = async (id: number) => {
  const response = await api.get("/rf/outbound/scan/list/" + id, {
    withCredentials: true,
  });
  console.log("Response Object:", response); // Debugging
  const data = await response.data;
  return data;
};

export default function ScanForm({
  scanForm,
  setScanForm,
  listOutbound,
}) {
  const [outboundOptions, setOutboundOptions] = useState([]);
  const [detailOptions, setDetailOptions] = useState([]);
  const [outboundDetail, setOutboundDetail] = useState([]);

  const [error, setError] = useState<string | null>(null);

  const [scanOptions] = useState([
    { value: "SERIAL", label: "SERIAL" },
    { value: "BARCODE", label: "BARCODE" },
    { value: "SET", label: "SET" },
  ]);

  useEffect(() => {
    if (listOutbound) {
      setOutboundOptions(
        listOutbound.map((item) => ({
          value: item.ID,
          label: item.outbound_no,
        }))
      );
    }
  }, [listOutbound]);

  async function handleSubmit(e) {
    e.preventDefault();
    postData();
  }

  const postData = () => {
    console.log("Scan Form:", scanForm);

    if (!scanForm?.outbound_id) {
      setError("Please select Outbound No");
      return;
    }

    if (!scanForm?.outbound_detail_id) {
      setError("Please select Item Code");
      return;
    }

    api
      .post("/rf/outbound/scan/post", scanForm, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          const outboundDetail = res.data.data?.outbound_detail;

          eventBus.emit("showAlert", {
            title: "Success!",
            description: "Saved",
            type: "success",
          });
          setScanForm({
            ...scanForm,
            scanned_qty: outboundDetail?.qty_scan,
            scan_data: "",
          });
          document.getElementById("serial_no")?.focus();
          // generateRandomSerial();
        }
      });
  };

  // useAutoFocus(dataToPost.location, 6, null, qaRef);
  // useAutoFocus(dataToPost.serial_number, 6, null, null, postData);

  // const handleKeyDown = (e) => {
  //   if (e.key === "Enter") {
  //     handleSubmit(e); // Submit form saat Enter
  //   }
  // };

  // const handleOnChangeSerialNumber = (e) => {};

  const handleCancel = () => {};

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scan Form</CardTitle>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="inbound_no">Scan Type</Label>
                <Select
                  id="scanType"
                  options={scanOptions}
                  placeholder="Select an type"
                  onChange={(e) => {
                    if (e?.value === "SERIAL") {
                      setScanForm({
                        ...scanForm,
                        quantity: 1,
                        scan_type: e.value,
                      });
                    } else {
                      setScanForm({
                        ...scanForm,
                        quantity: 1,
                        scan_type: e.value,
                      });
                    }
                  }}
                  // value={scanOptions.find(
                  //   (item) => item.value === scanForm?.scan_type
                  // )}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="inbound_no">Outbound No</Label>
                <Select
                  id="outbound_no"
                  options={outboundOptions}
                  onChange={async (e) => {
                    setScanForm({
                      ...scanForm,
                      outbound_id: e.value,
                      outbound_no: e.label,
                      customer_name: listOutbound.find(
                        (item) => item.ID === e.value
                      )?.customer_name,
                      delivery_no: listOutbound.find(
                        (item) => item.ID === e.value
                      ).delivery_no,
                    });
                    const data = await getDetailOutbound(e.value);
                    if (data.success) {
                      setDetailOptions(
                        data.data?.outbound_detail_list.map((item: any) => ({
                          value: item.item_id,
                          label: item.item_code,
                        }))
                      );

                      setOutboundDetail(data.data?.outbound_detail_list);
                    }
                  }}
                  value={outboundOptions.find(
                    (item) => item.value === scanForm?.outbound_id
                  )}
                  placeholder="Select an option"
                />
                <span className="text-xs text-muted-foreground">
                  Customer : {scanForm?.customer_name}
                  <br /> Delivery No : {scanForm?.delivery_no}
                </span>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="item_code">Item Code</Label>
                <Select
                  id="item_code"
                  options={detailOptions}
                  onChange={(e) => {
                    const itemSelected: any = outboundDetail.find(
                      (item: any) => item?.item_id === e?.value
                    );
                    setScanForm({
                      ...scanForm,
                      item_code: itemSelected?.item_code || "",
                      item_id: itemSelected?.item_id || 0,
                      outbound_detail_id: itemSelected?.outbound_detail_id || 0,
                      item_name: itemSelected?.item_name || "",
                      item_has_serial: itemSelected?.has_serial || "",
                      req_qty: itemSelected?.qty_req || 0,
                      scanned_qty: itemSelected?.qty_scan || 0,
                    });
                  }}
                  placeholder="Select an option"
                />
                <span className="text-xs text-muted-foreground">
                  Item Name : {scanForm?.item_name}
                  <br /> Has Serial :{" "}
                  {scanForm?.item_has_serial === "Y" ? "Yes" : "No"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col space-y-1.5">
                  <Label>Koli</Label>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      defaultValue={1}
                      id="koli"
                      type="number"
                      onChange={(e) => {
                        setScanForm({
                          ...scanForm,
                          koli: parseInt(e.target.value),
                        });
                      }}
                      value={scanForm?.koli}
                      // value={dataToPost.location}
                      placeholder="Enter Koli"
                    />
                    <Button type="button" variant="outline">
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Serial No</Label>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="w-full">
                    <Input
                      id="serial_no"
                      type="text"
                      onChange={(e) => {
                        setScanForm({
                          ...scanForm,
                          scan_data: e.target.value,
                        });
                      }}
                      value={scanForm?.scan_data}
                      placeholder="Enter Serial No"
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {/* Item Code : {dataToPost.item_info?.item_code}, Serial : {dataToPost.item_info?.has_serial == "Y" ? "Yes" : "No"} */}
                </span>
                <span className="text-xs text-muted-foreground">
                  Req Qty : {scanForm?.req_qty} , Scanned :{scanForm?.scanned_qty}
                </span>
              </div>
            </div>

            {scanForm?.scan_type === "BARCODE" && (
              <div className="flex flex-col space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={scanForm?.quantity}
                  onChange={(e) =>
                    setScanForm({
                      ...scanForm,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  placeholder="Enter Quantity"
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="submit">
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
