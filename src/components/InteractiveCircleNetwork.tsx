'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { filterByText, filterByProperty } from '@/utils/filter';

interface CircleNode {
  id: string;
  name: string;
  type: 'Researcher' | 'BookPublication' | 'OtherPublication' | 'Publisher';
  connections: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface CircleLink {
  id: string;
  source: string | CircleNode;
  target: string | CircleNode;
  strength: number;
}

interface CircleNetworkData {
  nodes: CircleNode[];
  links: CircleLink[];
}

interface InteractiveCircleNetworkProps {
  width?: number;
  height?: number;
  graphmlUrl?: string;
  maxNodes?: number;
}

export default function InteractiveCircleNetwork({
  width = 1200,
  height = 800,
  graphmlUrl = '/interesting_candidates_v5.graphml',
  maxNodes = 200
}: InteractiveCircleNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rawData, setRawData] = useState<CircleNetworkData | null>(null);
  const [filteredData, setFilteredData] = useState<CircleNetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [minConnections, setMinConnections] = useState(0);
  const [simulation, setSimulation] = useState<d3.Simulation<CircleNode, CircleLink> | null>(null);

  // Parse GraphML into circle network format
  const parseCircleNetwork = (xmlString: string): CircleNetworkData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    if (xmlDoc.querySelector('parsererror')) {
      throw new Error('Invalid GraphML format');
    }

    const nodeMap = new Map<string, CircleNode>();
    const connectionCounts = new Map<string, Set<string>>();
    const links: CircleLink[] = [];

    // First pass: collect all nodes
    const nodeElements = xmlDoc.querySelectorAll('node');
    nodeElements.forEach(nodeEl => {
      const id = nodeEl.getAttribute('id') || '';
      const match = id.match(/\('([^']+)', '([^']+)'\)/);

      if (match) {
        const [, type, name] = match;
        nodeMap.set(id, {
          id,
          name: name.length > 50 ? name.substring(0, 50) + '...' : name,
          type: type as CircleNode['type'],
          connections: 0
        });
        connectionCounts.set(id, new Set());
      }
    });

    // Second pass: collect edges and count connections
    const edgeElements = xmlDoc.querySelectorAll('edge');
    edgeElements.forEach(edgeEl => {
      const source = edgeEl.getAttribute('source') || '';
      const target = edgeEl.getAttribute('target') || '';

      if (nodeMap.has(source) && nodeMap.has(target)) {
        connectionCounts.get(source)?.add(target);
        connectionCounts.get(target)?.add(source);

        links.push({
          id: `${source}-${target}`,
          source,
          target,
          strength: Math.random() * 0.5 + 0.5 // Random strength between 0.5-1
        });
      }
    });

    // Update connection counts
    nodeMap.forEach((node, id) => {
      node.connections = connectionCounts.get(id)?.size || 0;
    });

    // Sort by connections and limit
    const sortedNodes = Array.from(nodeMap.values())
      .sort((a, b) => b.connections - a.connections)
      .slice(0, maxNodes);

    const nodeIds = new Set(sortedNodes.map(n => n.id));
    const filteredLinks = links.filter(l =>
      nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
    );

