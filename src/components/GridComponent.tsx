"use client";

import React, { useState, useCallback } from 'react';


import { AgGridReact } from 'ag-grid-react';

import { ModuleRegistry } from 'ag-grid-community'; 
import { ClientSideRowModelModule } from 'ag-grid-community'; 

ModuleRegistry.registerModules([ ClientSideRowModelModule ]); 

const styles = {
  '.ag-theme-alpine': {
    '--ag-background-color': '#fff',
    '--ag-header-background-color': '#f3f4f6',
    '--ag-odd-row-background-color': '#fff',
    '--ag-row-border-color': '#e5e7eb',
    '--ag-header-column-separator-display': 'block',
    '--ag-header-column-separator-color': '#e5e7eb',
    '--ag-border-color': '#e5e7eb',
    '--ag-row-hover-color': '#f9fafb',
    '--ag-selected-row-background-color': '#f3f4f6',
    '--ag-font-size': '14px',
    '--ag-font-family': 'inherit',
    '--ag-cell-horizontal-padding': '1rem',
    '--ag-header-column-resize-handle-display': 'block',
    '--ag-header-column-resize-handle-color': '#e5e7eb',
    '--ag-header-foreground-color': '#374151',
    '--ag-foreground-color': '#374151',
  }
};

export default function DataGrid() {
  

  const rowData = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Inactive" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "Active" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User", status: "Active" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "Admin", status: "Inactive" }
  ];

  const onGridReady = (params) => {
    setGridApi(params.api);
  };



  const [gridApi, setGridApi] = useState(null);
  const [searchText, setSearchText] = useState("");
  const onSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchText(value);
    if (gridApi) {
      gridApi.setQuickFilter(value);
    }
  }, [gridApi]);

  const columnDefs = [
    { 
      field: 'id', 
      headerName: 'ID',
      filter: true,
      width: 80 
    },
    {
      field: 'name',
      headerName: 'Name',
      filter: true,
      sortable: true
    },
    {
      field: 'email',
      headerName: 'Email',
      filter: true,
      sortable: true
    },
    {
      field: 'role',
      headerName: 'Role',
      filter: true,
      sortable: true
    },
    {
      field: 'status',
      headerName: 'Status',
      filter: true,
      sortable: true,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded text-sm ${
          params.value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex gap-2">
          <button 
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => console.log('Edit:', params.data.id)}
          >
            Edit
          </button>
          <button 
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => console.log('Delete:', params.data.id)}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    filter: true,
    floatingFilter: true,
    sortable: true,
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Global Search..."
          onChange={onSearchChange}
          value={searchText}
          className="p-2 border rounded w-64"
        />
      </div>

      <div 
        className="ag-theme-alpine w-full border rounded"
        style={{ height: '400px', ...styles['.ag-theme-alpine'] }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          animateRows={true}
          onGridReady={onGridReady}
          quickFilterText={searchText}
        />
      </div>
    </div>
  );
}