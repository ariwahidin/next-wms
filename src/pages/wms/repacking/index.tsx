import React, { useState } from 'react';
import { Package, History, Warehouse, Plus, ChevronRight, Calendar, User, Box } from 'lucide-react';

// Types
interface RepackingItem {
  id: string;
  date: string;
  referenceNo: string;
  warehouse: string;
  zone: string;
  operator: string;
  status: 'completed' | 'in-progress' | 'pending';
  inputSKU: string;
  inputProduct: string;
  inputQty: number;
  inputUnit: string;
  outputSKU: string;
  outputProduct: string;
  outputQty: number;
  waste: number;
  netOutput: number;
  batchNumber: string;
  expiredDate: string;
  reason: string;
  cost: number;
}

interface InventoryItem {
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  expiredDate: string;
  warehouse: string;
  zone: string;
}

// Dummy Data
const repackingData: RepackingItem[] = [
  {
    id: 'REP-2024-001',
    date: '2026-01-12',
    referenceNo: 'WO/REP/001/2024',
    warehouse: 'WH-A',
    zone: 'Zone-B',
    operator: 'John Doe',
    status: 'completed',
    inputSKU: 'PROD-001-CARTON',
    inputProduct: 'Minyak Goreng Karton 12 pcs',
    inputQty: 10,
    inputUnit: 'Carton',
    outputSKU: 'PROD-001-ECERAN',
    outputProduct: 'Minyak Goreng Botol (Eceran)',
    outputQty: 120,
    waste: 2,
    netOutput: 118,
    batchNumber: 'BATCH-20250110',
    expiredDate: '2027-01-10',
    reason: 'Customer request - penjualan eceran',
    cost: 50000
  },
  {
    id: 'REP-2024-002',
    date: '2026-01-11',
    referenceNo: 'WO/REP/002/2024',
    warehouse: 'WH-A',
    zone: 'Zone-C',
    operator: 'Jane Smith',
    status: 'completed',
    inputSKU: 'PROD-002-BOX',
    inputProduct: 'Sabun Mandi Box 24 pcs',
    inputQty: 15,
    inputUnit: 'Box',
    outputSKU: 'PROD-002-ECERAN',
    outputProduct: 'Sabun Mandi (Eceran)',
    outputQty: 360,
    waste: 5,
    netOutput: 355,
    batchNumber: 'BATCH-20250105',
    expiredDate: '2027-06-15',
    reason: 'Repack untuk retail',
    cost: 75000
  },
  {
    id: 'REP-2024-003',
    date: '2026-01-10',
    referenceNo: 'WO/REP/003/2024',
    warehouse: 'WH-B',
    zone: 'Zone-A',
    operator: 'Mike Johnson',
    status: 'in-progress',
    inputSKU: 'PROD-003-PACK',
    inputProduct: 'Gula Pasir Pack 50kg',
    inputQty: 20,
    inputUnit: 'Pack',
    outputSKU: 'PROD-003-1KG',
    outputProduct: 'Gula Pasir 1kg',
    outputQty: 1000,
    waste: 8,
    netOutput: 992,
    batchNumber: 'BATCH-20250108',
    expiredDate: '2026-12-31',
    reason: 'Permintaan pasar modern',
    cost: 120000
  },
  {
    id: 'REP-2024-004',
    date: '2026-01-09',
    referenceNo: 'WO/REP/004/2024',
    warehouse: 'WH-A',
    zone: 'Zone-B',
    operator: 'Sarah Lee',
    status: 'completed',
    inputSKU: 'PROD-004-DRUM',
    inputProduct: 'Detergen Drum 100kg',
    inputQty: 5,
    inputUnit: 'Drum',
    outputSKU: 'PROD-004-500G',
    outputProduct: 'Detergen 500g',
    outputQty: 1000,
    waste: 3,
    netOutput: 997,
    batchNumber: 'BATCH-20250107',
    expiredDate: '2027-03-20',
    reason: 'Repackaging promosi',
    cost: 95000
  }
];