    return {
      nodes: sortedNodes,
      links: filteredLinks
    };
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
        const data = parseCircleNetwork(xmlString);
        setRawData(data);
        setFilteredData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [graphmlUrl, maxNodes]);

  // Apply filters
  useEffect(() => {
    if (!rawData) return;

    let filtered = { ...rawData };

    // Filter by type
    if (selectedType !== 'all') {
      filtered.nodes = filterByProperty(rawData.nodes, 'type', selectedType as CircleNode['type']);
    }

    // Filter by search term
    if (searchTerm) {
      filtered.nodes = filterByText(filtered.nodes, searchTerm, ['name'] as any);
    }

    // Filter by minimum connections
    if (minConnections > 0) {
      filtered.nodes = filtered.nodes.filter(n => n.connections >= minConnections);
    }

    // Update links to match filtered nodes
    const nodeIds = new Set(filtered.nodes.map(n => n.id));
    filtered.links = rawData.links.filter(l =>
      nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
    );

    setFilteredData(filtered);
  }, [rawData, selectedType, searchTerm, minConnections]);

  // Create visualization
  useEffect(() => {
    if (!svgRef.current || !filteredData) return;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append('g');

    // Color and size scales
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Researcher', 'BookPublication', 'OtherPublication', 'Publisher'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444']);

    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(filteredData.nodes, d => d.connections) as [number, number])
      .range([8, 25])
      .clamp(true);

    // Create force simulation
    const newSimulation = d3.forceSimulation<CircleNode>(filteredData.nodes)
      .force('link', d3.forceLink<CircleNode, CircleLink>(filteredData.links)
        .id(d => d.id)
        .distance(d => {
          const sourceSize = sizeScale((d.source as CircleNode).connections);
          const targetSize = sizeScale((d.target as CircleNode).connections);
          return (sourceSize + targetSize) * 1.5 + 30;
        })
        .strength(0.4)
      )
      .force('charge', d3.forceManyBody()
        .strength((d: any) => -200 - (sizeScale((d as CircleNode).connections) * 8))
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<CircleNode>()
        .radius(d => sizeScale(d.connections) + 3)
        .strength(0.9)
      );

    setSimulation(newSimulation);

    // Create links with gradients
    const defs = svg.append('defs');

    // Create gradients for links
    filteredData.links.forEach((link, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `linkGradient${i}`)
        .attr('gradientUnits', 'userSpaceOnUse');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#94a3b8')
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#cbd5e1')
        .attr('stop-opacity', 0.3);
    });

    // Create links
    const links = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredData.links)
      .enter()
      .append('line')
      .attr('stroke', (d, i) => `url(#linkGradient${i})`)
      .attr('stroke-width', d => Math.sqrt(d.strength * 4))
      .attr('stroke-opacity', 0.6);

    // Create node groups
    const nodeGroups = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer');

    // Add circles with shadows
    nodeGroups.append('circle')
      .attr('class', 'node-shadow')
      .attr('r', d => sizeScale(d.connections))
      .attr('fill', '#000')
      .attr('opacity', 0.1)
      .attr('transform', 'translate(2,2)');

    // Add main circles
    const nodes = nodeGroups.append('circle')
      .attr('class', 'node-main')
      .attr('r', d => sizeScale(d.connections))
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

    // Add node labels (shown for larger nodes)
    const labels = nodeGroups.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => `${Math.max(8, sizeScale(d.connections) / 2)}px`)
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .style('pointer-events', 'none')
      .text(d => {
        const radius = sizeScale(d.connections);
        if (radius < 12) return '';
        return d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name;
      });

    // Add drag behavior
    const drag = d3.drag<SVGGElement, CircleNode>()
      .on('start', (event, d) => {
        if (!event.active) newSimulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) newSimulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(drag);

    // Add hover effects
    nodeGroups
      .on('mouseover', function (event, d) {
        const group = d3.select(this);

        // Enlarge node
        group.select('.node-main')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.connections) * 1.3)
          .attr('stroke-width', 3);

        group.select('.node-shadow')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.connections) * 1.3)
          .attr('opacity', 0.2);

        // Highlight connected links
        links.style('stroke-opacity', l =>
          (l.source === d || l.target === d) ? 1 : 0.1
        );

        // Show tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'circle-tooltip')
          .style('position', 'absolute')
          .style('background', 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7))')
          .style('color', 'white')
          .style('padding', '12px')
          .style('border-radius', '8px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
          .style('border', `2px solid ${colorScale(d.type)}`)
          .html(`
            <div style="font-weight: bold; margin-bottom: 6px; color: ${colorScale(d.type)};">${d.name}</div>
            <div style="margin-bottom: 2px;">Type: ${d.type}</div>
            <div style="margin-bottom: 2px;">Connections: ${d.connections}</div>
            <div style="font-size: 10px; opacity: 0.8;">Click and drag to move</div>
          `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function (event, d) {
        const group = d3.select(this);

        // Reset node size
        group.select('.node-main')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.connections))
          .attr('stroke-width', 2);

        group.select('.node-shadow')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.connections))
          .attr('opacity', 0.1);

        // Reset links
        links.style('stroke-opacity', 0.6);

        // Remove tooltip
        d3.selectAll('.circle-tooltip').remove();
      });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as CircleNode).x || 0)
        .attr('y1', d => (d.source as CircleNode).y || 0)
        .attr('x2', d => (d.target as CircleNode).x || 0)
        .attr('y2', d => (d.target as CircleNode).y || 0);

      nodeGroups
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

      // Update gradients
      filteredData.links.forEach((link, i) => {
        const sourceNode = link.source as CircleNode;
        const targetNode = link.target as CircleNode;

        defs.select(`#linkGradient${i}`)
          .attr('x1', sourceNode.x || 0)
          .attr('y1', sourceNode.y || 0)
          .attr('x2', targetNode.x || 0)
          .attr('y2', targetNode.y || 0);
      });
    });

    // Cleanup
    return () => {
      newSimulation.stop();
      d3.selectAll('.circle-tooltip').remove();
    };

  }, [filteredData, width, height]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [simulation]);

  const nodeTypeCounts = rawData ? {
    Researcher: rawData.nodes.filter(n => n.type === 'Researcher').length,
    BookPublication: rawData.nodes.filter(n => n.type === 'BookPublication').length,
    OtherPublication: rawData.nodes.filter(n => n.type === 'OtherPublication').length,
    Publisher: rawData.nodes.filter(n => n.type === 'Publisher').length
  } : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading interactive circle network...</div>
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
          Interactive Circle Network
        </h3>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Researcher">Researchers ({nodeTypeCounts.Researcher})</option>
            <option value="BookPublication">Book Pubs ({nodeTypeCounts.BookPublication})</option>
            <option value="OtherPublication">Other Pubs ({nodeTypeCounts.OtherPublication})</option>
            <option value="Publisher">Publishers ({nodeTypeCounts.Publisher})</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Min Connections:</label>
            <input
              type="range"
              min="0"
              max="20"
              value={minConnections}
              onChange={(e) => setMinConnections(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-8">{minConnections}</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span>Nodes: {filteredData?.nodes.length || 0}</span>
          <span>Links: {filteredData?.links.length || 0}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Researchers</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Book Pubs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Other Pubs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Publishers</span>
            </div>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded bg-gradient-to-br from-gray-50 to-white"
      />

      <div className="mt-4 text-xs text-gray-500">
        🔍 Scroll to zoom • 🖱️ Drag nodes to reposition • 🎯 Hover for details •
        Node size = connection count • Limited to top {maxNodes} connected entities
      </div>
    </div>
  );
}
