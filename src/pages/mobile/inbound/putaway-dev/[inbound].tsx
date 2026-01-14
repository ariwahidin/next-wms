/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/mobile/PageHeader";
import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { InventoryPolicy } from "@/types/inventory";
import { Product } from "@/types/item";

// ============================================================
// TYPES & INTERFACES
// ============================================================
interface PutawayTask {
  id: number;
  task_no: string;
  item_code: string;
  barcode: string;
  quantity: number;
  putaway_qty: number;
  is_serial: boolean;
  owner_code?: string;
  uom?: string;
  exp_date?: string;
  prod_date?: string;
  lot_number?: string;
  source_location?: string;
}

interface PutawayItem {
  id?: number;
  task_id: number;
  barcode: string;
  serial_number?: string;
  source_location: string;
  destination_location: string;
  qa_status: string;
  quantity: number;
  status?: string;
  prod_date?: string;
  exp_date?: string;
  lot_number?: string;
  uom?: string;
  product?: Product;
}

interface ScanFormData {
  location: string;
  barcode: string;
  qaStatus: string;
  serialNumbers: string[];
  quantity: number;
  prodDate?: string;
  expDate?: string;
  lotNo?: string;
  uom?: string;
}

// ============================================================
// CUSTOM HOOKS
// ============================================================
const usePutawayTasks = (taskNo: string | string[]) => {
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [allTasks, setAllTasks] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!taskNo) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/mobile/putaway/tasks/${taskNo}`);
      const { success, data } = response.data;
      
      if (success) {
        const formatted = data.map((item: any) => ({
          id: item.ID,
          task_no: item.task_no,
          item_code: item.item_code,
          barcode: item.barcode,
          quantity: item.quantity,
          putaway_qty: item.putaway_qty,
          is_serial: item.is_serial,
          uom: item.uom,
          owner_code: item.owner_code,
          exp_date: item.exp_date,
          prod_date: item.prod_date,
          lot_number: item.lot_number,
          source_location: item.source_location,
        }));
        
        setAllTasks(formatted);
      }
    } catch (error) {
      console.error("Error fetching putaway tasks:", error);
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Failed to fetch putaway tasks",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [taskNo]);

  return { tasks, allTasks, loading, fetchTasks, setTasks };
};

const usePutawayItems = () => {
  const [items, setItems] = useState<PutawayItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async (taskId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/mobile/putaway/items/${taskId}`);
      const { success, data } = response.data;
      
      if (success) {
        const formatted = data.map((item: any) => ({
          id: item.ID,
          task_id: item.task_id,
          barcode: item.barcode,
          serial_number: item.serial_number,
          source_location: item.source_location,
          destination_location: item.destination_location,
          qa_status: item.qa_status,
          quantity: item.quantity,
          status: item.status,
          prod_date: item.prod_date,
          exp_date: item.exp_date,
          lot_number: item.lot_number,
          uom: item.uom,
          product: item.product,
        }));
        
        setItems(formatted);
      }
    } catch (error) {
      console.error("Error fetching putaway items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (itemId: number, taskId: number) => {
    try {
      const response = await api.delete(`/mobile/putaway/items/${itemId}`);
      const { success } = response.data;
      
      if (success) {
        await fetchItems(taskId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting putaway item:", error);
      return false;
    }
  }, [fetchItems]);

  return { items, loading, fetchItems, deleteItem };
};

const useInventoryPolicy = () => {
  const [policy, setPolicy] = useState<InventoryPolicy>();
  const [loading, setLoading] = useState(false);

  const fetchPolicy = useCallback(async (ownerCode: string) => {
    if (!ownerCode) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/inventory/policy?owner=${ownerCode}`);
      const { success, data } = response.data;
      
      if (success) {
        setPolicy(data.inventory_policy);
      }
    } catch (error) {
      console.error("Error fetching inventory policy:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { policy, loading, fetchPolicy };
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
interface ScanFormProps {
  onSubmit: (data: ScanFormData) => void;
  loading: boolean;
  initialLocation?: string;
}

const ScanForm: React.FC<ScanFormProps> = ({ onSubmit, loading, initialLocation }) => {
  const [location, setLocation] = useState(initialLocation || "");
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim() || !barcode.trim()) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Location and barcode are required",
        type: "error",
      });
      return;
    }

    onSubmit({
      location: location.trim(),
      barcode: barcode.trim(),
      qaStatus: "A",
      serialNumbers: [],
      quantity: 1,
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <label htmlFor="location" className="text-sm text-gray-600">
              Destination Location:
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1"
              autoFocus
              autoComplete="off"
            />
            {location && (
              <button
                type="button"
                className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setLocation("");
                  document.getElementById("location")?.focus();
                }}
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          <div className="relative">
            <label htmlFor="barcode" className="text-sm text-gray-600">
              Barcode:
            </label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="mt-1"
              autoComplete="off"
            />
            {barcode && (
              <button
                type="button"
                className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setBarcode("");
                  document.getElementById("barcode")?.focus();
                }}
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

interface TaskListProps {
  tasks: PutawayTask[];
  invPolicy?: InventoryPolicy;
  onTaskClick: (task: PutawayTask) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showAll: boolean;
  onShowAllToggle: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  invPolicy,
  onTaskClick,
  searchTerm,
  onSearchChange,
  showAll,
  onShowAllToggle,
}) => {
  const totalQty = useMemo(
    () => tasks.reduce((sum, task) => sum + task.putaway_qty, 0),
    [tasks]
  );
  
  const totalExpected = useMemo(
    () => tasks.reduce((sum, task) => sum + task.quantity, 0),
    [tasks]
  );

  return (
    <>
      <div className="flex justify-center gap-4 mb-4">
        <span className="text-sm">
          Total Qty: {totalQty} / {totalExpected}
        </span>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show Pending</span>
            <button
              type="button"
              onClick={onShowAllToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showAll ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAll ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm">Show All</span>
          </div>

          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="border p-3 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="text-sm space-y-1">
                    <div className="font-mono text-xs">
                      <span className="text-gray-600">Item:</span> {task.item_code}
                      <br />
                      <span className="text-gray-600">Barcode:</span> {task.barcode}
                      <br />
                      {invPolicy?.use_production_date && task.prod_date && (
                        <>
                          <span className="text-gray-600">Prod Date:</span> {task.prod_date}
                          <br />
                        </>
                      )}
                      {invPolicy?.require_expiry_date && task.exp_date && (
                        <>
                          <span className="text-gray-600">Exp Date:</span> {task.exp_date}
                          <br />
                        </>
                      )}
                      {invPolicy?.use_lot_no && task.lot_number && (
                        <>
                          <span className="text-gray-600">Lot:</span> {task.lot_number}
                          <br />
                        </>
                      )}
                      <span className="text-gray-600">Progress:</span> {task.putaway_qty} /{" "}
                      {task.quantity} {task.uom}
                      <br />
                      {task.source_location && (
                        <>
                          <span className="text-gray-600">From:</span> {task.source_location}
                        </>
                      )}
                    </div>
                    {task.is_serial && (
                      <div className="text-right text-xs text-gray-600">SN Required</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 text-center py-4">No tasks found</div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PutawayPage = () => {
  const router = useRouter();
  const { taskNo } = router.query;

  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tasks, allTasks, loading: tasksLoading, fetchTasks, setTasks } = usePutawayTasks(taskNo);
  const { items, loading: itemsLoading, fetchItems, deleteItem } = usePutawayItems();
  const { policy, fetchPolicy } = useInventoryPolicy();

  // Filter tasks based on search and showAll toggle
  useEffect(() => {
    let filtered = allTasks;

    if (searchTerm) {
      filtered = filtered.filter((task) =>
        task.item_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!showAll) {
      filtered = filtered.filter((task) => task.quantity !== task.putaway_qty);
    }

    setTasks(filtered);
  }, [allTasks, searchTerm, showAll, setTasks]);

  // Fetch tasks on mount
  useEffect(() => {
    if (taskNo) {
      fetchTasks();
    }
  }, [taskNo, fetchTasks]);

  // Fetch policy when tasks are loaded
  useEffect(() => {
    if (allTasks.length > 0 && allTasks[0].owner_code) {
      fetchPolicy(allTasks[0].owner_code);
    }
  }, [allTasks, fetchPolicy]);

  // Refresh tasks when modal closes
  useEffect(() => {
    if (!showDetailModal && taskNo) {
      fetchTasks();
    }
  }, [showDetailModal, taskNo, fetchTasks]);

  const handleScanSubmit = async (formData: ScanFormData) => {
    setIsSubmitting(true);
    
    try {
      const payload = {
        taskNo: Array.isArray(taskNo) ? taskNo[0] : taskNo,
        location: formData.location,
        barcode: formData.barcode,
        qaStatus: formData.qaStatus,
        quantity: formData.quantity,
      };

      const response = await api.post("/mobile/putaway/scan", payload);
      const { success, message } = response.data;

      if (success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: message,
          type: "success",
        });
        await fetchTasks();
      }
    } catch (error: any) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: error.response?.data?.message || "Failed to process putaway",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskClick = async (task: PutawayTask) => {
    setSelectedTask(task);
    await fetchItems(task.id);
    setShowDetailModal(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedTask) return;
    
    const success = await deleteItem(itemId, selectedTask.id);
    if (success) {
      await fetchTasks();
      eventBus.emit("showAlert", {
        title: "Success!",
        description: "Item deleted successfully",
        type: "success",
      });
    }
  };

  return (
    <>
      <PageHeader title={`Putaway Task ${taskNo}`} showBackButton />
      
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <ScanForm onSubmit={handleScanSubmit} loading={isSubmitting} />

        <TaskList
          tasks={tasks}
          invPolicy={policy}
          onTaskClick={handleTaskClick}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showAll={showAll}
          onShowAllToggle={() => setShowAll(!showAll)}
        />

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Putaway Items</DialogTitle>
            </DialogHeader>

            <div className="text-sm mb-2">
              <span>Total Items: {items.length}</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg ${
                      item.status === "completed" ? "bg-green-50" : "bg-blue-50"
                    }`}
                  >
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>
                          <strong>Barcode:</strong> {item.barcode}
                        </span>
                        <span className="text-gray-400">{item.status}</span>
                      </div>
                      {item.serial_number && (
                        <div>
                          <strong>Serial:</strong> {item.serial_number}
                        </div>
                      )}
                      <div>
                        <strong>From:</strong> {item.source_location} →{" "}
                        <strong>To:</strong> {item.destination_location}
                      </div>
                      <div>
                        <strong>Qty:</strong> {item.quantity} {item.uom}
                      </div>
                    </div>

                    {item.status === "pending" && (
                      <div className="mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id!)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">
                  No items found
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PutawayPage;