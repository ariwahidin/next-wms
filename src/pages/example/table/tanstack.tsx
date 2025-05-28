/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  getPaginationRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Trash2,
  Edit3,
  Plus,
  Filter,
  X,
  Calendar,
  Users,
  Building,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";

type Person = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  department: string;
  joinDate: string;
  salary: number;
  position: string;
};

const defaultData: Person[] = [
  { id: 1, name: "Andi Pratama", email: "andi.pratama@mail.com", phone: "081234567890", status: "active", department: "Engineering", joinDate: "2023-01-15", salary: 15000000, position: "Senior Developer" },
  { id: 2, name: "Budi Santoso", email: "budi.santoso@mail.com", phone: "082345678901", status: "active", department: "Marketing", joinDate: "2023-02-20", salary: 12000000, position: "Marketing Manager" },
  { id: 3, name: "Citra Dewi", email: "citra.dewi@mail.com", phone: "083456789012", status: "inactive", department: "HR", joinDate: "2022-11-10", salary: 10000000, position: "HR Specialist" },
  { id: 4, name: "Dedi Rahman", email: "dedi.rahman@mail.com", phone: "084567890123", status: "active", department: "Engineering", joinDate: "2023-03-05", salary: 18000000, position: "Tech Lead" },
  { id: 5, name: "Eka Sari", email: "eka.sari@mail.com", phone: "085678901234", status: "active", department: "Finance", joinDate: "2023-01-28", salary: 13000000, position: "Financial Analyst" },
  { id: 6, name: "Fajar Nugroho", email: "fajar.nugroho@mail.com", phone: "086789012345", status: "inactive", department: "Marketing", joinDate: "2022-09-15", salary: 11000000, position: "Content Creator" },
  { id: 7, name: "Gita Maharani", email: "gita.maharani@mail.com", phone: "087890123456", status: "active", department: "Design", joinDate: "2023-04-12", salary: 14000000, position: "UI/UX Designer" },
  { id: 8, name: "Hendra Wijaya", email: "hendra.wijaya@mail.com", phone: "088901234567", status: "active", department: "Engineering", joinDate: "2023-02-08", salary: 16000000, position: "Full Stack Developer" },
  { id: 9, name: "Indira Putri", email: "indira.putri@mail.com", phone: "089012345678", status: "active", department: "HR", joinDate: "2023-03-22", salary: 9000000, position: "Recruiter" },
  { id: 10, name: "Joko Susilo", email: "joko.susilo@mail.com", phone: "081123456789", status: "inactive", department: "Finance", joinDate: "2022-12-01", salary: 12500000, position: "Accountant" },
  { id: 11, name: "Kartika Sari", email: "kartika.sari@mail.com", phone: "082234567890", status: "active", department: "Marketing", joinDate: "2023-05-10", salary: 10500000, position: "Social Media Manager" },
  { id: 12, name: "Linda Agustina", email: "linda.agustina@mail.com", phone: "083345678901", status: "active", department: "Design", joinDate: "2023-01-18", salary: 13500000, position: "Graphic Designer" },
];

