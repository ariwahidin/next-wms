/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import Select, { StylesConfig } from "react-select";
import api from "@/lib/api";
import Layout from "@/components/layout";
import eventBus from "@/utils/eventBus";

interface Owner {
  ID: number;
  code: string;
  name: string;
  description: string;
}

interface OwnerOption {
  value: string;
  label: string;
}

// Compact react-select styling to match the rest of the form (text-sm, ~36px height)
const selectStyles: StylesConfig<OwnerOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.4)" : "none",
    "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: "0.875rem" }),
  placeholder: (base) => ({ ...base, fontSize: "0.875rem", color: "#9ca3af" }),
  singleValue: (base) => ({ ...base, fontSize: "0.875rem", color: "#111827" }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "#111827",
  }),
  menu: (base) => ({ ...base, fontSize: "0.875rem", zIndex: 20 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "6px" }),
};

interface InventoryPolicy {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  owner_code: string;
  use_lot_no: boolean;
  use_case_no: boolean;
  use_fifo: boolean;
  use_fefo: boolean;
  use_vas: boolean;
  use_production_date: boolean;
  use_receive_location: boolean;
  use_serial_number: boolean;
  use_carton_number: boolean;
  use_case_number: boolean;
  show_rec_date: boolean;
  require_expiry_date: boolean;
  require_lot_number: boolean;
  require_scan_pick_location: boolean;
  allow_mixed_lot: boolean;
  allow_negative_stock: boolean;
  validation_sn?: boolean;
  require_picking_scan?: boolean;
  require_packing_scan?: boolean;
  picking_single_scan?: boolean;
  require_receive_scan?: boolean;
  require_putaway_scan?: boolean;
  validate_receive_scan?: boolean;
  allocation_lot_by_order?: boolean;
  allocation_location_by_order?: boolean;
  picking_with_scanner?: boolean;
  picking_exclude_locations_under_cycle_count?: boolean;
}

type PolicyKey = keyof Omit<
  InventoryPolicy,
  "ID" | "CreatedAt" | "UpdatedAt" | "DeletedAt" | "owner_code"
>;

interface PolicyField {
  key: PolicyKey;
  label: string;
}

interface PolicyGroup {
  title: string;
  fields: PolicyField[];
}

// Same grouping & labels as the form modal below — keep them in sync when adding new fields.
const POLICY_GROUPS: PolicyGroup[] = [
  {
    title: "Inventory",
    fields: [
      { key: "use_case_no", label: "Use Case Number" },
      { key: "use_lot_no", label: "Use Lot Number" },
      { key: "allow_mixed_lot", label: "Allow Mixed Lot" },
      { key: "require_lot_number", label: "Require Lot Number" },
      { key: "use_serial_number", label: "Use Serial Number" },
      { key: "use_carton_number", label: "Use Carton Number" },
      { key: "use_case_number", label: "Use Case Number (Inventory)" },
      { key: "use_production_date", label: "Production Date" },
      { key: "require_expiry_date", label: "Expiry Date" },
      { key: "show_rec_date", label: "Receive Date" },
      { key: "allow_negative_stock", label: "Allow Negative Stock" },
    ],
  },
  {
    title: "Allocation Method",
    fields: [
      { key: "use_fifo", label: "Use FIFO" },
      { key: "use_fefo", label: "Use FEFO" },
    ],
  },
  {
    title: "Inbound Rule",
    fields: [
      { key: "use_receive_location", label: "Receive Location" },
      { key: "require_receive_scan", label: "Receive Scan" },
      { key: "validate_receive_scan", label: "Validate Receive Scan" },
      { key: "require_putaway_scan", label: "Putaway Scan" },
    ],
  },
  {
    title: "Outbound Rule",
    fields: [
      { key: "picking_with_scanner", label: "Picking With Scanner" },
      { key: "require_packing_scan", label: "Packing Scan" },
      { key: "require_picking_scan", label: "Picking Required" },
      { key: "picking_single_scan", label: "Single Scan" },
      { key: "allocation_lot_by_order", label: "Lot by Order" },
      {
        key: "allocation_location_by_order",
        label: "Allocation Location by Order",
      },
      { key: "validation_sn", label: "SN Validation" },
      { key: "use_vas", label: "VAS" },
      { key: "require_scan_pick_location", label: "Scan Pick Location" },
    ],
  },
  {
    title: "Cycle Count",
    fields: [
      {
        key: "picking_exclude_locations_under_cycle_count",
        label: "Cannot putaway, picking, transfer under cycle count",
      },
    ],
  },
];

