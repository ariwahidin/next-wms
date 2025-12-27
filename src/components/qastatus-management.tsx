"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
    Search,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    ChevronRight,
    X,
    ArrowLeft,
    Edit2,
    Trash2,
    Plus,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface Inventory {
    id: number
    inventory_number: number
    owner_code: string
    whs_code: string
    division_code: string
    lot_number: string
    pallet: string
    location: string
    item_code: string
    barcode: string
    qa_status: "A" | "Q" | "R" | "B" | "D" | "S"
    uom: string
    qty_origin: number
    qty_onhand: number
    qty_available: number
    rec_date: string
    prod_date: string
    exp_date: string
}

interface QAStatusChangeRequest {
    id: number
    inventory_id: number
    inventory_number: number
    item_code: string
    lot_number: string
    location: string
    current_status: string
    requested_status: string
    quantity: number
    reason_code: string
    reason_notes: string
    requested_by: string
    requested_date: string
    approval_status: "PENDING" | "APPROVED" | "REJECTED"
    approved_by?: string
    approved_date?: string
    approval_notes?: string
}

interface ReasonMaster {
    code: string
    description: string
    from_status: string
    to_status: string
    requires_approval: boolean
}

// ============================================================================
// DUMMY DATA
// ============================================================================

const inventoryData: Inventory[] = [
    {
        id: 1,
        inventory_number: 1001,
        owner_code: "OWN001",
        whs_code: "WH01",
        division_code: "DIV01",
        lot_number: "LOT2024001",
        pallet: "PLT-A-001",
        location: "A-01-01",
        item_code: "ITEM001",
        barcode: "8991234567890",
        qa_status: "R",
        uom: "PCS",
        qty_origin: 100,
        qty_onhand: 100,
        qty_available: 0,
        rec_date: "2024-12-01",
        prod_date: "2024-11-15",
        exp_date: "2025-11-15",
    },
    {
        id: 2,
        inventory_number: 1002,
        owner_code: "OWN001",
        whs_code: "WH01",
        division_code: "DIV01",
        lot_number: "LOT2024002",
        pallet: "PLT-A-002",
        location: "A-01-02",
        item_code: "ITEM002",
        barcode: "8991234567891",
        qa_status: "Q",
        uom: "BOX",
        qty_origin: 50,
        qty_onhand: 50,
        qty_available: 0,
        rec_date: "2024-12-10",
        prod_date: "2024-12-01",
        exp_date: "2025-12-01",
    },
    {
        id: 3,
        inventory_number: 1003,
        owner_code: "OWN001",
        whs_code: "WH01",
        division_code: "DIV01",
        lot_number: "LOT2024003",
        pallet: "PLT-B-001",
        location: "B-02-01",
        item_code: "ITEM003",
        barcode: "8991234567892",
        qa_status: "A",
        uom: "PCS",
        qty_origin: 200,
        qty_onhand: 180,
        qty_available: 180,
        rec_date: "2024-12-05",
        prod_date: "2024-11-20",
        exp_date: "2025-11-20",
    },
    {
        id: 4,
        inventory_number: 1004,
        owner_code: "OWN002",
        whs_code: "WH01",
        division_code: "DIV02",
        lot_number: "LOT2024004",
        pallet: "PLT-B-002",
        location: "B-02-02",
        item_code: "ITEM001",
        barcode: "8991234567893",
        qa_status: "D",
        uom: "PCS",
        qty_origin: 75,
        qty_onhand: 75,
        qty_available: 0,
        rec_date: "2024-12-08",
        prod_date: "2024-11-25",
        exp_date: "2025-11-25",
    },
    {
        id: 5,
        inventory_number: 1005,
        owner_code: "OWN001",
        whs_code: "WH01",
        division_code: "DIV01",
        lot_number: "LOT2024005",
        pallet: "PLT-C-001",
        location: "C-03-01",
        item_code: "ITEM004",
        barcode: "8991234567894",
        qa_status: "B",
        uom: "BOX",
        qty_origin: 30,
        qty_onhand: 30,
        qty_available: 0,
        rec_date: "2024-12-12",
        prod_date: "2024-12-05",
        exp_date: "2025-12-05",
    },
]

