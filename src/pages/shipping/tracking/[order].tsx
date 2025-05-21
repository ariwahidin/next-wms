/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // shadcn tabs
import dynamic from "next/dynamic";
import api from "@/lib/api";

const MapView = dynamic(
  () => import("@/components/mobile/shipping/tracking/MapView"),
  {
    ssr: false,
  }
);

interface DOItem {
  routeHistory: [number, number][];
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  time: string;
  status: string;
}

interface HeaderInfo {
  order_no: string;
  transporter: string;
  status: string;
}

interface OrderDetail {
  ID: number;
  order_id: number;
  order_no: string;
  delivery_number: string;
  status: string;
  customer: string;
  sold_to: string;
  ship_to: string;
}

interface OrderDetailItem {
  ID: number;
  order_id: number;
  order_no: string;
  item_code: string;
  item_name: string;
  delivery_number: string;
  qty: number;
  volume: string;
}

interface OrderConsole {
  order_id: number;
  order_no: string;
  driver: string;
  longitude: number;
  latitude: number;
}

export default function OrderDetailPage() {
  const [rowData, setRowData] = useState<OrderDetail[]>([]);
  const [dataHeader, setDataHeader] = useState<HeaderInfo | null>(null);

  const [allDetailItem, setAllDetailItem] = useState<OrderDetailItem[]>([]);
  const [dataDetailItem, setDataDetailItem] = useState<OrderDetailItem[]>([]);
  const [dataConsole, setDataConsole] = useState<OrderConsole[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [selectedDO, setSelectedDO] = useState<OrderDetail | null>(null);
  const [tabValue, setTabValue] = useState("detail"); // default active tab "detail"

  const params = useParams();
  const order = params?.order as string;

  const dataHeaderDummy: HeaderInfo = {
    order_no: "SPK-001",
    transporter: "Transporter A",
    status: "In Transit",
  };

  const dummyDOs: DOItem[] = [
    {
      id: 1,
      name: "DO-001",
      latitude: -6.2,
      longitude: 106.816666,
      time: "08:00",
      status: "picked up",
      routeHistory: [
        [-6.2, 106.8166],
        [-6.201, 106.8172],
        [-6.202, 106.8183],
        [-6.203, 106.8194],
        [-6.204, 106.8205],
        [-6.205, 106.8216],
        [-6.206, 106.8227],
      ],
    },
    {
      id: 2,
      name: "DO-002",
      latitude: -6.201,
      longitude: 106.817,
      time: "08:30",
      status: "in transit",
      routeHistory: [
        [-6.201, 106.817],
        [-6.202, 106.818],
        [-6.203, 106.819],
      ],
    },
  ];

  const fetchData = async () => {
    try {
      const res = await api.get(`/shipping/order/detail/${order}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        const data = res.data;
        setDataHeader(data.data.order_header);
        setRowData(data.data.order_details);
        setAllDetailItem(data.data.order_detail_items);

        if (data.data.order_consoles > 0) {
          setDataConsole(data.data.order_consoles);
          setSelectedLocation([
            data.data.order_consoles[0].latitude,
            data.data.order_consoles[0].longitude,
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (order) {
      fetchData();
      // setDataHeader(dataHeaderDummy);
      // setRowData(dummyDOs);
      // setIsLoading(false);

      // if (dummyDOs.length > 0) {
      //   setSelectedLocation([dummyDOs[0].latitude, dummyDOs[0].longitude]);
      //   setRoutePath(dummyDOs[0].routeHistory);
      //   setSelectedDO(dummyDOs[0]);
      // }
    }
  }, [order]);

  const itemDetails = [
    { id: 1, name: "Laptop", qty: 2 },
    { id: 2, name: "Mouse", qty: 5 },
    { id: 3, name: "Keyboard", qty: 3 },
  ];

  return (
    <Layout
      title="Order List"
      titleLink="/shipping/order-list"
      subTitle={`${order}`}
    >
      {isLoading ? (
        <div className="p-4">Loading...</div>
      ) : (
        // <div className="p-4 flex flex-col gap-4">

        <div className="flex flex-col md:flex-row h-full gap-4 p-4">
          {/* Main Map View */}
          <div className="flex-1 h-[500px]">
            <Card className="p-4 bg-white shadow-sm flex flex-col">
              {/* Tabs di area map */}
              <Tabs value={tabValue} onValueChange={setTabValue}>
                <TabsList className="mb-2">
                  <TabsTrigger value="detail">Items</TabsTrigger>
                  <TabsTrigger value="map">Map</TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="h-[500px]">
                  {selectedLocation && (
                    <MapView
                      latitude={selectedLocation[0]}
                      longitude={selectedLocation[1]}
                      routePath={routePath}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="detail"
                  className="overflow-y-auto h-[500px]"
                >
                  <h3 className="font-semibold mb-4">
                    Items for DO {selectedDO?.delivery_number || "..."}
                  </h3>
                  <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Item Name
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Quantity
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataDetailItem.map((item) => (
                        <tr key={item.ID} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">
                            {item.item_code} - {item.item_name}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {item.qty}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {item.volume}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="md:w-1/3 space-y-4">
            <Card className="p-4 bg-white shadow-sm">
              {/* <h2 className="font-bold text-lg mb-2">Order Info</h2> */}
              <p>
                <strong>Order No:</strong> {dataHeader?.order_no}
              </p>
              <p>
                <strong>Transporter:</strong> {dataHeader?.transporter}
              </p>
              <p>
                <strong>Status:</strong> {dataHeader?.status}
              </p>
            </Card>
            {/* DO list */}
            <Card className="p-4 bg-white shadow-sm">
              <h2 className="font-bold mb-2">Delivery Orders</h2>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {rowData.map((item) => (
                  <Button
                    key={item.order_id}
                    variant="outline"
                    className="justify-start items-start text-left h-16"
                    onClick={() => {
                      // setSelectedLocation([item.latitude, item.longitude]);
                      // setRoutePath(item.routeHistory);
                      // setSelectedDO(item);

                      const delivery_number = item.delivery_number;
                      const filteredItems = allDetailItem.filter(
                        (detailItem) =>
                          detailItem.delivery_number === delivery_number
                      );
                      setDataDetailItem(filteredItems);
                      setSelectedDO(item);
                    }}
                  >
                    <div className="w-full flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">
                          DO : {item.delivery_number}
                        </div>
                        {item.customer && (
                          <small className="text-xs text-gray-500">
                            {item.customer}
                          </small>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 rounded px-2 py-1 bg-green-100">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}