function PolicyGroupCell({
  policy,
  group,
}: {
  policy: InventoryPolicy;
  group: PolicyGroup;
}) {
  const activeFields = group.fields.filter((f) => Boolean(policy[f.key]));

  if (activeFields.length === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  return (
    <ul className="space-y-1">
      {activeFields.map((f) => (
        <li
          key={f.key}
          className="flex items-start gap-1.5 text-xs text-gray-700"
        >
          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
          <span>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function InventoryPolicyPage() {
  const [policies, setPolicies] = useState<InventoryPolicy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<InventoryPolicy[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InventoryPolicy | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const [formData, setFormData] = useState({
    owner_code: "",
    use_lot_no: false,
    use_case_no: false,
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
    require_picking_scan: false,
    require_packing_scan: false,
    picking_single_scan: false,
    require_receive_scan: false,
    require_putaway_scan: false,
    validate_receive_scan: false,
    allocation_lot_by_order: false,
    allocation_location_by_order: false,
    picking_with_scanner: false,
    picking_exclude_locations_under_cycle_count: false,
    use_serial_number: false,
    use_carton_number: false,
    use_case_number: false,
  });

  const ownerOptions: OwnerOption[] = owners.map((o) => ({
    value: o.code,
    label: `${o.code} - ${o.name}`,
  }));

  const selectedOwnerOption =
    ownerOptions.find((opt) => opt.value === formData.owner_code) || null;

  useEffect(() => {
    fetchPolicies();
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const response = await api.get("/owners");
      if (response.data.success) {
        setOwners(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPolicies(policies);
    } else {
      const filtered = policies.filter((policy) =>
        policy.owner_code.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredPolicies(filtered);
    }
  }, [searchQuery, policies]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/policies");
      if (response.data.success) {
        setPolicies(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching inventory policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditMode(false);
    setSelectedPolicy(null);
    setFormData({
      owner_code: "",
      use_lot_no: false,
      use_case_no: false,
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
      require_picking_scan: false,
      require_packing_scan: false,
      picking_single_scan: false,
      require_receive_scan: false,
      require_putaway_scan: false,
      validate_receive_scan: false,
      allocation_lot_by_order: false,
      allocation_location_by_order: false,
      picking_with_scanner: false,
      picking_exclude_locations_under_cycle_count: false,
      use_serial_number: false,
      use_carton_number: false,
      use_case_number: false,
    });
    setShowModal(true);
  };

  const handleEdit = (policy: InventoryPolicy) => {
    setEditMode(true);
    setSelectedPolicy(policy);
    setFormData({
      owner_code: policy.owner_code,
      use_lot_no: policy.use_lot_no,
      use_case_no: policy.use_case_no,
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
      require_picking_scan: (policy as any).require_picking_scan || false,
      require_packing_scan: (policy as any).require_packing_scan || false,
      picking_single_scan: (policy as any).picking_single_scan || false,
      require_receive_scan: (policy as any).require_receive_scan || false,
      require_putaway_scan: (policy as any).require_putaway_scan || false,
      validate_receive_scan: (policy as any).validate_receive_scan || false,
      allocation_lot_by_order: (policy as any).allocation_lot_by_order || false,
      allocation_location_by_order:
        (policy as any).allocation_location_by_order || false,
      picking_with_scanner: (policy as any).picking_with_scanner || false,
      picking_exclude_locations_under_cycle_count:
        (policy as any).picking_exclude_locations_under_cycle_count || false,
      use_serial_number: (policy as any).use_serial_number || false,
      use_carton_number: (policy as any).use_carton_number || false,
      use_case_number: (policy as any).use_case_number || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.owner_code.trim()) {
      eventBus.emit("showAlert", {
        title: "Error",
        description: "Owner Code is required",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      if (editMode && selectedPolicy) {
        const response = await api.put(
          `/inventory/policies/${selectedPolicy.ID}`,
          formData,
        );
        if (response.data.success) {
          eventBus.emit("showAlert", {
            title: "Success",
            description: "Policy updated successfully",
            type: "success",
          });
          setShowModal(false);
          fetchPolicies();
        }
      } else {
        const response = await api.post("/inventory/policies", formData);
        if (response.data.success) {
          eventBus.emit("showAlert", {
            title: "Success",
            description: "Policy created successfully",
            type: "success",
          });
          setShowModal(false);
          fetchPolicies();
        }
      }
    } catch (error: any) {
      console.error("Error saving inventory policy:", error);
      alert(error.response?.data?.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this policy?")) return;

    setLoading(true);
    try {
      const response = await api.delete(`/inventory/policies/${id}`);
      if (response.data.success) {
        eventBus.emit("showAlert", {
          title: "Success",
          description: "Policy deleted successfully",
          type: "success",
        });
        fetchPolicies();
      }
    } catch (error) {
      console.error("Error deleting inventory policy:", error);
      alert("Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Layout title="Settings" subTitle="Inventory Policy">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Inventory Policy
            </h1>
            <p className="text-sm text-gray-500">
              Manage inventory policies and configurations
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by owner code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Policy
            </button>
          </div>

          {/* Table */}
          {loading && !showModal ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
                <p className="mt-3 text-sm text-gray-500">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                        Owner Code
                      </th>
                      {POLICY_GROUPS.map((group) => (
                        <th
                          key={group.title}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase align-top min-w-[180px]"
                        >
                          {group.title}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPolicies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={POLICY_GROUPS.length + 2}
                          className="px-4 py-12 text-center text-sm text-gray-500"
                        >
                          {searchQuery
                            ? "No policies found"
                            : "No policies yet"}
                        </td>
                      </tr>
                    ) : (
                      filteredPolicies.map((policy) => (
                        <tr
                          key={policy.ID}
                          className="hover:bg-gray-50 transition align-top"
                        >
                          <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white">
                            <span className="text-sm font-medium text-gray-900">
                              {policy.owner_code}
                            </span>
                          </td>
                          {POLICY_GROUPS.map((group) => (
                            <td
                              key={group.title}
                              className="px-4 py-3 align-top"
                            >
                              <PolicyGroupCell policy={policy} group={group} />
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(policy)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(policy.ID)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editMode ? "Edit Policy" : "Add Policy"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure inventory policy settings
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Owner Code <span className="text-red-500">*</span>
                    </label>
                    <Select<OwnerOption, false>
                      options={ownerOptions}
                      value={selectedOwnerOption}
                      onChange={(opt) =>
                        setFormData({
                          ...formData,
                          owner_code: opt?.value || "",
                        })
                      }
                      isLoading={loadingOwners}
                      isDisabled={editMode}
                      isClearable
                      placeholder="Select owner..."
                      noOptionsMessage={() => "No owners found"}
                      styles={selectStyles}
                      classNamePrefix="rs"
                    />
                    {editMode && (
                      <p className="text-xs text-gray-400 mt-1">
                        Owner cannot be changed after the policy is created.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        Inventory
                      </h3>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_case_no}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_case_no",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use Case Number
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_lot_no}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_lot_no",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use Lot Number
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.allow_mixed_lot}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "allow_mixed_lot",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Allow Mixed Lot
                          </span>
                          <span className="text-xs text-gray-500">
                            (Allow multiple lot numbers for the same item in the
                            location, pallet id)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_lot_number}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_lot_number",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Require Lot Number
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require lot number when adding inventory)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_serial_number}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_serial_number",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use Serial Number
                          </span>
                          <span className="text-xs text-gray-500">
                            (Save serial number in the inventory)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_carton_number}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_carton_number",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use Carton Number
                          </span>
                          <span className="text-xs text-gray-500">
                            (Save carton number in the inventory)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_case_number}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_case_number",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use Case Number
                          </span>
                          <span className="text-xs text-gray-500">
                            (Save case number in the inventory)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_production_date}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_production_date",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Production Date
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_expiry_date}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_expiry_date",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Expiry Date
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.show_rec_date}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "show_rec_date",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Receive Date
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.allow_negative_stock}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "allow_negative_stock",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Allow Negative Stock
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        Allocation Method
                      </h3>
                      <p className="text-xs text-gray-400 mb-2">Choose one</p>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="allocation_method"
                            checked={formData.use_fifo}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                use_fifo: true,
                                use_fefo: false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use FIFO
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="allocation_method"
                            checked={formData.use_fefo}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                use_fefo: true,
                                use_fifo: false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Use FEFO
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="allocation_method"
                            checked={!formData.use_fifo && !formData.use_fefo}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                use_fifo: false,
                                use_fefo: false,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            None
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        Inbound Rule
                      </h3>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_receive_location}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "use_receive_location",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Receive Location
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require location when create inbound planning)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_receive_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_receive_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Receive Scan
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require checking process using scanner device)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.validate_receive_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "validate_receive_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Validate Receive Scan
                          </span>
                          <span className="text-xs text-gray-500">
                            (Validate checking proccess using scanner device
                            with inbound planning (Prod Date, Expiry Date, Lot
                            Number, Case Number))
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_putaway_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_putaway_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Putaway Scan
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require putaway process using scanner device)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        Outbound Rule
                      </h3>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.picking_with_scanner}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "picking_with_scanner",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Picking With Scanner
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require picking using scanner device)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_packing_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_packing_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Packing Scan
                          </span>
                          <span className="text-xs text-gray-500">
                            (Require packing using scanner device)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_picking_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_picking_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Picking Required
                          </span>
                          <span className="text-xs text-gray-500">
                            (Cannot complete picking without scanning)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.picking_single_scan}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "picking_single_scan",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Single Scan
                          </span>
                          <span className="text-xs text-gray-500">
                            (Scan picking one by one, not key in)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.allocation_lot_by_order}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "allocation_lot_by_order",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Lot by Order
                          </span>
                          <span className="text-xs text-gray-500">
                            (Allocation lot by order)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.allocation_location_by_order}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "allocation_location_by_order",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Allocation Location by Order
                          </span>
                          <span className="text-xs text-gray-500">
                            (Allocation location by order)
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.validation_sn}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "validation_sn",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            SN Validation
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.use_vas}
                            onChange={(e) =>
                              handleCheckboxChange("use_vas", e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            VAS
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.require_scan_pick_location}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "require_scan_pick_location",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Scan Pick Location
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
                        Cycle Count
                      </h3>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={
                              formData.picking_exclude_locations_under_cycle_count
                            }
                            onChange={(e) =>
                              handleCheckboxChange(
                                "picking_exclude_locations_under_cycle_count",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Cannot putaway, picking, and transfer in locations
                            under cycle count
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : editMode ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}