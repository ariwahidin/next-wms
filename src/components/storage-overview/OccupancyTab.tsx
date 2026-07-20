/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = {
  occupied: '#10b981', // green-500
  empty: '#3b82f6',    // blue-500
  inactive: '#ef4444', // red-500
};

// ============================================================
// STAT CARD (accent bar style)
// ============================================================
function StatCard({ label, value, percent, accent }: { label: string; value: number; percent?: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="flex">
        <div className="w-1.5" style={{ backgroundColor: accent }} />
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-800">{value}</span>
            {percent && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accent}20`, color: accent }}>
                {percent}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OCCUPANCY TAB
// ============================================================
export function OccupancyTab({ rackData, inventoryData }: { rackData: any[]; inventoryData: any[] }) {
  const stats = useMemo(() => {
    const locationCodesWithInventory = new Set(
      inventoryData.filter((i: any) => (i.qty ?? 0) > 0).map((i: any) => i.location_code)
    );

    let occupied = 0, empty = 0, inactive = 0;
    const perRowMap: Record<string, any> = {};

    rackData.forEach((loc: any) => {
      let status: 'occupied' | 'empty' | 'inactive';
      if (!loc.is_active) {
        status = 'inactive';
        inactive++;
      } else if (locationCodesWithInventory.has(loc.location_code)) {
        status = 'occupied';
        occupied++;
      } else {
        status = 'empty';
        empty++;
      }

      if (!perRowMap[loc.row]) {
        perRowMap[loc.row] = { row: loc.row, occupied: 0, empty: 0, inactive: 0, total: 0 };
      }
      perRowMap[loc.row][status]++;
      perRowMap[loc.row].total++;
    });

    const perRow = Object.values(perRowMap).sort((a: any, b: any) => a.row.localeCompare(b.row));
    const total = rackData.length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { occupied, empty, inactive, total, occupancyRate, perRow };
  }, [rackData, inventoryData]);

  const pieData = [
    { name: 'Occupied', value: stats.occupied, color: COLORS.occupied },
    { name: 'Empty', value: stats.empty, color: COLORS.empty },
    { name: 'Inactive', value: stats.inactive, color: COLORS.inactive },
  ];

  if (stats.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
        No locations found for this owner.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Locations" value={stats.total} accent="#6366f1" />
        <StatCard
          label="Occupied"
          value={stats.occupied}
          percent={`${stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0}%`}
          accent={COLORS.occupied}
        />
        <StatCard
          label="Empty"
          value={stats.empty}
          percent={`${stats.total ? Math.round((stats.empty / stats.total) * 100) : 0}%`}
          accent={COLORS.empty}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          percent={`${stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0}%`}
          accent={COLORS.inactive}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Breakdown</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-3xl font-bold text-gray-800">{stats.occupancyRate}%</p>
              <p className="text-xs text-gray-500 font-semibold">Occupied</p>
            </div>
          </div>
        </div>

        {/* Stacked Bar per Row */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy per Row</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.perRow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="row" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupied" stackId="a" fill={COLORS.occupied} name="Occupied" />
              <Bar dataKey="empty" stackId="a" fill={COLORS.empty} name="Empty" />
              <Bar dataKey="inactive" stackId="a" fill={COLORS.inactive} name="Inactive" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Detail per Row</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Row</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Occupied</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Empty</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Inactive</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Occupancy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.perRow.map((r: any) => {
                const rate = r.total ? Math.round((r.occupied / r.total) * 100) : 0;
                return (
                  <tr key={r.row} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{r.row}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{r.total}</td>
                    <td className="px-6 py-3 text-sm text-green-600 font-semibold">{r.occupied}</td>
                    <td className="px-6 py-3 text-sm text-blue-600 font-semibold">{r.empty}</td>
                    <td className="px-6 py-3 text-sm text-red-600 font-semibold">{r.inactive}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}