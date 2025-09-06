// components/SyncButton.js
import React from "react";
import { Upload } from "lucide-react";

const SyncButton = ({ onSync, disabled, isLoading, entryCount }) => {
  return (
    <button
      onClick={onSync}
      disabled={disabled || isLoading}
      className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
        disabled
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      <Upload className="h-4 w-4" />
      <span>
        {isLoading ? "Syncing..." : `Sync ${entryCount} Transactions`}
      </span>
    </button>
  );
};

export default SyncButton;