const departments = ["All", "Engineering", "Marketing", "HR", "Finance", "Design"];
const statuses = ["All", "active", "inactive"];

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [data, setData] = useState(defaultData);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [editingRow, setEditingRow] = useState<Person | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
      },
      { 
        accessorKey: "name", 
        header: "Nama Lengkap",
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">{getValue() as string}</div>
        )
      },
      { 
        accessorKey: "email", 
        header: "Email",
        cell: ({ getValue }) => (
          <div className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
            {getValue() as string}
          </div>
        )
      },
      { 
        accessorKey: "phone", 
        header: "Telepon",
        cell: ({ getValue }) => (
          <div className="font-mono text-gray-700 text-sm">{getValue() as string}</div>
        )
      },
      {
        accessorKey: "position",
        header: "Posisi",
        cell: ({ getValue }) => (
          <div className="text-gray-900 font-medium text-sm">{getValue() as string}</div>
        )
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getValue() as string}
          </span>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === "active" 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {value === "active" ? "Aktif" : "Tidak Aktif"}
            </span>
          );
        }
      },
      {
        accessorKey: "salary",
        header: "Gaji",
        cell: ({ getValue }) => (
          <div className="text-gray-900 font-medium">
            Rp {(getValue() as number).toLocaleString('id-ID')}
          </div>
        )
      },
      {
        accessorKey: "joinDate",
        header: "Tanggal Bergabung",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <div className="text-gray-700 text-sm">
              {date.toLocaleDateString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric"
              })}
            </div>
          );
        }
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingRow(row.original)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesDepartment = departmentFilter === "All" || item.department === departmentFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesDateRange = (!dateRange.start || item.joinDate >= dateRange.start) && 
                              (!dateRange.end || item.joinDate <= dateRange.end);
      return matchesDepartment && matchesStatus && matchesDateRange;
    });
  }, [data, departmentFilter, statusFilter, dateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const handleExportCSV = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const rowsToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : filteredData;
    
    const headers = ["ID", "Nama", "Email", "Telepon", "Posisi", "Department", "Status", "Gaji", "Tanggal Bergabung"];
    const csvContent = [
      headers.join(","),
      ...rowsToExport.map(row => [
        row.id,
        `"${row.name}"`,
        row.email,
        row.phone,
        `"${row.position}"`,
        row.department,
        row.status,
        row.salary,
        row.joinDate
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `karyawan_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection).map(Number);
    if (selectedIds.length > 0 && confirm(`Hapus ${selectedIds.length} karyawan yang dipilih?`)) {
      setData(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setRowSelection({});
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus karyawan ini?")) {
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSave = (formData: Omit<Person, 'id'>) => {
    if (editingRow) {
      setData(prev => prev.map(item => 
        item.id === editingRow.id ? { ...formData, id: editingRow.id } : item
      ));
      setEditingRow(null);
    } else {
      const newId = Math.max(...data.map(d => d.id)) + 1;
      setData(prev => [...prev, { ...formData, id: newId }]);
      setShowAddForm(false);
    }
  };

  const clearFilters = () => {
    setGlobalFilter("");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setDateRange({ start: "", end: "" });
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Management Karyawan</h1>
          <p className="text-gray-600">Sistem manajemen karyawan lengkap dengan fitur enterprise</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Karyawan
              </button>
              
              {selectedCount > 0 && (
                <>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus ({selectedCount})
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Pilihan
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </button>
              
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showColumnSelector ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Kolom
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, posisi, atau department..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Tampilkan:</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[5, 8, 10, 20, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize} baris
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filter Lanjutan</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">Semua</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}

          {/* Column Selector */}
          {showColumnSelector && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tampilkan Kolom</h3>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {table.getAllLeafColumns()
                  .filter(col => col.id !== 'select' && col.id !== 'actions')
                  .map((col) => (
                  <label 
                    key={col.id} 
                    className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {col.columnDef.header as string}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th 
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center space-x-2 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanSort() && (
                              <div className="flex flex-col">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp className="w-3 h-3 text-blue-600" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <div className="w-3 h-3 opacity-30">
                                    <ChevronUp className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel().rows.map((row, index) => (
                  <tr 
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      row.getIsSelected() ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap text-sm border-b border-gray-100"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {table.getRowModel().rows.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada data ditemukan</h3>
              <p className="text-gray-500">
                {globalFilter || departmentFilter !== "All" || statusFilter !== "All" || dateRange.start || dateRange.end
                  ? "Tidak ada hasil dengan filter yang diterapkan. Coba ubah filter atau kata kunci pencarian."
                  : "Belum ada data karyawan. Tambah karyawan baru untuk memulai."
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-700">
                <div>
                  Menampilkan{' '}
                  <span className="font-medium">
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                  </span>{' '}
                  sampai{' '}
                  <span className="font-medium">
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}
                  </span>{' '}
                  dari{' '}
                  <span className="font-medium">
                    {table.getFilteredRowModel().rows.length}
                  </span>{' '}
                  hasil
                </div>
                {selectedCount > 0 && (
                  <div className="text-blue-600 font-medium">
                    {selectedCount} baris dipilih
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(table.getPageCount(), 7) }, (_, i) => {
                    const pageIndex = table.getState().pagination.pageIndex;
                    const totalPages = table.getPageCount();
                    
                    let pageNumber;
                    if (totalPages <= 7) {
                      pageNumber = i;
                    } else if (pageIndex < 4) {
                      pageNumber = i;
                    } else if (pageIndex > totalPages - 5) {
                      pageNumber = totalPages - 7 + i;
                    } else {
                      pageNumber = pageIndex - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => table.setPageIndex(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          table.getState().pagination.pageIndex === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