const inventoryData: InventoryItem[] = [
  {
    sku: 'PROD-001-CARTON',
    productName: 'Minyak Goreng Karton 12 pcs',
    quantity: 150,
    unit: 'Carton',
    batchNumber: 'BATCH-20250110',
    expiredDate: '2027-01-10',
    warehouse: 'WH-A',
    zone: 'Zone-B'
  },
  {
    sku: 'PROD-001-ECERAN',
    productName: 'Minyak Goreng Botol (Eceran)',
    quantity: 450,
    unit: 'Pcs',
    batchNumber: 'BATCH-20250110',
    expiredDate: '2027-01-10',
    warehouse: 'WH-A',
    zone: 'Zone-B'
  },
  {
    sku: 'PROD-002-BOX',
    productName: 'Sabun Mandi Box 24 pcs',
    quantity: 80,
    unit: 'Box',
    batchNumber: 'BATCH-20250105',
    expiredDate: '2027-06-15',
    warehouse: 'WH-A',
    zone: 'Zone-C'
  },
  {
    sku: 'PROD-002-ECERAN',
    productName: 'Sabun Mandi (Eceran)',
    quantity: 920,
    unit: 'Pcs',
    batchNumber: 'BATCH-20250105',
    expiredDate: '2027-06-15',
    warehouse: 'WH-A',
    zone: 'Zone-C'
  },
  {
    sku: 'PROD-003-PACK',
    productName: 'Gula Pasir Pack 50kg',
    quantity: 200,
    unit: 'Pack',
    batchNumber: 'BATCH-20250108',
    expiredDate: '2026-12-31',
    warehouse: 'WH-B',
    zone: 'Zone-A'
  },
  {
    sku: 'PROD-003-1KG',
    productName: 'Gula Pasir 1kg',
    quantity: 3500,
    unit: 'Pcs',
    batchNumber: 'BATCH-20250108',
    expiredDate: '2026-12-31',
    warehouse: 'WH-B',
    zone: 'Zone-A'
  }
];

