'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BarChart from '@/components/BarChart';
import GraphMLViewer from '@/components/GraphMLViewer';
import ResearchNetworkViewer from '@/components/ResearchNetworkViewer';
import ResearchHierarchyViewer from '@/components/ResearchHierarchyViewer';
import InteractiveCircleNetwork from '@/components/InteractiveCircleNetwork';
import { filterByNumericRange } from '@/utils/filter';

interface SalesData {
  month: string;
  sales: number;
  target: number;
}

export default function D3DemoPage() {
  const [salesData] = useState<SalesData[]>([
    { month: 'Jan', sales: 120, target: 100 },
    { month: 'Feb', sales: 150, target: 120 },
    { month: 'Mar', sales: 180, target: 160 },
    { month: 'Apr', sales: 200, target: 180 },
    { month: 'May', sales: 160, target: 190 },
    { month: 'Jun', sales: 220, target: 200 },
  ]);

  const [minSales, setMinSales] = useState<number>(0);
  const [maxSales, setMaxSales] = useState<number>(250);

  // Visibility states for each chart section
  const [visibleSections, setVisibleSections] = useState({
    barCharts: false,
    networkGraph: false,
    researchNetwork: false,
    hierarchicalViews: false,
    circleNetwork: false,
    dataTable: false
  });

  // Toggle function for sections
  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter data using our custom filter function
  const filteredData = filterByNumericRange(salesData, 'sales', minSales, maxSales);

  // Transform data for D3 chart
  const chartData = filteredData.map(item => ({
    name: item.month,
    value: item.sales
  }));

  const targetData = filteredData.map(item => ({
    name: item.month,
    value: item.target
  }));

  // Collapsible Section Component
  const CollapsibleSection = ({
    title,
    isVisible,
    onToggle,
    children,
    icon = "📊"
  }: {
    title: string;
    isVisible: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    icon?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {isVisible ? 'Click to minimize' : 'Click to expand'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isVisible ? 'rotate-180' : 'rotate-0'
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isVisible && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            D3.js Demo
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                D3.js Visualizations
              </h2>
              <p className="text-gray-600 mb-4">
                This demo shows how to integrate D3.js with Next.js and React, including
                bar charts and network graphs from GraphML files.
              </p>
            </div>

            {/* Global Controls */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setVisibleSections({
                  barCharts: true,
                  networkGraph: true,
                  researchNetwork: true,
                  hierarchicalViews: true,
                  circleNetwork: true,
                  dataTable: true
                })}
                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                📖 Expand All
              </button>
              <button
                onClick={() => setVisibleSections({
                  barCharts: false,
                  networkGraph: false,
                  researchNetwork: false,
                  hierarchicalViews: false,
                  circleNetwork: false,
                  dataTable: false
                })}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                📄 Collapse All
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Min Sales:</span>
              <input
                type="number"
                value={minSales}
                onChange={(e) => setMinSales(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="300"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Max Sales:</span>
              <input
                type="number"
                value={maxSales}
                onChange={(e) => setMaxSales(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="300"
              />
            </label>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Bar Charts */}
          <CollapsibleSection
            title="Sales Dashboard (Bar Charts)"
            icon="📊"
            isVisible={visibleSections.barCharts}
            onToggle={() => toggleSection('barCharts')}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Actual Sales
                </h3>
                <BarChart data={chartData} width={500} height={300} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Sales Targets
                </h3>
                <BarChart data={targetData} width={500} height={300} />
              </div>
            </div>
          </CollapsibleSection>

          {/* GraphML Network Visualization */}
          <CollapsibleSection
            title="Network Graph (Sample GraphML)"
            icon="🕸️"
            isVisible={visibleSections.networkGraph}
            onToggle={() => toggleSection('networkGraph')}
          >
            <GraphMLViewer width={800} height={400} />
          </CollapsibleSection>

          {/* Research Network from interesting_candidates_v5.graphml */}
          <CollapsibleSection
            title="Academic Research Network (Force-Directed)"
            icon="🎓"
            isVisible={visibleSections.researchNetwork}
            onToggle={() => toggleSection('researchNetwork')}
          >
            <ResearchNetworkViewer width={1000} height={600} maxNodes={150} />
          </CollapsibleSection>

          {/* Alternative Hierarchical Views */}
          <CollapsibleSection
            title="Research Network - Hierarchical Views"
            icon="📊"
            isVisible={visibleSections.hierarchicalViews}
            onToggle={() => toggleSection('hierarchicalViews')}
          >
            <ResearchHierarchyViewer width={1000} height={600} maxNodes={100} />
          </CollapsibleSection>

          {/* Interactive Circle Network */}
          <CollapsibleSection
            title="Interactive Circle Network"
            icon="🔵"
            isVisible={visibleSections.circleNetwork}
            onToggle={() => toggleSection('circleNetwork')}
          >
            <InteractiveCircleNetwork width={1200} height={700} maxNodes={180} />
          </CollapsibleSection>
        </div>

        {/* Data Table */}
        <CollapsibleSection
          title={`Filtered Data (${filteredData.length} months)`}
          icon="📋"
          isVisible={visibleSections.dataTable}
          onToggle={() => toggleSection('dataTable')}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Month</th>
                  <th className="px-6 py-3">Sales</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Difference</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.month}
                    </td>
                    <td className="px-6 py-4">
                      ${item.sales}
                    </td>
                    <td className="px-6 py-4">
                      ${item.target}
                    </td>
                    <td className={`px-6 py-4 ${item.sales >= item.target ? 'text-green-600' : 'text-red-600'
                      }`}>
                      ${item.sales - item.target}
                      ({item.sales >= item.target ? '+' : ''}{((item.sales - item.target) / item.target * 100).toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            D3.js Features Demonstrated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Bar Charts</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• Animated transitions</li>
                <li>• Custom filter integration</li>
                <li>• SVG rendering</li>
                <li>• Dynamic scaling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Network Graphs</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• GraphML file parsing</li>
                <li>• Force-directed layout</li>
                <li>• Interactive dragging</li>
                <li>• Zoom and pan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Hierarchical Views</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• Radial tree layout</li>
                <li>• Traditional tree structure</li>
                <li>• Sunburst proportional view</li>
                <li>• Grouped by entity types</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Circle Networks</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• Smooth hover effects</li>
                <li>• Advanced filtering</li>
                <li>• Gradient connections</li>
                <li>• Dynamic node sizing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
