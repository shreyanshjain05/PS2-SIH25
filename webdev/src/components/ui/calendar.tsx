"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  month?: Date;
  onMonthChange?: (date: Date) => void;
};

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  month: controlledMonth,
  onMonthChange,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(
    controlledMonth || selected || new Date()
  );

  const month = controlledMonth || internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay();

  const previousMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    handleMonthChange(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    handleMonthChange(newMonth);
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === month.getMonth() &&
      selected.getFullYear() === month.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    if (!disabled) return false;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return disabled(date);
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    onSelect?.(date);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Generate calendar grid
  const days: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add the days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={previousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => (
          <div key={index} className="aspect-square p-0.5">
            {day !== null && (
              <button
                onClick={() => handleDayClick(day)}
                disabled={isDisabled(day)}
                className={cn(
                  "w-full h-full rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected(day) &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  isDisabled(day) &&
                    "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
