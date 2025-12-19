/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import api from '@/lib/api'; // Sesuaikan dengan path api instance Anda
import Layout from '@/components/layout';

interface InventoryPolicy {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  owner_code: string;
  use_lot_no: boolean;
  use_fifo: boolean;
  use_fefo: boolean;
  use_vas: boolean;
  use_production_date: boolean;
  use_receive_location: boolean;
  show_rec_date: boolean;
  require_expiry_date: boolean;
  require_lot_number: boolean;
  require_scan_pick_location: boolean;
  allow_mixed_lot: boolean;
  allow_negative_stock: boolean;
  validation_sn?: boolean;
}

export default function InventoryPolicyPage() {
  const [policies, setPolicies] = useState<InventoryPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InventoryPolicy | null>(null);

  const [formData, setFormData] = useState({
    owner_code: '',
    use_lot_no: false,
    use_fifo: false,
    use_fefo: false,
    use_vas: false,
    use_production_date: false,
    use_receive_location: false,
    show_rec_date: false,
    require_expiry_date: false,
    require_lot_number: false,
    require_scan_pick_location: false,
    allow_mixed_lot: false,
    allow_negative_stock: false,
    validation_sn: false,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/policies', {
        withCredentials: true,
      });
      if (response.data.success) {
        setPolicies(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory policies:', error);
      alert('Gagal mengambil data inventory policy');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditMode(false);
    setSelectedPolicy(null);
    setFormData({
      owner_code: '',
      use_lot_no: false,
      use_fifo: false,
      use_fefo: false,
      use_vas: false,
      use_production_date: false,
      use_receive_location: false,
      show_rec_date: false,
      require_expiry_date: false,
      require_lot_number: false,
      require_scan_pick_location: false,
      allow_mixed_lot: false,
      allow_negative_stock: false,
      validation_sn: false,
    });
    setShowModal(true);
  };

  const handleEdit = (policy: InventoryPolicy) => {
    setEditMode(true);
    setSelectedPolicy(policy);
    setFormData({
      owner_code: policy.owner_code,
      use_lot_no: policy.use_lot_no,
      use_fifo: policy.use_fifo,
      use_fefo: policy.use_fefo,
      use_vas: policy.use_vas,
      use_production_date: policy.use_production_date,
      use_receive_location: policy.use_receive_location,
      show_rec_date: policy.show_rec_date,
      require_expiry_date: policy.require_expiry_date,
      require_lot_number: policy.require_lot_number,
      require_scan_pick_location: policy.require_scan_pick_location,
      allow_mixed_lot: policy.allow_mixed_lot,
      allow_negative_stock: policy.allow_negative_stock,
      validation_sn: (policy as any).validation_sn || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.owner_code.trim()) {
      alert('Owner Code wajib diisi');
      return;
    }

    setLoading(true);
    try {
      if (editMode && selectedPolicy) {
        const response = await api.put(`/inventory/policies/${selectedPolicy.ID}`, formData, {
          withCredentials: true,
        });
        if (response.data.success) {
          alert('Data berhasil diupdate');
          setShowModal(false);
          fetchPolicies();
        }
      } else {
        const response = await api.post('/inventory/policies', formData, {
          withCredentials: true,
        });
        if (response.data.success) {
          alert('Data successfully saved');
          setShowModal(false);
          fetchPolicies();
        }
      }
    } catch (error: any) {
      console.error('Error saving inventory policy:', error);
      alert(error.response?.data?.message || 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const response = await api.delete(`/inventory/policies/${id}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        alert('Data successfully deleted');
        fetchPolicies();
      }
    } catch (error) {
      console.error('Error deleting inventory policy:', error);
      alert('Failed to delete data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout title="Settings" subTitle="Inventory Policy">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          {/* <h1 className="text-3xl font-bold text-gray-800">Inventory Policy</h1> */}
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            + Add Policy
          </button>
        </div>

        {loading && !showModal ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Settings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Settings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Belum ada data inventory policy
                      </td>
                    </tr>
                  ) : (
                    policies.map((policy) => (
                      <tr key={policy.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{policy.owner_code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {policy.use_lot_no && <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1 mb-1">Lot No</span>}
                            {policy.allow_mixed_lot && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">Mixed Lot</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {policy.use_fifo && <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-1 mb-1">FIFO</span>}
                            {policy.use_fefo && <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded mr-1 mb-1">FEFO</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {policy.require_expiry_date && <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-1 mb-1">Expiry</span>}
                            {policy.require_lot_number && <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1 mb-1">Lot Number</span>}
                            {policy.require_scan_pick_location && <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-1 mb-1">Scan Pick</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {policy.validation_sn && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">SN Validation</span>}
                            {policy.use_vas && <span className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded mr-1 mb-1">VAS</span>}
                            {policy.allow_negative_stock && <span className="inline-block bg-pink-100 text-pink-800 px-2 py-1 rounded mr-1 mb-1">Neg Stock</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(policy)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(policy.ID)}
                            className="text-red-600 hover:text-red-900"
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
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editMode ? 'Edit Inventory Policy' : 'Add Inventory Policy'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.owner_code}
                    onChange={(e) => setFormData({ ...formData, owner_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter owner code"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Lot Management</h3>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_lot_no}
                        onChange={(e) => handleCheckboxChange('use_lot_no', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use Lot Number</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allow_mixed_lot}
                        onChange={(e) => handleCheckboxChange('allow_mixed_lot', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Allow Mixed Lot</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_lot_number}
                        onChange={(e) => handleCheckboxChange('require_lot_number', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Require Lot Number</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Stock Method</h3>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_fifo}
                        onChange={(e) => handleCheckboxChange('use_fifo', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use FIFO (First In First Out)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_fefo}
                        onChange={(e) => handleCheckboxChange('use_fefo', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use FEFO (First Expired First Out)</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Date Management</h3>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_production_date}
                        onChange={(e) => handleCheckboxChange('use_production_date', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use Production Date</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_expiry_date}
                        onChange={(e) => handleCheckboxChange('require_expiry_date', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use Expiry Date</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_rec_date}
                        onChange={(e) => handleCheckboxChange('show_rec_date', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use Receive Date</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Other Settings</h3>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.validation_sn}
                        onChange={(e) => handleCheckboxChange('validation_sn', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Validation SN With Inbound</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_vas}
                        onChange={(e) => handleCheckboxChange('use_vas', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use VAS (Value Added Service)</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.use_receive_location}
                        onChange={(e) => handleCheckboxChange('use_receive_location', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Use Receive Location</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_scan_pick_location}
                        onChange={(e) => handleCheckboxChange('require_scan_pick_location', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Require Scan Pick Location</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allow_negative_stock}
                        onChange={(e) => handleCheckboxChange('allow_negative_stock', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Allow Negative Stock</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : editMode ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}