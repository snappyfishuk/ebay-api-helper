// components/layout/Header.js - Clean, consolidated header
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, RefreshCw, Zap, LogOut, Menu, X } from "lucide-react";

const Header = ({
  user,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  connections,
}) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-8">
              <h1 className="text-xl font-bold text-gray-900">
                eBay API Helper
              </h1>
            </div>

            {/* Desktop Navigation */}
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

          {/* Right side - User info and status */}
          <div className="flex items-center">
            {/* CLEAN STATUS DISPLAY - No redundancy */}
            <div className="hidden md:flex items-center space-x-4 mr-6">
              <div className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </div>

              {/* SINGLE CONNECTION STATUS */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      connections.ebay.isConnected
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-600">
                    eBay:{" "}
                    {connections.ebay.isConnected
                      ? "Connected"
                      : "Not Connected"}
                  </span>
                </div>

                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      connections.freeagent.isConnected
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-600">
                    FreeAgent:{" "}
                    {connections.freeagent.isConnected
                      ? "Connected"
                      : "Not Connected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
              {/* User info on mobile */}
              <div className="px-3 py-2 border-b border-gray-200 mb-2">
                <div className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>

                {/* Mobile connection status */}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${
                        connections.ebay.isConnected
                          ? "bg-green-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">eBay</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${
                        connections.freeagent.isConnected
                          ? "bg-green-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-600">FreeAgent</span>
                  </div>
                </div>
              </div>

              {/* Mobile navigation */}
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

              {/* Mobile logout */}
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
