import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Select from "react-select";
import eventBus from "@/utils/eventBus";

const useAutoFocus = (
  value: string,
  maxLength: number,
  nextElementId: string | null,
  ref: React.RefObject<HTMLInputElement> | null,
  callBack?: () => void
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    console.log("useAutoFocus dijalankan");
    // Jika panjang karakter kurang dari maxLength, batal pindah focus
    if (value.length < maxLength) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // Set timeout untuk pindah focus setelah 3 detik
    timerRef.current = setTimeout(() => {
      if (callBack) {
        if (nextElementId) {
          const nextInput = document.getElementById(
            nextElementId
          ) as HTMLInputElement;
          nextInput?.focus();
          console.log("Pindah ke ID : ", nextElementId);
        } else {
          ref?.current?.focus();
          console.log("Pindah ke Ref : ", nextElementId);
        }
        callBack?.();
      } else {
        if (nextElementId) {
          const nextInput = document.getElementById(
            nextElementId
          ) as HTMLInputElement;
          nextInput?.focus();
          console.log("Pindah ke ID : ", nextElementId);
        } else {
          ref?.current?.focus();
          console.log("Pindah ke Ref : ", nextElementId);
        }
        console.log("Tidak ada callBack");
      }
    }, 500);

    return () => {
      // Hapus timer jika user masih mengetik sebelum 3 detik
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, maxLength, nextElementId, ref]);
};

