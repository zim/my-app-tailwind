'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { filterByProperty, filterByText } from '@/utils/filter';

interface HierarchyNode {
  id: string;
  name: string;
  type: 'Researcher' | 'BookPublication' | 'OtherPublication' | 'Publisher';
  connections: number;
  children?: HierarchyNode[];
  parent?: HierarchyNode;
  x?: number;
  y?: number;
}

interface ResearchHierarchyViewerProps {
  width?: number;
  height?: number;
  graphmlUrl?: string;
  maxNodes?: number;
}

export default function ResearchHierarchyViewer({
  width = 1000,
  height = 700,
  graphmlUrl = '/interesting_candidates_v5.graphml',
  maxNodes = 100
}: ResearchHierarchyViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'radial' | 'tree' | 'sunburst'>('radial');
  const [searchTerm, setSearchTerm] = useState('');

  // Parse GraphML and create hierarchy
  const parseToHierarchy = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const nodes = new Map();
    const connections = new Map();

    // Parse nodes
    const nodeElements = xmlDoc.querySelectorAll('node');
    nodeElements.forEach(nodeEl => {
      const id = nodeEl.getAttribute('id') || '';
      const labelEl = nodeEl.querySelector('data[key="labels"]');

      const match = id.match(/\('([^']+)', '([^']+)'\)/);
      if (match) {
        const [, type, name] = match;
        nodes.set(id, {
          id,
          name: name.length > 40 ? name.substring(0, 40) + '...' : name,
          type,
          connections: 0
        });
        connections.set(id, new Set());
      }
    });

    // Parse edges and count connections
    const edgeElements = xmlDoc.querySelectorAll('edge');
    edgeElements.forEach(edgeEl => {
      const source = edgeEl.getAttribute('source') || '';
      const target = edgeEl.getAttribute('target') || '';

      if (connections.has(source)) {
        connections.get(source).add(target);
      }
      if (connections.has(target)) {
        connections.get(target).add(source);
      }
    });

    // Update connection counts
    for (const [nodeId, node] of nodes) {
      node.connections = connections.get(nodeId)?.size || 0;
    }

    // Limit nodes and sort by connections
    const sortedNodes = Array.from(nodes.values())
      .sort((a, b) => b.connections - a.connections)
      .slice(0, maxNodes);

    // Group by type
    const hierarchy = {
      name: 'Research Network',
      children: [
        {
          name: 'Researchers',
          type: 'group',
          children: sortedNodes.filter(n => n.type === 'Researcher').slice(0, 20)
        },
        {
          name: 'Publications',
          type: 'group',
          children: [
            {
              name: 'Book Publications',
              type: 'subgroup',
              children: sortedNodes.filter(n => n.type === 'BookPublication').slice(0, 15)
            },
            {
              name: 'Other Publications',
              type: 'subgroup',
              children: sortedNodes.filter(n => n.type === 'OtherPublication').slice(0, 15)
            }
          ]
        },
        {
          name: 'Publishers',
          type: 'group',
          children: sortedNodes.filter(n => n.type === 'Publisher').slice(0, 15)
        }
      ]
    };

    return { hierarchy, rawNodes: sortedNodes };
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(graphmlUrl);
        if (!response.ok) {
          throw new Error(`Failed to load GraphML file: ${response.statusText}`);
        }

        const xmlString = await response.text();
        const data = parseToHierarchy(xmlString);
        setRawData(data);
        setHierarchyData(data.hierarchy);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [graphmlUrl, maxNodes]);

  // Filter data based on search
  useEffect(() => {
    if (!rawData || !searchTerm) {
      setHierarchyData(rawData?.hierarchy);
      return;
    }

    const filteredNodes = filterByText(rawData.rawNodes, searchTerm, ['name'] as any);

    const filteredHierarchy = {
      name: 'Research Network (Filtered)',
      children: [
        {
          name: 'Researchers',
          type: 'group',
          children: filteredNodes.filter((n: any) => n.type === 'Researcher')
        },
        {
          name: 'Publications',
          type: 'group',
          children: [
            {
              name: 'Book Publications',
              type: 'subgroup',
              children: filteredNodes.filter((n: any) => n.type === 'BookPublication')
            },
            {
              name: 'Other Publications',
              type: 'subgroup',
              children: filteredNodes.filter((n: any) => n.type === 'OtherPublication')
            }
          ]
        },
        {
          name: 'Publishers',
          type: 'group',
          children: filteredNodes.filter((n: any) => n.type === 'Publisher')
        }
      ]
    };

    setHierarchyData(filteredHierarchy);
  }, [rawData, searchTerm]);

  // Create visualization
  useEffect(() => {
    if (!svgRef.current || !hierarchyData) return;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Color schemes
    const colorScale = d3.scaleOrdinal()
      .domain(['Researcher', 'BookPublication', 'OtherPublication', 'Publisher', 'group', 'subgroup'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6']);

    if (viewMode === 'radial') {
      createRadialChart();
    } else if (viewMode === 'tree') {
      createTreeChart();
    } else if (viewMode === 'sunburst') {
      createSunburstChart();
    }

    function createRadialChart() {
      const radius = Math.min(width, height) / 2 - 100;
      g.attr('transform', `translate(${width / 2},${height / 2})`);

      // Create hierarchy
      const root = d3.hierarchy(hierarchyData)
        .sum(d => d.connections || 1)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      // Create radial tree layout
      const tree = d3.tree<any>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

      tree(root);

      // Create links
      g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkRadial<any, any>()
          .angle((d: any) => d.x)
          .radius((d: any) => d.y))
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', 1.5);

      // Create nodes
      const node = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d: any) =>
          `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

      node.append('circle')
        .attr('r', (d: any) => Math.max(4, Math.min(12, (d.data.connections || 1) / 2 + 4)))
        .style('fill', (d: any) => String(colorScale(d.data.type || 'group')))
        .style('stroke', '#fff')
        .style('stroke-width', 2);

      // Add labels
      node.append('text')
        .attr('dy', '0.31em')
        .attr('x', (d: any) => d.x < Math.PI === !d.children ? 6 : -6)
        .attr('text-anchor', (d: any) => d.x < Math.PI === !d.children ? 'start' : 'end')
        .attr('transform', (d: any) => d.x >= Math.PI ? 'rotate(180)' : null)
        .text((d: any) => d.data.name)
        .style('font-size', (d: any) => d.depth === 0 ? '14px' : d.depth === 1 ? '12px' : '10px')
        .style('font-weight', (d: any) => d.depth <= 1 ? 'bold' : 'normal');
    }

    function createTreeChart() {
      const margin = { top: 20, right: 120, bottom: 20, left: 120 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      g.attr('transform', `translate(${margin.left},${margin.top})`);

      const root = d3.hierarchy(hierarchyData);
      const treeLayout = d3.tree<any>().size([innerHeight, innerWidth]);
      treeLayout(root);

      // Links
      g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal<any, any>()
          .x((d: any) => d.y)
          .y((d: any) => d.x))
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', 1.5);

      // Nodes
      const node = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

      node.append('circle')
        .attr('r', (d: any) => Math.max(4, Math.min(10, (d.data.connections || 1) / 3 + 3)))
        .style('fill', (d: any) => String(colorScale(d.data.type || 'group')))
        .style('stroke', '#fff')
        .style('stroke-width', 2);

      node.append('text')
        .attr('dy', '0.31em')
        .attr('x', (d: any) => d.children ? -12 : 12)
        .style('text-anchor', (d: any) => d.children ? 'end' : 'start')
        .text((d: any) => d.data.name)
        .style('font-size', (d: any) => d.depth === 0 ? '14px' : d.depth === 1 ? '12px' : '10px')
        .style('font-weight', (d: any) => d.depth <= 1 ? 'bold' : 'normal');
    }

    function createSunburstChart() {
      const radius = Math.min(width, height) / 2 - 50;
      g.attr('transform', `translate(${width / 2},${height / 2})`);

      const root = d3.hierarchy(hierarchyData)
        .sum(d => d.connections || 1)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const partition = d3.partition<any>()
        .size([2 * Math.PI, radius]);

      partition(root);

      const arc = d3.arc<any>()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

      g.selectAll('path')
        .data(root.descendants())
        .enter()
        .append('path')
        .attr('d', arc)
        .style('fill', (d: any) => String(colorScale(d.data.type || 'group')))
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('opacity', 0.8);

      // Add labels for larger segments
      g.selectAll('text')
        .data(root.descendants().filter((d: any) => d.depth && (d.y1 - d.y0) > 20))
        .enter()
        .append('text')
        .attr('transform', (d: any) => {
          const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
          const y = (d.y0 + d.y1) / 2;
          return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#333')
        .text((d: any) => d.data.name.length > 15 ? d.data.name.substring(0, 15) + '...' : d.data.name);
    }

    // Add zoom behavior for tree and radial
    if (viewMode !== 'sunburst') {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          g.attr('transform',
            viewMode === 'radial'
              ? `translate(${width / 2},${height / 2}) ${event.transform}`
              : `translate(120,20) ${event.transform}`
          );
        });

      svg.call(zoom);
    }

  }, [hierarchyData, viewMode, width, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading research hierarchy...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Research Network - Alternative Visualizations
        </h3>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search in network..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {(['radial', 'tree', 'sunburst'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Researchers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Book Publications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Other Publications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Publishers</span>
          </div>
        </div>

        {/* View descriptions */}
        <div className="text-sm text-gray-600 mb-4">
          {viewMode === 'radial' && "📡 Radial layout showing hierarchical relationships in a circular pattern"}
          {viewMode === 'tree' && "🌳 Tree layout displaying the academic hierarchy from left to right"}
          {viewMode === 'sunburst' && "☀️ Sunburst chart showing proportional distribution of entities"}
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
      />

      <div className="mt-4 text-xs text-gray-500">
        {viewMode !== 'sunburst' && "Scroll to zoom • Drag to pan • "}
        Node size represents connection count • Limited to {maxNodes} top-connected entities
      </div>
    </div>
  );
}
