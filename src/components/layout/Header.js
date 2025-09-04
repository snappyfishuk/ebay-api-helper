// components/layout/Header.js - Simple version without connection status
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, RefreshCw, Zap, LogOut, Menu, X } from "lucide-react";

const Header = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-8">
              <h1 className="text-xl font-bold text-gray-900">
                eBay API Helper
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </NavLink>

              <NavLink
                to="/sync"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Manual Sync
              </NavLink>

              <NavLink
                to="/auto-sync"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                <Zap className="mr-2 h-4 w-4" />
                Auto-Sync
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center">
            <div className="hidden md:flex items-center mr-4">
              <div className="text-right mr-4">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </NavLink>

              <NavLink
                to="/sync"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <RefreshCw className="mr-3 h-5 w-5" />
                Manual Sync
              </NavLink>

              <NavLink
                to="/auto-sync"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Zap className="mr-3 h-5 w-5" />
                Auto-Sync
              </NavLink>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
