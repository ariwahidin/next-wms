/* eslint-disable react-hooks/exhaustive-deps */
import Layout from '@/components/layout';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

export default function RackVisualization() {
  const [selectedView, setSelectedView] = useState('top');
  const [selectedRow, setSelectedRow] = useState('A1');
  const [rackData, setRackData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [useDemo, setUseDemo] = useState(true);
  const [searchItemCode, setSearchItemCode] = useState('');
  const [foundLocation, setFoundLocation] = useState(null);
  const [blinkBay, setBlinkBay] = useState([]);
  const [blinkBin, setBlinkBin] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const demoData = [
    { ID: 1, location_code: "A1010101", whs_code: "WH-B", row: "A1", bay: "01", level: "01", bin: "01", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 2, location_code: "A1010102", whs_code: "WH-B", row: "A1", bay: "01", level: "01", bin: "02", area: "ganjil", is_active: true, is_pickable: true },
    { ID: 3, location_code: "A1010103", whs_code: "WH-B", row: "A1", bay: "01", level: "01", bin: "03", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 4, location_code: "A1010201", whs_code: "WH-B", row: "A1", bay: "01", level: "02", bin: "01", area: "ganjil", is_active: true, is_pickable: true },
    { ID: 5, location_code: "A1010202", whs_code: "WH-B", row: "A1", bay: "01", level: "02", bin: "02", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 6, location_code: "A1010203", whs_code: "WH-B", row: "A1", bay: "01", level: "02", bin: "03", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 7, location_code: "A1010301", whs_code: "WH-B", row: "A1", bay: "01", level: "03", bin: "01", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 8, location_code: "A1010302", whs_code: "WH-B", row: "A1", bay: "01", level: "03", bin: "02", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 9, location_code: "A1010303", whs_code: "WH-B", row: "A1", bay: "01", level: "03", bin: "03", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 10, location_code: "A1020101", whs_code: "WH-B", row: "A1", bay: "02", level: "01", bin: "01", area: "ganjil", is_active: true, is_pickable: true },
    { ID: 11, location_code: "A1020102", whs_code: "WH-B", row: "A1", bay: "02", level: "01", bin: "02", area: "ganjil", is_active: false, is_pickable: false },
    { ID: 12, location_code: "A1020103", whs_code: "WH-B", row: "A1", bay: "02", level: "01", bin: "03", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 13, location_code: "A2010101", whs_code: "WH-B", row: "A2", bay: "01", level: "01", bin: "01", area: "genap", is_active: true, is_pickable: false },
    { ID: 14, location_code: "A2010102", whs_code: "WH-B", row: "A2", bay: "01", level: "01", bin: "02", area: "genap", is_active: true, is_pickable: true },
    { ID: 15, location_code: "A1030101", whs_code: "WH-B", row: "A1", bay: "03", level: "01", bin: "01", area: "ganjil", is_active: true, is_pickable: false },
    { ID: 16, location_code: "A1030102", whs_code: "WH-B", row: "A1", bay: "03", level: "01", bin: "02", area: "ganjil", is_active: true, is_pickable: false },
  ];

  const demoInventory = [
    { id: 1, item_code: "ITM-001", item_name: "Laptop Dell XPS 15", location_code: "A1010101", qty: 5, unit: "pcs" },
    { id: 2, item_code: "ITM-002", item_name: "Monitor LG 27 inch", location_code: "A1010101", qty: 10, unit: "pcs" },
    { id: 3, item_code: "ITM-003", item_name: "Keyboard Mechanical", location_code: "A1010102", qty: 20, unit: "pcs" },
    { id: 4, item_code: "ITM-004", item_name: "Mouse Wireless", location_code: "A1010201", qty: 15, unit: "pcs" },
    { id: 5, item_code: "ITM-005", item_name: "USB Cable Type-C", location_code: "A1010202", qty: 100, unit: "pcs" },
    { id: 6, item_code: "ITM-006", item_name: "Hard Drive 1TB", location_code: "A1010301", qty: 8, unit: "pcs" },
    { id: 7, item_code: "ITM-007", item_name: "RAM DDR4 16GB", location_code: "A1010302", qty: 25, unit: "pcs" },
    { id: 8, item_code: "ITM-008", item_name: "SSD Samsung 500GB", location_code: "A1020101", qty: 12, unit: "pcs" },
    { id: 9, item_code: "ITM-009", item_name: "Webcam Logitech", location_code: "A1020103", qty: 7, unit: "pcs" },
    { id: 10, item_code: "ITM-010", item_name: "Headset Gaming", location_code: "A2010101", qty: 18, unit: "pcs" },
    { id: 11, item_code: "ITM-011", item_name: "Speaker Bluetooth", location_code: "A2010102", qty: 30, unit: "pcs" },
    { id: 12, item_code: "ITM-012", item_name: "Power Bank 20000mAh", location_code: "A1010101", qty: 40, unit: "pcs" },
  ];

  const fetchRackData = async () => {
    setLoading(true);
    try {
    //   if (useDemo) {
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //     setRackData(demoData);
    //     setInventoryData(demoInventory);
    //   } else if (apiUrl) {
    //     const response = await fetch(apiUrl);
    //     const result = await response.json();
    //     setRackData(result.data || []);
    //     setInventoryData(result.inventory || []);
    //   }

    const response = await api.get('/locations');
      const result = await response.data;
      setRackData(result.data || []);

      const response2 = await api.get('/inventory/location');
      const result2 = await response2.data;
      setInventoryData(result2.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Using demo data.');
      setRackData(demoData);
      setInventoryData(demoInventory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRackData();
  }, [useDemo]);

  const handleSearchItem = () => {
    if (!searchItemCode.trim()) {
      alert('Please enter an item code');
      return;
    }

    const items = inventoryData.filter(inv => 
      inv.item_code.toLowerCase() === searchItemCode.trim().toLowerCase()
    );

    if (items.length > 0) {
      const locations = [];
      const bayList = [];
      const binList = [];
      
      items.forEach(item => {
        const location = rackData.find(loc => loc.location_code === item.location_code);
        if (location) {
          locations.push(location);
          bayList.push({ row: location.row, bay: location.bay });
          binList.push(location.location_code);
        }
      });

      if (locations.length > 0) {
        setFoundLocation(locations[0]);
        setBlinkBay(bayList);
        setBlinkBin(binList);
        
        setTimeout(() => {
          setBlinkBay([]);
          setBlinkBin([]);
        }, 8000);
      } else {
        alert('Item found but location not in rack data');
      }
    } else {
      alert('Item not found');
      setFoundLocation(null);
      setBlinkBay([]);
      setBlinkBin([]);
    }
  };

  const handleBayClick = (row, bay) => {
    setSelectedRow(row);
    setSelectedView('side');
  };

  const handleBinClick = (binItem) => {
    console.log('Clicked bin:', binItem);
    setSelectedBin(binItem);
    setShowModal(true);
  };

  const getItemsInBin = (locationCode) => {
    return inventoryData.filter(item => item.location_code === locationCode);
  };

  const getBayInventoryStatus = (row, bay) => {
    const locationsInBay = rackData.filter(loc => loc.row === row && loc.bay === bay);
    const locationCodes = locationsInBay.map(loc => loc.location_code);
    const hasItems = inventoryData.some(item => locationCodes.includes(item.location_code));
    return hasItems;
  };

  const getBayPickingStatus = (row, bay) => {
    const locationsInBay = rackData.filter(loc => loc.row === row && loc.bay === bay);
    return locationsInBay.some(loc => !loc.is_pickable);
  };

  const filteredData = rackData.filter(item => item.row === selectedRow);
  const uniqueRows = [...new Set(rackData.map(item => item.row))].sort();

  const getRackStructure = () => {
    const structure = {};
    
    filteredData.forEach(item => {
      const { bay, level, bin } = item;
      
      if (!structure[bay]) structure[bay] = {};
      if (!structure[bay][level]) structure[bay][level] = [];
      
      structure[bay][level].push(item);
    });

    Object.keys(structure).forEach(bay => {
      Object.keys(structure[bay]).forEach(level => {
        structure[bay][level].sort((a, b) => a.bin.localeCompare(b.bin));
      });
    });

    return structure;
  };

  const rackStructure = getRackStructure();
  const bays = Object.keys(rackStructure).sort();
  const levels = bays.length > 0 ? Object.keys(rackStructure[bays[0]] || {}).sort() : [];

  const TopView = () => {
    const rowGroups = {};
    rackData.forEach(item => {
      if (!rowGroups[item.row]) {
        rowGroups[item.row] = [];
      }
      rowGroups[item.row].push(item);
    });

    const allRows = Object.keys(rowGroups).sort();

    const renderRowWithBays = (row) => {
      const rowData = rowGroups[row];
      const baysInRow = [...new Set(rowData.map(item => item.bay))].sort();
      
      return (
        <div key={row} className="mb-4">
          <div className="flex items-center gap-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold min-w-[80px] text-center">
              Row {row}
            </span>
            <div className="flex gap-3">
              {baysInRow.map(bay => {
                const locationsInBay = rowData.filter(item => item.bay === bay);
                const activeCount = locationsInBay.filter(loc => loc.is_active).length;
                const totalCount = locationsInBay.length;
                const isFullyActive = activeCount === totalCount;
                const hasInactive = activeCount < totalCount;
                const hasInventory = getBayInventoryStatus(row, bay);
                const hasPicking = getBayPickingStatus(row, bay);
                const isBlink = blinkBay.some(b => b.row === row && b.bay === bay);
                
                return (
                  <div
                    key={`${row}-${bay}`}
                    className={`relative transition-all cursor-pointer hover:scale-105 ${
                      isBlink ? 'animate-pulse' : ''
                    }`}
                    onClick={() => handleBayClick(row, bay)}
                  >
                    {hasPicking && (
                      <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-bounce">
                        !P
                      </div>
                    )}
                    <div className={`w-20 h-28 border-2 rounded-lg shadow-md ${
                      isBlink
                        ? 'bg-yellow-300 border-yellow-600 ring-4 ring-yellow-400'
                        : hasInventory
                        ? 'bg-green-400 border-green-700'
                        : isFullyActive
                        ? 'bg-blue-400 border-blue-700'
                        : hasInactive && activeCount > 0
                        ? 'bg-gradient-to-b from-blue-400 to-red-300 border-yellow-600'
                        : 'bg-red-300 border-red-600 opacity-70'
                    }`}>
                      <div className="flex flex-col items-center justify-center h-full p-2">
                        <div className="bg-white bg-opacity-90 rounded px-2 py-1 mb-1">
                          <span className="text-base font-bold text-gray-800">
                            {bay as React.ReactNode}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="bg-black bg-opacity-20 rounded px-1 py-0.5 mb-1">
                            <span className="text-[9px] text-white font-semibold">
                              {totalCount} loc
                            </span>
                          </div>
                          {/* <div className="bg-green-600 bg-opacity-70 rounded px-1 py-0.5">
                            <span className="text-[9px] text-white font-semibold">
                              {activeCount} act
                            </span>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-6 text-gray-700 text-center">Top View - Warehouse Layout Overview</h3>
        
        {allRows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No data available
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600">Bird`s Eye View - All Rows and Bays (Click bay to view details)</p>
            </div>

            <div className="w-full max-w-6xl">
              {allRows.map((row, index) => {
                const rowNumber = row.match(/\d+/)?.[0];
                const isOddRow = rowNumber && parseInt(rowNumber) % 2 === 1;
                
                return (
                  <div key={row}>
                    {renderRowWithBays(row)}
                    
                    {isOddRow && index < allRows.length - 1 && (
                      <div className="my-4">
                        <div className="bg-yellow-400 py-3 rounded-lg shadow text-center">
                          <span className="text-sm font-bold text-gray-800">↕ AISLE ↕</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 max-w-2xl p-4 bg-white rounded-lg border-2 border-gray-300 shadow">
              <p className="text-sm text-gray-700 text-center">
                <span className="font-semibold">Top View:</span> Shows the warehouse layout.
                Odd rows (A1, B1) are separated from even rows (A2, B2) by aisles.
                For detailed Level and Bin information, use <span className="font-semibold text-blue-600">Side View</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SideView = () => (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-6 text-gray-700">Side View - Row {selectedRow}</h3>
      
      {bays.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available for Row {selectedRow}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-8 justify-center min-w-max pb-4">
            {bays.map((bay) => (
              <div key={bay} className="relative">
                <div className="text-center mb-4">
                  <span className="bg-green-600 text-white px-4 py-1 rounded text-sm font-bold">
                    Bay {bay}
                  </span>
                </div>

                <div className="flex flex-col-reverse gap-3">
                  {levels.map((level) => {
                    const binsInLevel = rackStructure[bay]?.[level] || [];
                    const heightFromGround = parseInt(level);
                    
                    return (
                      <div key={level} className="flex items-center gap-3">
                        <div className="w-14 relative">
                          <span className="text-xs font-semibold px-2 py-1 rounded block text-center bg-purple-500 text-white">
                            L{level}
                          </span>
                          <span className="text-[9px] text-gray-500 block text-center mt-1">
                            {heightFromGround}m
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {binsInLevel.map((binItem) => {
                            const itemsInBin = getItemsInBin(binItem.location_code);
                            const hasItems = itemsInBin.length > 0;
                            const isBinBlink = blinkBin.includes(binItem.location_code);
                            const isPickable = binItem.is_pickable;
                            
                            return (
                              <div
                                key={binItem.ID}
                                onClick={() => handleBinClick(binItem)}
                                className="relative"
                              >
                                {!isPickable && (
                                  <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg animate-bounce">
                                    !P
                                  </div>
                                )}
                                <div
                                  className={`w-24 h-20 border-2 rounded transition-all cursor-pointer ${
                                    isBinBlink
                                      ? 'bg-yellow-300 border-yellow-600 hover:bg-yellow-400 hover:scale-105 animate-pulse ring-4 ring-yellow-400'
                                      : hasItems
                                      ? 'bg-green-400 border-green-600 hover:bg-green-500 hover:scale-105'
                                      : binItem.is_active
                                      ? 'bg-blue-400 border-blue-600 hover:bg-blue-500 hover:scale-105'
                                      : 'bg-red-300 border-red-500 opacity-50'
                                  }`}
                                >
                                  <div className="flex flex-col items-center justify-center h-full p-2">
                                    <span className="text-xs font-bold text-white">
                                      Bin {binItem.bin}
                                    </span>
                                    <span className="text-[10px] text-white opacity-90 text-center">
                                      {binItem.location_code}
                                    </span>
                                    {isBinBlink && (
                                      <span className="text-[9px] text-yellow-900 font-bold mt-1 bg-yellow-100 px-1 rounded">
                                        FOUND
                                      </span>
                                    )}
                                    {hasItems && !isBinBlink && (
                                      <span className="text-[9px] text-white font-semibold mt-1 bg-black bg-opacity-30 px-1 rounded">
                                        {itemsInBin.length} items
                                      </span>
                                    )}
                                    {!binItem.is_active && (
                                      <span className="text-[9px] text-red-800 font-semibold mt-1">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 h-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded shadow-inner"></div>
                <div className="mt-1 text-center">
                  <span className="text-xs text-gray-600 font-semibold">⬇ Ground Level ⬇</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Utilities" subTitle="Storage Overview">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Storage Overview
          </h1>
          {/* <p className="text-gray-600">Warehouse Management System - Real Data from API</p> */}
        </div>

        {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Configuration</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useDemo"
                checked={useDemo}
                onChange={(e) => setUseDemo(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="useDemo" className="text-sm text-gray-700">
                Use Demo Data
              </label>
            </div>
            
            {!useDemo && (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter API URL (e.g., https://api.example.com/locations)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchRackData}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Loading...' : 'Load Data'}
                </button>
              </div>
            )}
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Search Item by Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter item code (e.g., ITM-001)"
              value={searchItemCode}
              onChange={(e) => setSearchItemCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchItem()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchItem}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Search
            </button>
            {foundLocation && (
              <button
                onClick={() => {
                  setSearchItemCode('');
                  setFoundLocation(null);
                  setBlinkBay([]);
                  setBlinkBin([]);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {foundLocation && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Item found in {blinkBay.length} location(s):</span>
              </p>
              <div className="mt-2 space-y-1">
                {inventoryData
                  .filter(inv => inv.item_code.toLowerCase() === searchItemCode.toLowerCase())
                  .map((item, idx) => {
                    const loc = rackData.find(r => r.location_code === item.location_code);
                    return loc ? (
                      <p key={idx} className="text-xs text-gray-600">
                        • Row {loc.row}, Bay {loc.bay}, Level {loc.level}, Bin {loc.bin}
                        <span className="ml-2 text-green-600 font-bold">({loc.location_code})</span>
                      </p>
                    ) : null;
                  })}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Click any blinking bay in Top View or switch to Side View to see exact locations
              </p>
            </div>
          )}
        </div>

        {selectedView === 'side' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Select Row:</label>
                <select
                  value={selectedRow}
                  onChange={(e) => setSelectedRow(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  {uniqueRows.map(row => (
                    <option key={row} value={row}>Row {row}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-gray-600">Total Locations: </span>
                  <span className="font-bold text-blue-600">{filteredData.length}</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-gray-600">Active: </span>
                  <span className="font-bold text-green-600">
                    {filteredData.filter(item => item.is_active).length}
                  </span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-lg">
                  <span className="text-gray-600">Inactive: </span>
                  <span className="font-bold text-red-600">
                    {filteredData.filter(item => !item.is_active).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            <button
              onClick={() => setSelectedView('top')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                selectedView === 'top'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Top View
            </button>
            <button
              onClick={() => setSelectedView('side')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                selectedView === 'side'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Side View
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            selectedView === 'top' ? <TopView /> : <SideView />
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-400 border-2 border-green-600 rounded"></div>
              <span className="text-sm text-gray-700">Has Inventory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-400 border-2 border-blue-600 rounded"></div>
              <span className="text-sm text-gray-700">Active (Empty)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-300 border-2 border-red-500 rounded opacity-50"></div>
              <span className="text-sm text-gray-700">Inactive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded"></div>
              <span className="text-sm text-gray-700">Aisle Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-300 border-2 border-yellow-600 rounded animate-pulse"></div>
              <span className="text-sm text-gray-700">Search Result</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 bg-blue-400 border-2 border-blue-600 rounded">
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">
                  !P
                </div>
              </div>
              <span className="text-sm text-gray-700">Not Pickable</span>
            </div>
          </div>
        </div>

        {showModal && selectedBin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Bin Details</h2>
                    <p className="text-blue-100">Location: {selectedBin.location_code}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedBin(null);
                    }}
                    className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Row</p>
                    <p className="font-bold text-gray-800">{selectedBin.row}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bay</p>
                    <p className="font-bold text-gray-800">{selectedBin.bay}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="font-bold text-gray-800">{selectedBin.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bin</p>
                    <p className="font-bold text-gray-800">{selectedBin.bin}</p>
                  </div>
                  {/* <div>
                    <p className="text-xs text-gray-500">Area</p>
                    <p className="font-bold text-gray-800">{selectedBin.area}</p>
                  </div> */}
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className={`font-bold ${selectedBin.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedBin.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Is Pickable</p>
                    <p className={`font-bold ${selectedBin.is_pickable ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedBin.is_pickable ? 'True' : 'False'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Items in this Bin ({getItemsInBin(selectedBin.location_code).length})
                  </h3>
                  
                  {getItemsInBin(selectedBin.location_code).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="font-semibold">No items in this bin</p>
                      <p className="text-sm mt-1">This location is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getItemsInBin(selectedBin.location_code).map((item) => {
                        const isSearchedItem = searchItemCode && 
                          item.item_code.toLowerCase() === searchItemCode.toLowerCase();
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isSearchedItem
                                ? 'bg-yellow-50 border-yellow-400 shadow-lg ring-2 ring-yellow-300'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    isSearchedItem
                                      ? 'bg-yellow-400 text-yellow-900'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.item_code}
                                  </span>
                                  {isSearchedItem && (
                                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-bold animate-pulse">
                                      ★ FOUND
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-gray-800 mb-1">{item.item_name}</h4>
                                <div className="flex gap-4 text-sm text-gray-600">
                                  <span>Quantity: <span className="font-bold text-gray-800">{item.qty}</span></span>
                                  <span>Unit: <span className="font-bold text-gray-800">{item.unit}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBin(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Close
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