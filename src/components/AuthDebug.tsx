// Add this component temporarily to debug auth issues
// src/components/AuthDebug.tsx

import React, { useState } from 'react';

const AuthDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testToken = async () => {
    const token = localStorage.getItem('token');
    setTestResult(`Token exists: ${!!token}\nToken length: ${token?.length || 0}`);

    if (!token) {
      setTestResult(prev => prev + '\n❌ No token found');
      return;
    }

    try {
      // Test the /me endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      setTestResult(prev => prev + `\n\nResponse Status: ${response.status}`);
      setTestResult(prev => prev + `\nResponse OK: ${response.ok}`);

      if (response.ok) {
        const data = await response.json();
        setTestResult(prev => prev + `\n✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        setTestResult(prev => prev + `\n❌ Error: ${errorText}`);
      }
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Network Error: ${error}`);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    setTestResult('Token cleared');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-md">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-2">
        <button 
          onClick={testToken}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Token
        </button>
        <button 
          onClick={clearToken}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-2"
        >
          Clear Token
        </button>
      </div>
      {testResult && (
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {testResult}
        </pre>
      )}
    </div>
  );
};

export default AuthDebug;