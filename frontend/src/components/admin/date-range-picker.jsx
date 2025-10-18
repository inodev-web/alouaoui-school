import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CalendarDateRangePicker({
  className,
  onPeriodChange,
  onDateChange,
  selectedPeriod = "daily",
  selectedDate = null,
}) {
  const [date, setDate] = React.useState({
    from: selectedDate || new Date(),
    to: selectedDate || new Date(),
  });

  const [period, setPeriod] = React.useState(selectedPeriod);

  React.useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  }, [period, onPeriodChange]);

  React.useEffect(() => {
    if (onDateChange) {
      onDateChange(date.from);
    }
  }, [date, onDateChange]);

  const handleDateSelect = (newDate) => {
    setDate(newDate);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Period Selector */}
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="الفترة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">يومي</SelectItem>
          <SelectItem value="weekly">أسبوعي</SelectItem>
          <SelectItem value="monthly">شهري</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              format(date.from, "yyyy-MM-dd")
            ) : (
              <span>اختر التاريخ</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={date?.from}
            selected={date?.from}
            onSelect={(newDate) =>
              handleDateSelect({ from: newDate, to: newDate })
            }
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