export function ScanForm({ dataToPost, setDataToPost }) {
  const [error, setError] = useState<string | null>(null);
  const [inboundOptions, setInboundOptions] = useState([]);
  const onChangeInboundNo = async (selectedOption) => {
    setSelectedItem(null);

    const dataInboundDetail = await InboundDetail(selectedOption.value);

    const itemOptions = dataInboundDetail.data.details.map((item: any) => ({
      value: item.id,
      label: item.gmc,
    }));

    setDataToPost({
      ...dataToPost,
      inbound_detail: dataInboundDetail.data.details,
      inbound: dataInboundDetail.data.header,
      item_options: itemOptions,
      inbound_id: selectedOption.value,
      inbound_detail_id: null,
      item_code: "",
      gmc: "",
    });
    document.getElementById("location")?.focus();
  };

  const InboundDetail = async (id: number) => {
    const response = await api.get("/rf/inbound/" + id, {
      withCredentials: true,
    });
    console.log("Response Object:", response); // Debugging
    const data = await response.data;
    return data;
  };

  const [whOptions, setWhOptions] = useState([]);
  const handleWhChange = (selectedOption) => {
    setDataToPost({ ...dataToPost, whs_code: selectedOption.value });
    refItemCode.current?.focus();
  };
  const handleQaChange = (selectedOption) => {
    console.log(selectedOption);
    console.log(qaOptions);
    setDataToPost({ ...dataToPost, qa_status: selectedOption.value });
    whRef.current?.focus();
  };
  const refItemCode = useRef<any>(null);
  const qaRef = useRef<any>(null);
  const [qaOptions, setQaOptions] = useState([]);
  const whRef = useRef<any>(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const onChangeItem = async (option) => {
    setSelectedItem(option);
    if (option === null) {
      setDataToPost({
        ...dataToPost,
        inbound_detail_id: null,
        item_code: "",
        gmc: "",
      });
      return;
    }

    const response = async () =>
      await api.get("rf/inbound/detail/scanned/" + option.value, {
        withCredentials: true,
      });
    const dataScanned = (await response()).data.data.scanned;

    setDataToPost({
      ...dataToPost,
      scanned_item: dataScanned,
      inbound_detail_id: option.value,
      item_code: dataScanned.item_code,
      gmc: dataScanned.gmc,
      item_info: dataScanned,
    });

    document.getElementById("serialNumber")?.focus();
  };

  const onInputChangeItem = (e) => {
    const selected = dataToPost.item_options.find((item) => item.label === e);
    if (selected) {
      setDataToPost({
        ...dataToPost,
        inbound_detail_id: selected.value,
        item_code: selected.label,
      });
      setSelectedItem(selected);
      document.getElementById("serialNumber")?.focus();
    }
  };

  const handleOnChangeLocation = (e) => {
    setDataToPost({
      ...dataToPost,
      location: e.target.value,
    });
  };

  // const [scanType, setScanType] = useState("");

  const [scanOptions, setScanOptions] = useState([
    { value: "SERIAL", label: "SERIAL" },
    { value: "BARCODE", label: "BARCODE" },
    { value: "SET", label: "SET" },
  ]);

  useEffect(() => {
    api.get("/rf/inbound/list", { withCredentials: true }).then((res) => {
      if (res.data.success) {
        setInboundOptions(
          res.data.data.inbound.map((item) => ({
            value: item.id,
            label: item.inbound_no,
          }))
        );

        setWhOptions(
          res.data.data.wh.map(
            (item: { ID: number; warehouse_code: string }) => ({
              value: item.warehouse_code,
              label: item.warehouse_code,
            })
          )
        );

        setQaOptions(
          res.data.data.qa.map((item: { ID: number; qa_status: string }) => ({
            value: item.qa_status,
            label: item.qa_status,
          }))
        );
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    postData();
  }

  const postData = () => {
    if (dataToPost.inbound_detail_id === null) {
      alert("Please select item");
      return;
    }

    console.log(dataToPost);
    // return;

    const data = {
      inbound_id: dataToPost.inbound_id,
      inbound_detail_id: dataToPost.inbound_detail_id,
      serial_number: dataToPost.serial_number,
      serial_number2: dataToPost.serial_number_2,
      location: dataToPost.location,
      qa_status: dataToPost.qa_status,
      whs_code: dataToPost.whs_code,
      scan_type: dataToPost.scan_type,
      quantity: parseInt(dataToPost.quantity),
    };

    api
      .post("/rf/inbound/" + dataToPost.inbound_id, data, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: "Saved",
            type: "success",
          });
          setDataToPost({
            ...dataToPost,
            serial_number: "",
            item_info: res.data.data.scanned,
          });

          document.getElementById("serialNumber")?.focus();
        }
      });
  };

  useAutoFocus(dataToPost.location, 6, null, qaRef);
  useAutoFocus(dataToPost.serial_number, 6, null, null, postData);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e); // Submit form saat Enter
    }
  };

  const handleOnChangeSerialNumber = (e) => {
    setDataToPost({
      ...dataToPost,
      serial_number: e.target.value,
    });
  };

  const handleCancel = () => {
    // setError(null);
    // setItemCode("");
    // setItemName("");
    // setGmc("");
  };

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
                    if (e.value === "SET" || e.value === "SERIAL") {
                      setDataToPost({
                        ...dataToPost,
                        scan_type: e.value,
                        quantity: 1,
                      });
                    } else {
                      setDataToPost({ ...dataToPost, scan_type: e.value });
                    }
                  }}
                  value={scanOptions.find(
                    (item) => item.value === dataToPost.scan_type
                  )}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="inbound_no">Inbound No</Label>
                <Select
                  id="inboundNo"
                  options={inboundOptions}
                  onChange={onChangeInboundNo}
                  value={inboundOptions.find(
                    (item) => item.value === dataToPost.inbound_id
                  )}
                  placeholder="Select an option"
                />
                <span className="text-xs text-muted-foreground">
                  Supplier : {dataToPost.inbound?.supplier_name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col space-y-1.5">
                  <Label>Location</Label>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      id="location"
                      type="text"
                      onChange={handleOnChangeLocation}
                      value={dataToPost.location}
                      placeholder="Enter Location"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDataToPost({ ...dataToPost, location: "" });
                        document.getElementById("location")?.focus();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="inbound_no">QA Status</Label>
                <Select
                  ref={qaRef}
                  id="qaStatus"
                  options={qaOptions}
                  onChange={handleQaChange}
                  value={qaOptions.find(
                    (item) => item.value === dataToPost.qa_status
                  )}
                  placeholder="Select"
                />
              </div>
              <div>
                <Label htmlFor="inbound_no">WH Code</Label>
                <Select
                  ref={whRef}
                  id="wh"
                  options={whOptions}
                  onChange={handleWhChange}
                  value={whOptions.find(
                    (item) => item.value === dataToPost.whs_code
                  )}
                  placeholder="Select"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>GMC</Label>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="w-full">
                    <Select
                      key={selectedItem ? selectedItem.value : "empty"}
                      ref={refItemCode}
                      id="itemCode"
                      options={dataToPost.item_options}
                      onChange={onChangeItem}
                      onInputChange={onInputChangeItem}
                      value={dataToPost.item_options.find(
                        (item) => item.value === dataToPost.inbound_detail_id
                      )}
                      placeholder="Select an option"
                      isClearable
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Item Code : {dataToPost.item_info?.item_code}, Serial : {dataToPost.item_info?.has_serial == "Y" ? "Yes" : "No"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Expect : {dataToPost.item_info?.quantity} , Scanned :
                  {dataToPost.item_info?.qty_scan}
                </span>
              </div>

              {/* <div className="flex flex-col space-y-1.5">
                <Label>Serial No.</Label>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    id="serialNumber"
                    type="text"
                    onChange={handleOnChangeSerialNumber}
                    value={dataToPost.serial_number}
                    placeholder="Enter Serial No"
                  />
                  <Button
                    // className="h-8 w-8"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDataToPost({ ...dataToPost, serial_number: "" });
                      document.getElementById("serialNumber")?.focus();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div> */}

              {/* Kondisi Input berdasarkan Scan Type */}
              {dataToPost.scan_type === "SERIAL" && (
                <div className="flex flex-col space-y-1.5">
                  <Label>Serial No.</Label>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      id="serialNumber"
                      type="text"
                      value={dataToPost.serial_number}
                      onChange={(e) =>
                        setDataToPost({
                          ...dataToPost,
                          serial_number: e.target.value,
                        })
                      }
                      placeholder="Enter Serial No"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDataToPost({ ...dataToPost, serial_number: "" })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {dataToPost.scan_type === "BARCODE" && (
                <div className="flex flex-col space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={dataToPost.quantity}
                    onChange={(e) =>
                      setDataToPost({ ...dataToPost, quantity: e.target.value })
                    }
                    placeholder="Enter Quantity"
                  />
                </div>
              )}

              {dataToPost.scan_type === "SET" && (
                <div className="flex flex-col space-y-1.5">
                  <Label>Serial No. 1</Label>
                  <Input
                    id="serialNumber1"
                    type="text"
                    value={dataToPost.serial_number}
                    onChange={(e) =>
                      setDataToPost({
                        ...dataToPost,
                        serial_number: e.target.value,
                      })
                    }
                    placeholder="Enter First Serial No"
                  />

                  <Label>Serial No. 2</Label>
                  <Input
                    id="serialNumber2"
                    type="text"
                    value={dataToPost.serial_number_2}
                    onChange={(e) =>
                      setDataToPost({
                        ...dataToPost,
                        serial_number_2: e.target.value,
                      })
                    }
                    placeholder="Enter Second Serial No"
                  />
                </div>
              )}
            </div>
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