const reasonMasterData: ReasonMaster[] = [
    {
        code: "REINSP_PASS",
        description: "Re-inspection Passed",
        from_status: "R",
        to_status: "A",
        requires_approval: true,
    },
    { code: "REWORK_OK", description: "After Rework/Repair", from_status: "R", to_status: "A", requires_approval: true },
    {
        code: "SORTING",
        description: "Sorting/Segregation Result",
        from_status: "R",
        to_status: "A",
        requires_approval: true,
    },
    {
        code: "MGMT_OVERRIDE",
        description: "Management Override",
        from_status: "R",
        to_status: "A",
        requires_approval: true,
    },
    {
        code: "INSPECTOR_ERROR",
        description: "Inspector Error Correction",
        from_status: "R",
        to_status: "A",
        requires_approval: true,
    },
    { code: "REPAIR_DONE", description: "Repair Completed", from_status: "D", to_status: "A", requires_approval: true },
    { code: "QA_PASS", description: "QA Inspection Passed", from_status: "Q", to_status: "A", requires_approval: false },
    { code: "QA_FAIL", description: "QA Inspection Failed", from_status: "Q", to_status: "R", requires_approval: false },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStatusConfig = (status: string) => {
    const configs = {
        A: {
            label: "Available",
            color: "bg-green-100 text-green-800",
            icon: CheckCircle,
            bgColor: "bg-green-100",
            textColor: "text-green-800",
        },
        Q: {
            label: "Quarantine",
            color: "bg-yellow-100 text-yellow-800",
            icon: Clock,
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-800",
        },
        R: {
            label: "Rejected",
            color: "bg-red-100 text-red-800",
            icon: XCircle,
            bgColor: "bg-red-100",
            textColor: "text-red-800",
        },
        B: {
            label: "Blocked",
            color: "bg-orange-100 text-orange-800",
            icon: AlertTriangle,
            bgColor: "bg-orange-100",
            textColor: "text-orange-800",
        },
        D: {
            label: "Damaged",
            color: "bg-purple-100 text-purple-800",
            icon: AlertTriangle,
            bgColor: "bg-purple-100",
            textColor: "text-purple-800",
        },
        S: {
            label: "Scrap",
            color: "bg-gray-100 text-gray-800",
            icon: XCircle,
            bgColor: "bg-gray-100",
            textColor: "text-gray-800",
        },
    }
    return configs[status as keyof typeof configs] || configs.Q
}

const getApprovalStatusConfig = (status: string) => {
    const configs = {
        PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
        REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
    }
    return configs[status as keyof typeof configs] || configs.PENDING
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {children}
    </span>
)

const Button = ({
    children,
    onClick,
    variant = "primary",
    size = "md",
    disabled = false,
    className = "",
}: {
    children: React.ReactNode
    onClick?: () => void
    variant?: "primary" | "secondary" | "success" | "danger" | "ghost"
    size?: "sm" | "md" | "lg"
    disabled?: boolean
    className?: string
}) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors"
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
        success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",
        danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    }
    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? "cursor-not-allowed" : ""} ${className}`}
        >
            {children}
        </button>
    )
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</div>
)

const Input = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
}: {
    label?: string
    type?: string
    value: string | number
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    required?: boolean
    disabled?: boolean
}) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
    </div>
)

const Select = ({
    label,
    value,
    onChange,
    options,
    required = false,
    disabled = false,
}: {
    label?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
    required?: boolean
    disabled?: boolean
}) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <select
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        >
            <option value="">Select...</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
)

const Textarea = ({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
    required = false,
}: {
    label?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    rows?: number
    required?: boolean
}) => (
    <div className="space-y-1">
        {label && (
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>
)

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function QAStatusManagement() {
    const [activeView, setActiveView] = useState<"inventory" | "requests" | "approval" | "new-request" | "edit-request">(
        "inventory",
    )
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<QAStatusChangeRequest | null>(null)

    const [showInventoryModal, setShowInventoryModal] = useState(false)
    const [inventorySearch, setInventorySearch] = useState("")

    const [requests, setRequests] = useState<QAStatusChangeRequest[]>(
        (() => {
            return [
                {
                    id: 1,
                    inventory_id: 1,
                    inventory_number: 1001,
                    item_code: "ITEM001",
                    lot_number: "LOT2024001",
                    location: "A-01-01",
                    current_status: "R",
                    requested_status: "A",
                    quantity: 80,
                    reason_code: "REINSP_PASS",
                    reason_notes: "Setelah inspeksi ulang, barang memenuhi standar kualitas",
                    requested_by: "John Doe",
                    requested_date: "2024-12-20",
                    approval_status: "PENDING",
                },
                {
                    id: 2,
                    inventory_id: 4,
                    inventory_number: 1004,
                    item_code: "ITEM001",
                    lot_number: "LOT2024004",
                    location: "B-02-02",
                    current_status: "D",
                    requested_status: "A",
                    quantity: 50,
                    reason_code: "REPAIR_DONE",
                    reason_notes: "Barang sudah diperbaiki dan lolos QA",
                    requested_by: "Jane Smith",
                    requested_date: "2024-12-21",
                    approval_status: "PENDING",
                },
                {
                    id: 3,
                    inventory_id: 2,
                    inventory_number: 1002,
                    item_code: "ITEM002",
                    lot_number: "LOT2024002",
                    location: "A-01-02",
                    current_status: "Q",
                    requested_status: "A",
                    quantity: 50,
                    reason_code: "QA_PASS",
                    reason_notes: "Lolos inspeksi QA standar",
                    requested_by: "Mike Johnson",
                    requested_date: "2024-12-19",
                    approval_status: "APPROVED",
                    approved_by: "QA Manager",
                    approved_date: "2024-12-20",
                    approval_notes: "Approved - semua parameter memenuhi standar",
                },
            ]
        })(),
    )

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [formData, setFormData] = useState({
        id: 0,
        inventory_id: 0,
        quantity: 0,
        requested_status: "",
        reason_code: "",
        reason_notes: "",
        requested_by: "",
    })

    const [approvalFormData, setApprovalFormData] = useState({
        approval_notes: "",
    })

    // Filtered inventory
    const filteredInventory = useMemo(() => {
        return inventoryData.filter((inv) => {
            const matchesSearch =
                inv.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.location.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = !statusFilter || inv.qa_status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchTerm, statusFilter])

    const handleCreateRequest = () => {
        if (!selectedInventory) return
        setFormData({
            id: 0,
            inventory_id: selectedInventory.id,
            quantity: selectedInventory.qty_onhand,
            requested_status: "",
            reason_code: "",
            reason_notes: "",
            requested_by: "",
        })
        setSelectedInventory(null)
        setActiveView("new-request")
    }

    const handleSubmitRequest = () => {
        if (!formData.inventory_id || !formData.requested_status || !formData.reason_code || !formData.requested_by) {
            alert("Please fill in all required fields!")
            return
        }

        const inventory = inventoryData.find((inv) => inv.id === formData.inventory_id)
        if (!inventory) return

        if (formData.id === 0) {
            // CREATE
            const newRequest: QAStatusChangeRequest = {
                id: Math.max(...requests.map((r) => r.id), 0) + 1,
                inventory_id: formData.inventory_id,
                inventory_number: inventory.inventory_number,
                item_code: inventory.item_code,
                lot_number: inventory.lot_number,
                location: inventory.location,
                current_status: inventory.qa_status,
                requested_status: formData.requested_status,
                quantity: formData.quantity,
                reason_code: formData.reason_code,
                reason_notes: formData.reason_notes,
                requested_by: formData.requested_by,
                requested_date: new Date().toISOString().split("T")[0],
                approval_status: "PENDING",
            }
            setRequests([...requests, newRequest])
            alert("Request created successfully!")
        } else {
            // UPDATE
            setRequests(
                requests.map((r) =>
                    r.id === formData.id
                        ? {
                            ...r,
                            requested_status: formData.requested_status,
                            quantity: formData.quantity,
                            reason_code: formData.reason_code,
                            reason_notes: formData.reason_notes,
                            requested_by: formData.requested_by,
                        }
                        : r,
                ),
            )
            alert("Request updated successfully!")
        }

        resetForm()
        setActiveView("requests")
    }

    const handleEditRequest = (request: QAStatusChangeRequest) => {
        setFormData({
            id: request.id,
            inventory_id: request.inventory_id,
            quantity: request.quantity,
            requested_status: request.requested_status,
            reason_code: request.reason_code,
            reason_notes: request.reason_notes,
            requested_by: request.requested_by,
        })
        setActiveView("edit-request")
    }

    const handleDeleteRequest = (id: number) => {
        if (confirm("Are you sure you want to delete this request?")) {
            setRequests(requests.filter((r) => r.id !== id))
            alert("Request deleted successfully!")
        }
    }

    const handleApprove = (request: QAStatusChangeRequest) => {
        if (!approvalFormData.approval_notes) {
            alert("Please enter approval notes!")
            return
        }

        setRequests(
            requests.map((r) =>
                r.id === request.id
                    ? {
                        ...r,
                        approval_status: "APPROVED",
                        approved_by: "Current User",
                        approved_date: new Date().toISOString().split("T")[0],
                        approval_notes: approvalFormData.approval_notes,
                    }
                    : r,
            ),
        )
        alert(`Request #${request.id} approved!`)
        resetApprovalForm()
        setSelectedRequest(null)
    }

    const handleReject = (request: QAStatusChangeRequest) => {
        if (!approvalFormData.approval_notes) {
            alert("Please enter rejection reason!")
            return
        }

        setRequests(
            requests.map((r) =>
                r.id === request.id
                    ? {
                        ...r,
                        approval_status: "REJECTED",
                        approved_by: "Current User",
                        approved_date: new Date().toISOString().split("T")[0],
                        approval_notes: approvalFormData.approval_notes,
                    }
                    : r,
            ),
        )
        alert(`Request #${request.id} rejected!`)
        resetApprovalForm()
        setSelectedRequest(null)
    }

    const resetForm = () => {
        setFormData({
            id: 0,
            inventory_id: 0,
            quantity: 0,
            requested_status: "",
            reason_code: "",
            reason_notes: "",
            requested_by: "",
        })
    }

    const resetApprovalForm = () => {
        setApprovalFormData({ approval_notes: "" })
    }

    // ============================================================================
    // INVENTORY LIST VIEW
    // ============================================================================

    const InventoryListView = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by item code, lot number, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: "", label: "All Status" },
                            { value: "A", label: "Available" },
                            { value: "Q", label: "Quarantine" },
                            { value: "R", label: "Rejected" },
                            { value: "B", label: "Blocked" },
                            { value: "D", label: "Damaged" },
                        ]}
                    />
                </div>
            </Card>

            <div className="grid gap-4">
                {filteredInventory.map((inv) => {
                    const statusConfig = getStatusConfig(inv.qa_status)
                    const StatusIcon = statusConfig.icon

                    return (
                        <Card
                            key={inv.id}
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                            // onClick={() => setSelectedInventory(inv)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-gray-400" />
                                        <h3 className="font-semibold text-gray-900">{inv.item_code}</h3>
                                        <Badge className={statusConfig.color}>
                                            <StatusIcon className="w-3 h-3 mr-1" />
                                            {statusConfig.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Lot Number:</span>
                                            <p className="font-medium">{inv.lot_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Location:</span>
                                            <p className="font-medium">{inv.location}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Qty On Hand:</span>
                                            <p className="font-medium">
                                                {inv.qty_onhand} {inv.uom}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Qty Available:</span>
                                            <p className="font-medium">
                                                {inv.qty_available} {inv.uom}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )

    // ============================================================================
    // INVENTORY DETAIL MODAL
    // ============================================================================

    const InventoryDetailModal = ({ inventory }: { inventory: Inventory }) => {
        const statusConfig = getStatusConfig(inventory.qa_status)
        const StatusIcon = statusConfig.icon

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Inventory Detail</h2>
                                <p className="text-sm text-gray-500 mt-1">#{inventory.inventory_number}</p>
                            </div>
                            <button onClick={() => setSelectedInventory(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Item Code</label>
                                <p className="font-medium">{inventory.item_code}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">QA Status</label>
                                <div className="mt-1">
                                    <Badge className={statusConfig.color}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Lot Number</label>
                                <p className="font-medium">{inventory.lot_number}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Location</label>
                                <p className="font-medium">{inventory.location}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Barcode</label>
                                <p className="font-medium">{inventory.barcode}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">UOM</label>
                                <p className="font-medium">{inventory.uom}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Qty Origin</label>
                                <p className="font-medium">{inventory.qty_origin}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Qty On Hand</label>
                                <p className="font-medium">{inventory.qty_onhand}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Qty Available</label>
                                <p className="font-medium">{inventory.qty_available}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Received Date</label>
                                <p className="font-medium">{inventory.rec_date}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Production Date</label>
                                <p className="font-medium">{inventory.prod_date}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Expiration Date</label>
                                <p className="font-medium">{inventory.exp_date}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                            <Button onClick={() => setSelectedInventory(null)} variant="secondary">
                                Close
                            </Button>
                            <Button onClick={handleCreateRequest} variant="primary">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Request
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    // ============================================================================
    // NEW/EDIT REQUEST FORM VIEW
    // ============================================================================

    const InventorySelectionModal = () => {
        const filteredInventory = inventoryData.filter(
            (inv) =>
                inv.item_code.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                inv.lot_number.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                inv.location.toLowerCase().includes(inventorySearch.toLowerCase()),
        )

        return (
            <div
                className={`fixed inset-0 ${showInventoryModal ? "block" : "hidden"} bg-black bg-opacity-50 z-50 flex items-center justify-center`}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-96 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Select Inventory Item</h3>
                        <button
                            onClick={() => {
                                setShowInventoryModal(false)
                                setInventorySearch("")
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4 border-b">
                        <input
                            type="text"
                            placeholder="Search by item code, lot number, or location..."
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2 text-left">Item Code</th>
                                    <th className="px-4 py-2 text-left">Lot Number</th>
                                    <th className="px-4 py-2 text-left">Location</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length > 0 ? (
                                    filteredInventory.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    inventory_id: inv.id,
                                                    quantity: inv.qty_onhand,
                                                })
                                                setShowInventoryModal(false)
                                                setInventorySearch("")
                                            }}
                                            className="border-b hover:bg-blue-50 cursor-pointer"
                                        >
                                            <td className="px-4 py-2 font-medium">{inv.item_code}</td>
                                            <td className="px-4 py-2">{inv.lot_number}</td>
                                            <td className="px-4 py-2">{inv.location}</td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(inv.qa_status).bgColor} ${getStatusConfig(inv.qa_status).textColor}`}
                                                >
                                                    {getStatusConfig(inv.qa_status).label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">{inv.qty_onhand}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            No inventory items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    const RequestFormView = ({ isEdit = false }) => {
        const inventory = inventoryData.find((inv) => inv.id === formData.inventory_id)
        const reasonOptions = inventory
            ? reasonMasterData
                .filter((r) => r.from_status === inventory.qa_status)
                .map((r) => ({ value: r.code, label: r.description }))
            : []

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            resetForm()
                            setActiveView("requests")
                        }}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEdit ? "Edit QA Status Change Request" : "Create QA Status Change Request"}
                    </h2>
                </div>

                <Card className="p-6">
                    <div className="space-y-6">
                        {/* Item Selection */}
                        {!isEdit && (
                            <div>
                                <button
                                    onClick={() => setShowInventoryModal(true)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-gray-700"
                                >
                                    Choose Item
                                    {/* {inventory ? `${inventory.item_code} - Lot ${inventory.lot_number}` : "Choose Item"} */}
                                </button>
                            </div>
                        )}

                        {/* Inventory Info (Read-only) */}
                        {inventory && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-4">Inventory Information</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Item Code:</span>
                                        <p className="font-medium">{inventory.item_code}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Current Status:</span>
                                        <p className="font-medium">{getStatusConfig(inventory.qa_status).label}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Lot Number:</span>
                                        <p className="font-medium">{inventory.lot_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Location:</span>
                                        <p className="font-medium">{inventory.location}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <Select
                                label="Requested Status"
                                required
                                value={formData.requested_status}
                                onChange={(e) => setFormData({ ...formData, requested_status: e.target.value })}
                                options={[
                                    { value: "A", label: "Available" },
                                    { value: "Q", label: "Quarantine" },
                                    { value: "R", label: "Rejected" },
                                    { value: "B", label: "Blocked" },
                                    { value: "D", label: "Damaged" },
                                    { value: "S", label: "Scrap" },
                                ]}
                            />

                            <Select
                                label="Reason Code"
                                required
                                value={formData.reason_code}
                                onChange={(e) => setFormData({ ...formData, reason_code: e.target.value })}
                                options={reasonOptions.length > 0 ? reasonOptions : [{ value: "", label: "No reason codes available" }]}
                            />

                            <Input
                                label="Quantity"
                                type="number"
                                required
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
                                placeholder="Enter quantity"
                            />

                            <Input
                                label="Requested By"
                                required
                                value={formData.requested_by}
                                onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                                placeholder="Enter your name"
                            />

                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Additional notes (optional)"
                                value={formData.reason_notes}
                                onChange={(e) => setFormData({ ...formData, reason_notes: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleSubmitRequest}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                {isEdit ? "Update Request" : "Create Request"}
                            </button>
                            <button
                                onClick={() => {
                                    resetForm()
                                    setActiveView("requests")
                                }}
                                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    // ============================================================================
    // REQUESTS LIST VIEW
    // ============================================================================

    const RequestsListView = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">QA Status Change Requests</h2>
                <Button
                    onClick={() => {
                        resetForm()
                        setActiveView("new-request")
                    }}
                    variant="primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                </Button>
            </div>

            {requests.length === 0 ? (
                <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No requests found</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => {
                        const approvalConfig = getApprovalStatusConfig(request.approval_status)
                        return (
                            <Card key={request.id} className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">Request #{request.id}</h3>
                                                <Badge className={approvalConfig.color}>{approvalConfig.label}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {request.item_code} - {request.lot_number}
                                            </p>
                                        </div>
                                        {request.approval_status === "PENDING" && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditRequest(request)}
                                                    className="text-blue-600 hover:text-blue-800 p-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="text-red-600 hover:text-red-800 p-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Current Status:</span>
                                            <p className="font-medium">{getStatusConfig(request.current_status).label}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Requested Status:</span>
                                            <p className="font-medium">{getStatusConfig(request.requested_status).label}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Quantity:</span>
                                            <p className="font-medium">{request.quantity}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Requested Date:</span>
                                            <p className="font-medium">{request.requested_date}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                        <span className="text-gray-500">Reason: </span>
                                        <span className="font-medium">{request.reason_notes}</span>
                                    </div>

                                    {request.approval_status === "PENDING" && (
                                        <Button
                                            onClick={() => {
                                                setSelectedRequest(request)
                                                setActiveView("approval")
                                            }}
                                            variant="primary"
                                            className="w-full"
                                        >
                                            Review Approval
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )

    // ============================================================================
    // APPROVAL VIEW
    // ============================================================================

    const ApprovalView = ({ request }: { request: QAStatusChangeRequest }) => {
        const approvalConfig = getApprovalStatusConfig(request.approval_status)
        const currentStatusConfig = getStatusConfig(request.current_status)
        const requestedStatusConfig = getStatusConfig(request.requested_status)

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSelectedRequest(null)
                            setActiveView("requests")
                            resetApprovalForm()
                        }}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Review Request</h2>
                </div>

                <Card className="p-6">
                    <div className="space-y-6">
                        {/* Header with Status */}
                        <div className="flex items-start justify-between pb-4 border-b">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Request #{request.id}</h3>
                                <p className="text-sm text-gray-500">
                                    {request.requested_by} - {request.requested_date}
                                </p>
                            </div>
                            <Badge className={approvalConfig.color}>{approvalConfig.label}</Badge>
                        </div>

                        {/* Request Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Item Code</label>
                                <p className="font-medium">{request.item_code}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Lot Number</label>
                                <p className="font-medium">{request.lot_number}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Location</label>
                                <p className="font-medium">{request.location}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Quantity</label>
                                <p className="font-medium">{request.quantity}</p>
                            </div>
                        </div>

                        {/* Status Change */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Status Change</p>
                            <div className="flex items-center gap-3">
                                <Badge className={currentStatusConfig.color}>{currentStatusConfig.label}</Badge>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <Badge className={requestedStatusConfig.color}>{requestedStatusConfig.label}</Badge>
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-sm text-gray-500 block mb-2">Reason</label>
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-700">{request.reason_notes}</p>
                            </div>
                        </div>

                        {/* Approval Notes Input */}
                        {request.approval_status === "PENDING" && (
                            <Textarea
                                label="Approval Notes"
                                required
                                value={approvalFormData.approval_notes}
                                onChange={(e) => setApprovalFormData({ approval_notes: e.target.value })}
                                placeholder="Enter your approval decision notes..."
                                rows={4}
                            />
                        )}

                        {/* Approval Info (if already approved/rejected) */}
                        {request.approval_status !== "PENDING" && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                    <label className="text-sm text-gray-500">Approved By</label>
                                    <p className="font-medium">{request.approved_by}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Approval Date</label>
                                    <p className="font-medium">{request.approved_date}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Notes</label>
                                    <p className="text-sm text-gray-700">{request.approval_notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {request.approval_status === "PENDING" && (
                            <div className="flex gap-2 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        setSelectedRequest(null)
                                        setActiveView("requests")
                                        resetApprovalForm()
                                    }}
                                    variant="secondary"
                                >
                                    Close
                                </Button>
                                <Button onClick={() => handleReject(request)} variant="danger">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button onClick={() => handleApprove(request)} variant="success">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            </div>
                        )}
                        {request.approval_status !== "PENDING" && (
                            <Button
                                onClick={() => {
                                    setSelectedRequest(null)
                                    setActiveView("requests")
                                    resetApprovalForm()
                                }}
                                variant="secondary"
                                className="w-full"
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        )
    }

    // ============================================================================
    // RENDER MAIN VIEW
    // ============================================================================

    return (
        <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b">
                {[
                    { id: "inventory", label: "Inventory" },
                    { id: "requests", label: "Requests" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveView(tab.id as any)
                            setSelectedInventory(null)
                            setSelectedRequest(null)
                            resetForm()
                            resetApprovalForm()
                        }}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeView === tab.id ||
                                (activeView === "new-request" && tab.id === "requests") ||
                                (activeView === "edit-request" && tab.id === "requests")
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Views */}
            {activeView === "inventory" && <InventoryListView />}
            {activeView === "requests" && <RequestsListView />}
            {activeView === "new-request" && <RequestFormView isEdit={false} />}
            {activeView === "edit-request" && <RequestFormView isEdit={true} />}
            {activeView === "approval" && selectedRequest && <ApprovalView request={selectedRequest} />}

            {/* Modals */}
            {selectedInventory && activeView === "inventory" && <InventoryDetailModal inventory={selectedInventory} />}
            <InventorySelectionModal />
        </div>
    )
}