const WMSRepackingApp = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'inventory'>('dashboard');
  const [selectedItem, setSelectedItem] = useState<RepackingItem | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [repackingList, setRepackingList] = useState<RepackingItem[]>(repackingData);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(inventoryData);
  
  const [formData, setFormData] = useState({
    referenceNo: '',
    warehouse: 'WH-A',
    zone: 'Zone-B',
    operator: '',
    inputSKU: '',
    inputProduct: '',
    inputQty: 0,
    inputUnit: 'Carton',
    outputSKU: '',
    outputProduct: '',
    outputQty: 0,
    waste: 0,
    batchNumber: '',
    expiredDate: '',
    reason: '',
    cost: 0
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newId = `REP-2024-${String(repackingList.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    
    const newRepacking: RepackingItem = {
      id: newId,
      date: today,
      referenceNo: formData.referenceNo,
      warehouse: formData.warehouse,
      zone: formData.zone,
      operator: formData.operator,
      status: 'in-progress',
      inputSKU: formData.inputSKU,
      inputProduct: formData.inputProduct,
      inputQty: formData.inputQty,
      inputUnit: formData.inputUnit,
      outputSKU: formData.outputSKU,
      outputProduct: formData.outputProduct,
      outputQty: formData.outputQty,
      waste: formData.waste,
      netOutput: formData.outputQty - formData.waste,
      batchNumber: formData.batchNumber,
      expiredDate: formData.expiredDate,
      reason: formData.reason,
      cost: formData.cost
    };
    
    setRepackingList([newRepacking, ...repackingList]);
    setShowNewForm(false);
    
    // Reset form
    setFormData({
      referenceNo: '',
      warehouse: 'WH-A',
      zone: 'Zone-B',
      operator: '',
      inputSKU: '',
      inputProduct: '',
      inputQty: 0,
      inputUnit: 'Carton',
      outputSKU: '',
      outputProduct: '',
      outputQty: 0,
      waste: 0,
      batchNumber: '',
      expiredDate: '',
      reason: '',
      cost: 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h1 className="text-sm font-semibold">WMS Repacking System</h1>
            </div>
            <button 
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              New Repacking
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              Inventory
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Total Repacking</p>
                <p className="text-lg font-semibold mt-0.5">{repackingList.length}</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-semibold mt-0.5 text-green-600">
                  {repackingList.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="text-lg font-semibold mt-0.5 text-blue-600">
                  {repackingList.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
            </div>

            {/* Recent Repacking */}
            <div className="bg-white rounded border border-gray-200">
              <div className="p-3 border-b border-gray-200">
                <h2 className="text-xs font-semibold">Total Repacking: {repackingList.length}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {repackingList.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-900">{item.id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{item.inputProduct}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.operator}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold">Repacking History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">ID</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Input Product</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Output Product</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Qty In</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Qty Out</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Waste</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {repackingList.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-3 py-2.5 font-medium">{item.id}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.date}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.inputProduct}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.outputProduct}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.inputQty} {item.inputUnit}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.outputQty} Pcs</td>
                      <td className="px-3 py-2.5 text-red-600">{item.waste}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{item.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-xs font-semibold">Inventory Stock</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Batch Number</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Expired Date</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Warehouse</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium">{item.sku}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.productName}</td>
                      <td className="px-3 py-2.5 text-gray-900 font-medium">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{item.batchNumber}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.expiredDate}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.warehouse}</td>
                      <td className="px-3 py-2.5 text-gray-600">{item.zone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* New Repacking Form Modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowNewForm(false)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-sm font-semibold">New Repacking Transaction</h3>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitNew} className="p-4 space-y-4">
              {/* General Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-700">General Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Reference No *</label>
                    <input
                      type="text"
                      required
                      value={formData.referenceNo}
                      onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="WO/REP/XXX/2024"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Operator *</label>
                    <input
                      type="text"
                      required
                      value={formData.operator}
                      onChange={(e) => setFormData({...formData, operator: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Operator name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Warehouse *</label>
                    <select
                      value={formData.warehouse}
                      onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>WH-A</option>
                      <option>WH-B</option>
                      <option>WH-C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Zone *</label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Zone-A</option>
                      <option>Zone-B</option>
                      <option>Zone-C</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Input Details */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700">Input (Before Repacking)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Input SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.inputSKU}
                      onChange={(e) => setFormData({...formData, inputSKU: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="PROD-XXX-CARTON"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Input Product *</label>
                    <input
                      type="text"
                      required
                      value={formData.inputProduct}
                      onChange={(e) => setFormData({...formData, inputProduct: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.inputQty || ''}
                      onChange={(e) => setFormData({...formData, inputQty: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit *</label>
                    <select
                      value={formData.inputUnit}
                      onChange={(e) => setFormData({...formData, inputUnit: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Carton</option>
                      <option>Box</option>
                      <option>Pack</option>
                      <option>Drum</option>
                      <option>Pcs</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Output Details */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700">Output (After Repacking)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Output SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.outputSKU}
                      onChange={(e) => setFormData({...formData, outputSKU: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="PROD-XXX-ECERAN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Output Product *</label>
                    <input
                      type="text"
                      required
                      value={formData.outputProduct}
                      onChange={(e) => setFormData({...formData, outputProduct: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Output Quantity (pcs) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.outputQty || ''}
                      onChange={(e) => setFormData({...formData, outputQty: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Waste/Reject (pcs)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.waste || ''}
                      onChange={(e) => setFormData({...formData, waste: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Net Output</label>
                    <input
                      type="text"
                      readOnly
                      value={`${formData.outputQty - formData.waste} pcs`}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Info */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700">Batch Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="BATCH-YYYYMMDD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Expired Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiredDate}
                      onChange={(e) => setFormData({...formData, expiredDate: e.target.value})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Reason for Repacking *</label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Explain the reason..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Repacking Cost (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData({...formData, cost: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Repacking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Repacking Details</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">ID Repacking</p>
                  <p className="font-medium mt-0.5">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reference No</p>
                  <p className="font-medium mt-0.5">{selectedItem.referenceNo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium mt-0.5">{selectedItem.date}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Warehouse</p>
                  <p className="font-medium mt-0.5">{selectedItem.warehouse}</p>
                </div>
                <div>
                  <p className="text-gray-500">Zone</p>
                  <p className="font-medium mt-0.5">{selectedItem.zone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Operator</p>
                  <p className="font-medium mt-0.5">{selectedItem.operator}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cost</p>
                  <p className="font-medium mt-0.5">{formatCurrency(selectedItem.cost)}</p>
                </div>
              </div>

              {/* Input Details */}
              <div className="border border-gray-200 rounded p-3">
                <h4 className="text-xs font-semibold mb-2">Input (Before Repacking)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">SKU</p>
                    <p className="font-medium mt-0.5">{selectedItem.inputSKU}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Product</p>
                    <p className="font-medium mt-0.5">{selectedItem.inputProduct}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium mt-0.5">{selectedItem.inputQty} {selectedItem.inputUnit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Units</p>
                    <p className="font-medium mt-0.5">{selectedItem.outputQty} pcs</p>
                  </div>
                </div>
              </div>

              {/* Output Details */}
              <div className="border border-gray-200 rounded p-3">
                <h4 className="text-xs font-semibold mb-2">Output (After Repacking)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">SKU</p>
                    <p className="font-medium mt-0.5">{selectedItem.outputSKU}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Product</p>
                    <p className="font-medium mt-0.5">{selectedItem.outputProduct}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Output Quantity</p>
                    <p className="font-medium mt-0.5">{selectedItem.outputQty} pcs</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Waste/Reject</p>
                    <p className="font-medium mt-0.5 text-red-600">{selectedItem.waste} pcs</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Net Output</p>
                    <p className="font-medium mt-0.5 text-green-600">{selectedItem.netOutput} pcs</p>
                  </div>
                </div>
              </div>

              {/* Batch Info */}
              <div className="border border-gray-200 rounded p-3">
                <h4 className="text-xs font-semibold mb-2">Batch Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Batch Number</p>
                    <p className="font-medium mt-0.5">{selectedItem.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expired Date</p>
                    <p className="font-medium mt-0.5">{selectedItem.expiredDate}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Reason for Repacking</p>
                    <p className="font-medium mt-0.5">{selectedItem.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WMSRepackingApp;