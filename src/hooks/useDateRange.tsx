// hooks/useDateRange.js
import { useState } from "react";

export const useDateRange = () => {
  const [selectedDateRange, setSelectedDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  });

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setSelectedDateRange((prev) => ({ ...prev, startDate: newStartDate }));
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setSelectedDateRange((prev) => ({ ...prev, endDate: newEndDate }));
  };

  const setDatePreset = (days) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    setSelectedDateRange({
      startDate: pastDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  return {
    selectedDateRange,
    handleStartDateChange,
    handleEndDateChange,
    setDatePreset,
  };
};
