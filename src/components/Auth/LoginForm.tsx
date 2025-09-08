import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import TwoFactorVerification from "../TwoFactorVerification";
import { makePublicRequest } from "../../utils/apiUtils";

interface LoginFormProps {
  onLogin: () => void;
  switchToRegister: () => void;
}

interface FormData {
  email: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, switchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await attemptLogin();
  };

  const attemptLogin = async (twoFactorToken?: string, isBackupCode?: boolean) => {
    setLoading(true);
    setError("");

    try {
      const requestBody = {
        ...formData,
        ...(twoFactorToken && { 
          twoFactorToken, 
          isBackupCode: isBackupCode || false 
        }),
      };

      // Use the new API utility instead of manual fetch
      const responseData = await makePublicRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      if (responseData.status === "2fa_required") {
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }
      
      if (responseData.status === "success") {
        if (responseData.data && responseData.data.user && responseData.token) {
          login(responseData.data.user, responseData.token);
          onLogin();
        } else {
          setError("Invalid response structure from server");
        }
      } else {
        setError(responseData.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error.message?.includes('429')) {
        setError('Too many requests. Please wait 15 minutes and try again.');
      } else if (error.message?.includes('401')) {
        setError('Incorrect email or password');
      } else if (error.message?.includes('Network')) {
        setError("Network error - please check your connection and try again");
      } else {
        setError(error.message || "Login failed - please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerified = (token: string, isBackupCode: boolean) => {
    attemptLogin(token, isBackupCode);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (requiresTwoFactor) {
    return (
      <TwoFactorVerification
        onVerified={handleTwoFactorVerified}
        onCancel={() => {
          setRequiresTwoFactor(false);
          setError('');
        }}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">
            Sign in to your eBay Helper account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && !error.includes('Too many requests') && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {error && error.includes('Too many requests') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-yellow-800 font-medium">Rate Limited</h4>
                  <p className="text-yellow-700 text-sm">
                    Too many requests detected. Please wait 15 minutes before trying to log in again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={switchToRegister}
            className="text-blue-600 hover:underline"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;