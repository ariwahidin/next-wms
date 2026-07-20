/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// PAGE

import Layout from "@/components/layout";
import { OccupancyTab } from "@/components/storage-overview/OccupancyTab";
import { OverviewTab } from "@/components/storage-overview/OverviewTab";
import api from "@/lib/api";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

// ============================================================
// OWNER GATE
// ============================================================
function OwnerGate({ onSelect }: { onSelect: (code: string) => void }) {
  const [owners, setOwners] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owners', { withCredentials: true })
      .then((res) => {
        if (res.data.success) setOwners(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex i bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white h-max rounded-xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Select Owner</h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose an owner to view their storage overview and occupancy dashboard.
        </p>
        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">Loading owners...</div>
        ) : (
          <>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Owner --</option>
              {owners.map((o: any) => (
                <option key={o.code} value={o.code}>
                  {o.code} - {o.name}
                </option>
              ))}
            </select>
            <button
              disabled={!selected}
              onClick={() => onSelect(selected)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
export default function StorageOverviewPage() {
  const router = useRouter();
  const ownerCode = typeof router.query.owner === 'string' ? router.query.owner : '';

  const handleSelectOwner = (code: string) => {
    router.push({ pathname: router.pathname, query: { ...router.query, owner: code } });
  };

  const handleChangeOwner = () => {
    router.push({ pathname: router.pathname, query: {} });
  };

  if (!router.isReady) return null;

  if (!ownerCode) {
    return (
      <Layout title="Utilities" subTitle="Storage Overview">
        <OwnerGate onSelect={handleSelectOwner} />
      </Layout>
    );
  }

  return <StorageDashboard ownerCode={ownerCode} onChangeOwner={handleChangeOwner} />;
}

function StorageDashboard({ ownerCode, onChangeOwner }: { ownerCode: string; onChangeOwner: () => void }) {
  const [activeTab, setActiveTab] = useState<'occupancy' | 'overview'>('occupancy');
  const [rackData, setRackData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/locations?owner_code=${encodeURIComponent(ownerCode)}`, { withCredentials: true });
      setRackData(res.data.data || []);

      const res2 = await api.get('/inventory/location', { withCredentials: true });
      setInventoryData(res2.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ownerCode]);

  const ownerLocationCodes = useMemo(
    () => new Set(rackData.map((l: any) => l.location_code)),
    [rackData]
  );
  const ownerInventory = useMemo(
    () => inventoryData.filter((i: any) => ownerLocationCodes.has(i.location_code)),
    [inventoryData, ownerLocationCodes]
  );

  return (
    <Layout title="Utilities" subTitle="Storage Overview">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              {/* <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Storage Overview</h1> */}
              <p className="text-gray-600 mt-1">
                Owner: <span className="font-semibold text-blue-600">{ownerCode}</span>
              </p>
            </div>
            <button
              onClick={onChangeOwner}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Change Owner
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
              <button
                onClick={() => setActiveTab('occupancy')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${activeTab === 'occupancy' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Occupancy
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2 rounded-md font-semibold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Overview
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : activeTab === 'occupancy' ? (
            <OccupancyTab rackData={rackData} inventoryData={ownerInventory} />
          ) : (
            <OverviewTab rackData={rackData} inventoryData={ownerInventory} />
          )}
        </div>
      </div>
    </Layout>
  );
}