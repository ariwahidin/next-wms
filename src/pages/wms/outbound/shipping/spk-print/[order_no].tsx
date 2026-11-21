"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/router";
import api from "@/lib/api";
import SPKPrint from "@/components/shipping/SPKPrint";
export default function SPKPrintPage(){const router=useRouter();const {order_no}=router.query;const [data,setData]=useState<any>(null);useEffect(()=>{if(!order_no)return;api.get(`/order/detail/${order_no}`,{withCredentials:true}).then(r=>setData(r.data?.data)).catch(console.error)},[order_no]);if(!data)return <div className="p-6">Loading SPK...</div>;const order=data.order||{};const items=data.detail_items||order.items||[];return <main className="mx-auto max-w-7xl p-6"><div className="mb-4 flex justify-end print:hidden"><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={()=>window.print()}>Print SPK</button></div><SPKPrint order={order} items={items}/></main>}
