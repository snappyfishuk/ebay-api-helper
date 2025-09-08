import React from "react";
import { LogOut } from "lucide-react";

// Auth Components
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";

// Page Components
import EbayApiAccountingHelper from "./EbayApiAccountingHelper";

// Auth Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import your existing User type
import { User } from "./types/user.types";

// Main App Content Component (uses AuthContext)
const AppContent: React.FC = () => {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = React.useState<"login" | "register">("login");

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Authentication screens
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              eBay API Helper
            </h1>
            <p className="text-xl text-gray-600">
              Sync your eBay transactions with FreeAgent
            </p>
          </div>

          {authMode === "login" ? (
            <LoginForm
              onLogin={() => {
                // Login handled by AuthContext
                // Component will re-render when auth state changes
              }}
              switchToRegister={() => setAuthMode("register")}
            />
          ) : (
            <RegisterForm
              onRegister={() => {
                // Register handled by AuthContext
                // Component will re-render when auth state changes
              }}
              switchToLogin={() => setAuthMode("login")}
            />
          )}
        </div>
      </div>
    );
  }

  // Main app - Simple header with just user info and logout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header - Just User Info and Logout */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo only */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  eBay API Helper
                </h1>
              </div>
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center">
              {/* User Info */}
              <div className="flex items-center mr-4">
                <div className="text-right mr-4">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email
                    }
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - All navigation handled by EbayApiAccountingHelper */}
      <main className="flex-1">
        <EbayApiAccountingHelper user={user} />
      </main>

      {/* Debug Component - Remove this in production */}
      <AuthDebug />
    </div>
  );
};

// Main App Component (wraps with AuthProvider)
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;