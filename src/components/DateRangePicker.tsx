// components/DateRangePicker.js
import React from "react";

const DateRangePicker = ({
  selectedDateRange,
  onStartDateChange,
  onEndDateChange,
  onPresetSelect,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => onPresetSelect(7)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Last 7 days
        </button>
        <button
          onClick={() => onPresetSelect(30)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Last 30 days
        </button>
        <button
          onClick={() => onPresetSelect(90)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Last 90 days
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedDateRange.startDate}
            onChange={onStartDateChange}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedDateRange.endDate}
            onChange={onEndDateChange}
            max={new Date().toISOString().split("T")[0]}
            min={selectedDateRange.startDate}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
