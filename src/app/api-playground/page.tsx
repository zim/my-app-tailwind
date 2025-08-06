'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiResponse {
    data: any;
    status: number;
    loading: boolean;
    error: string | null;
    timestamp: string;
}

interface ApiEndpoint {
    name: string;
    url: string;
    description: string;
    category: 'finance' | 'general' | 'fun' | 'data';
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
    // Finance APIs
    {
        name: 'Exchange Rates',
        url: 'https://api.exchangerate-api.com/v4/latest/USD',
        description: 'Get current exchange rates for USD',
        category: 'finance',
        method: 'GET'
    },
    {
        name: 'UK Exchange Rates',
        url: 'https://api.exchangerate-api.com/v4/latest/GBP',
        description: 'Get current exchange rates for GBP',
        category: 'finance',
        method: 'GET'
    },

    // General APIs
    {
        name: 'JSONPlaceholder Posts',
        url: 'https://jsonplaceholder.typicode.com/posts?_limit=15',
        description: 'Sample posts data for testing',
        category: 'general',
        method: 'GET'
    },
    {
        name: 'JSONPlaceholder Users',
        url: 'https://jsonplaceholder.typicode.com/users?_limit=3',
        description: 'Sample user data for testing',
        category: 'general',
        method: 'GET'
    },
    {
        name: 'REST Countries',
        url: 'https://restcountries.com/v3.1/region/europe?fields=name,capital,population,currencies',
        description: 'European countries data',
        category: 'data',
        method: 'GET'
    },
    {
        name: 'Dog Facts',
        url: 'https://dogapi.dog/api/v2/facts?limit=3',
        description: 'Random dog facts',
        category: 'fun',
        method: 'GET'
    },
    {
        name: 'Cat Fact',
        url: 'https://catfact.ninja/fact',
        description: 'Random cat fact',
        category: 'fun',
        method: 'GET'
    },
    {
        name: 'Random Joke',
        url: 'https://official-joke-api.appspot.com/random_joke',
        description: 'Random programming joke',
        category: 'fun',
        method: 'GET'
    },
];

export default function ApiPlaygroundPage() {
    const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
    const [customUrl, setCustomUrl] = useState('');
    const [customHeaders, setCustomHeaders] = useState('{}');
    const [customBody, setCustomBody] = useState('');
    const [customMethod, setCustomMethod] = useState<'GET' | 'POST'>('GET');
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [history, setHistory] = useState<Array<{ api: string; response: ApiResponse }>>([]);

    const callApi = async (endpoint: ApiEndpoint | null, isCustom = false) => {
        const apiToCall = isCustom ? {
            name: 'Custom API',
            url: customUrl,
            description: 'Custom API call',
            category: 'general' as const,
            method: customMethod,
            headers: customHeaders ? JSON.parse(customHeaders) : undefined,
            body: customBody || undefined
        } : endpoint;

        if (!apiToCall?.url) return;

        setResponse({
            data: null,
            status: 0,
            loading: true,
            error: null,
            timestamp: new Date().toISOString()
        });

        try {
            const fetchOptions: RequestInit = {
                method: apiToCall.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...apiToCall.headers
                }
            };

            if (apiToCall.method === 'POST' && apiToCall.body) {
                fetchOptions.body = apiToCall.body;
            }

            const res = await fetch(apiToCall.url, fetchOptions);
            const data = await res.json();

            const newResponse: ApiResponse = {
                data,
                status: res.status,
                loading: false,
                error: res.ok ? null : `HTTP ${res.status}: ${res.statusText}`,
                timestamp: new Date().toISOString()
            };

            setResponse(newResponse);

            // Add to history
            setHistory(prev => [
                { api: apiToCall.name, response: newResponse },
                ...prev.slice(0, 9) // Keep last 10
            ]);

        } catch (error) {
            const errorResponse: ApiResponse = {
                data: null,
                status: 0,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };

            setResponse(errorResponse);
            setHistory(prev => [
                { api: apiToCall.name, response: errorResponse },
                ...prev.slice(0, 9)
            ]);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'finance': return 'bg-green-100 text-green-800 border-green-200';
            case 'general': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'fun': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'data': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatJson = (obj: any) => {
        return JSON.stringify(obj, null, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">API Playground</h1>
                        <p className="text-gray-600 mt-2">Experiment with different APIs and test responses</p>
                    </div>
                    <Link
                        href="/budget"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        ← Back to Budget App
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - API Selection */}
                    <div className="space-y-6">
                        {/* Predefined APIs */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Predefined APIs</h2>
                            <div className="space-y-3">
                                {API_ENDPOINTS.map((api, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedApi === api ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                            }`}
                                        onClick={() => setSelectedApi(api)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">{api.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(api.category)}`}>
                                                    {api.category}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                                    {api.method}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{api.description}</p>
                                        <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {api.url}
                                        </code>
                                    </div>
                                ))}
                            </div>
                            {selectedApi && (
                                <button
                                    onClick={() => callApi(selectedApi)}
                                    disabled={response?.loading}
                                    className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                                >
                                    {response?.loading ? 'Calling API...' : `Call ${selectedApi.name} API`}
                                </button>
                            )}
                        </div>

                        {/* Custom API */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom API Call</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                    <select
                                        value={customMethod}
                                        onChange={(e) => setCustomMethod(e.target.value as 'GET' | 'POST')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                        type="url"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        placeholder="https://api.example.com/endpoint"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON)</label>
                                    <textarea
                                        value={customHeaders}
                                        onChange={(e) => setCustomHeaders(e.target.value)}
                                        placeholder='{"Authorization": "Bearer token"}'
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {customMethod === 'POST' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Body (JSON)</label>
                                        <textarea
                                            value={customBody}
                                            onChange={(e) => setCustomBody(e.target.value)}
                                            placeholder='{"key": "value"}'
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={() => callApi(null, true)}
                                    disabled={!customUrl || response?.loading}
                                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                                >
                                    {response?.loading ? 'Calling API...' : 'Call Custom API'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Response */}
                    <div className="space-y-6">
                        {/* Current Response */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Response</h2>

                            {!response ? (
                                <div className="text-gray-500 text-center py-8">
                                    Select an API and click "Call API" to see the response
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Status:</span>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${response.status >= 200 && response.status < 300
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {response.loading ? 'Loading...' : response.status || 'Error'}
                                        </span>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Time:</span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(response.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    {/* Error */}
                                    {response.error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <h4 className="text-red-800 font-medium">Error:</h4>
                                            <p className="text-red-600 text-sm mt-1">{response.error}</p>
                                        </div>
                                    )}

                                    {/* Loading */}
                                    {response.loading && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                <span className="text-blue-600">Loading...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Data */}
                                    {response.data && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Response Data:</h4>
                                            <pre className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-xs overflow-auto max-h-96">
                                                {formatJson(response.data)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* API History */}
                        {history.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Calls</h2>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {history.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                            onClick={() => setResponse(item.response)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{item.api}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${item.response.status >= 200 && item.response.status < 300
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {item.response.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(item.response.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Examples */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 Quick Examples to Try</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-medium text-green-800">Currency for Budget App</h3>
                            <p className="text-sm text-green-600 mt-1">Try the Exchange Rates API to add live currency conversion to your budget app</p>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-medium text-blue-800">Test Data</h3>
                            <p className="text-sm text-blue-600 mt-1">Use JSONPlaceholder for testing components with sample data</p>
                        </div>
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h3 className="font-medium text-purple-800">Fun APIs</h3>
                            <p className="text-sm text-purple-600 mt-1">Try the joke or fact APIs for adding fun elements to your app</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}