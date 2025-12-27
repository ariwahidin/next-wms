import type { ItemPackaging } from "@/types/itemPackaging";

interface ItemPackagingTableProps {
  items: ItemPackaging[];
  onEdit: (item: ItemPackaging) => void;
  onDelete: (id: number) => void;
}

export function ItemPackagingTable({
  items,
  onEdit,
  onDelete,
}: ItemPackagingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              Item Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              UOM
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              EAN
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              Dimensions (L×W×H)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              Weight (Net/Gross)
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.item_code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.uom}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.ean}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.length_cm} × {item.width_cm} × {item.height_cm} cm
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.net_weight_kg} / {item.gross_weight_kg} kg
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}