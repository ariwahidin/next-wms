import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface FilterOutboundProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  dateFrom: Date | null;
  dateTo: Date | null;
  status: string;
}

const FilterOutbound = ({ onFilterChange }: FilterOutboundProps) => {
  // Set default date range to last 7 days
  const [dateFrom, setDateFrom] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 7))
  );
  const [dateTo, setDateTo] = useState<Date | null>(new Date());
  const [status, setStatus] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  // Emit filter changes
  useEffect(() => {
    onFilterChange({
      dateFrom,
      dateTo,
      status,
    });
  }, [dateFrom, dateTo, status, onFilterChange]);

  const handleReset = () => {
    const defaultFrom = new Date(new Date().setDate(new Date().getDate() - 7));
    const defaultTo = new Date();
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
    setStatus("all");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    const defaultFrom = new Date(new Date().setDate(new Date().getDate() - 7));
    const defaultTo = new Date();
    
    // Check if date range is not default
    if (
      dateFrom?.toDateString() !== defaultFrom.toDateString() ||
      dateTo?.toDateString() !== defaultTo.toDateString()
    ) {
      count++;
    }
    
    // Check if status is not 'all'
    if (status !== "all") {
      count++;
    }
    
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filter Options</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="complete">Completed</SelectItem>
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-xs"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom || undefined}
                    onSelect={(date) => setDateFrom(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-xs"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo || undefined}
                    onSelect={(date) => setDateTo(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Date Ranges */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(new Date(new Date().setDate(new Date().getDate() - 7)));
                  setDateTo(new Date());
                }}
                className="text-xs"
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(new Date(new Date().setDate(new Date().getDate() - 30)));
                  setDateTo(new Date());
                }}
                className="text-xs"
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setDateFrom(new Date(today.getFullYear(), today.getMonth(), 1));
                  setDateTo(new Date());
                }}
                className="text-xs"
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                  setDateFrom(lastMonth);
                  setDateTo(lastMonthEnd);
                }}
                className="text-xs"
              >
                Last Month
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterOutbound;