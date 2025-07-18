'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { filterByProperty, filterByText } from '@/utils/filter';

interface ResearchNode {
  id: string;
  name: string;
  type: 'Researcher' | 'BookPublication' | 'OtherPublication' | 'Publisher';
  label: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface ResearchLink {
  id: string;
  source: string | ResearchNode;
  target: string | ResearchNode;
  label?: string;
}

interface ResearchData {
  nodes: ResearchNode[];
  links: ResearchLink[];
}

interface ResearchNetworkViewerProps {
  width?: number;
  height?: number;
  graphmlUrl?: string;
  maxNodes?: number;
}

export default function ResearchNetworkViewer({
  width = 1000,
  height = 700,
  graphmlUrl = '/interesting_candidates_v5.graphml',
  maxNodes = 200 // Limit nodes for performance
}: ResearchNetworkViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<ResearchData | null>(null);
  const [filteredData, setFilteredData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all');

  // Parse the academic GraphML format
  const parseResearchGraphML = (xmlString: string): ResearchData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid GraphML format');
    }

    const nodes: ResearchNode[] = [];
    const links: ResearchLink[] = [];

    // Extract nodes - parse the complex ID format like "('Researcher', '0000-0003-0427-0369')"
    const nodeElements = xmlDoc.querySelectorAll('node');
    nodeElements.forEach(nodeEl => {
      const id = nodeEl.getAttribute('id') || '';
      const labelEl = nodeEl.querySelector('data[key="labels"]');
      const label = labelEl?.textContent || '';

      // Parse the ID to extract type and name
      const match = id.match(/\('([^']+)', '([^']+)'\)/);
      if (match) {
        const [, type, name] = match;
        nodes.push({
          id,
          name: name.length > 60 ? name.substring(0, 60) + '...' : name, // Truncate long names
          type: type as ResearchNode['type'],
          label
        });
      }
    });

    // Extract edges
    const edgeElements = xmlDoc.querySelectorAll('edge');
    edgeElements.forEach(edgeEl => {
      const source = edgeEl.getAttribute('source') || '';
      const target = edgeEl.getAttribute('target') || '';
      const labelEl = edgeEl.querySelector('data[key="labels"]');

      links.push({
        id: `${source}-${target}`,
        source,
        target,
        label: labelEl?.textContent || ''
      });
    });

    // Limit nodes for performance (take a subset)
    const limitedNodes = nodes.slice(0, maxNodes);
    const nodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedLinks = links.filter(l =>
      nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
    );

    return { nodes: limitedNodes, links: limitedLinks };
  };

  // Load GraphML file
  useEffect(() => {
    const loadGraphML = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(graphmlUrl);
        if (!response.ok) {
          throw new Error(`Failed to load GraphML file: ${response.statusText}`);
        }

        const xmlString = await response.text();
        const data = parseResearchGraphML(xmlString);
        setGraphData(data);
        setFilteredData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadGraphML();
  }, [graphmlUrl, maxNodes]);

  // Apply filters
  useEffect(() => {
    if (!graphData) return;

    let filtered = { ...graphData };

    // Filter by node type
    if (selectedNodeType !== 'all') {
      filtered.nodes = filterByProperty(graphData.nodes, 'type', selectedNodeType as ResearchNode['type']);
      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.links = graphData.links.filter(l =>
        nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered.nodes = filterByText(filtered.nodes, searchTerm, ['name']);
      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.links = filtered.links.filter(l =>
        nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      );
    }

    setFilteredData(filtered);
  }, [graphData, searchTerm, selectedNodeType]);

  // Create D3 visualization
  useEffect(() => {
    if (!svgRef.current || !filteredData) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Color scheme for different node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Researcher', 'BookPublication', 'OtherPublication', 'Publisher'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444']);

    // Size scale for different node types
    const sizeScale = d3.scaleOrdinal<string, number>()
      .domain(['Researcher', 'BookPublication', 'OtherPublication', 'Publisher'])
      .range([25, 20, 18, 22]);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation<ResearchNode>(filteredData.nodes)
      .force('link', d3.forceLink<ResearchNode, ResearchLink>(filteredData.links)
        .id(d => d.id)
        .distance(d => {
          const sourceType = (d.source as ResearchNode).type;
          const targetType = (d.target as ResearchNode).type;
          if (sourceType === 'Researcher' && targetType === 'Publisher') return 80;
          if (sourceType === 'Researcher') return 60;
          return 40;
        })
      )
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => sizeScale((d as ResearchNode).type) + 3));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredData.nodes)
      .enter()
      .append('circle')
      .attr('r', d => sizeScale(d.type))
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels for important nodes (researchers and publishers)
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(filteredData.nodes.filter(d =>
        d.type === 'Researcher' || d.type === 'Publisher'
      ))
      .enter()
      .append('text')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#333')
      .style('pointer-events', 'none')
      .style('font-weight', 'bold');

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, ResearchNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Add hover effects and tooltips
    node.on('mouseover', function (event, d) {
      d3.select(this)
        .attr('r', sizeScale(d.type) + 5)
        .attr('stroke-width', 3);

      // Highlight connected links
      link.style('stroke-opacity', l =>
        (l.source === d || l.target === d) ? 0.8 : 0.1
      );

      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'research-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '6px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('max-width', '300px')
        .html(`
          <div style="font-weight: bold; margin-bottom: 4px;">${d.name}</div>
          <div style="color: ${colorScale(d.type)};">Type: ${d.type}</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">ID: ${d.id}</div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .attr('r', sizeScale(d.type))
          .attr('stroke-width', 2);

        link.style('stroke-opacity', 0.4);
        d3.selectAll('.research-tooltip').remove();
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as ResearchNode).x || 0)
        .attr('y1', d => (d.source as ResearchNode).y || 0)
        .attr('x2', d => (d.target as ResearchNode).x || 0)
        .attr('y2', d => (d.target as ResearchNode).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    return () => {
      simulation.stop();
      d3.selectAll('.research-tooltip').remove();
    };

  }, [filteredData, width, height]);

  const nodeTypeCounts = graphData ? {
    Researcher: graphData.nodes.filter(n => n.type === 'Researcher').length,
    BookPublication: graphData.nodes.filter(n => n.type === 'BookPublication').length,
    OtherPublication: graphData.nodes.filter(n => n.type === 'OtherPublication').length,
    Publisher: graphData.nodes.filter(n => n.type === 'Publisher').length
  } : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading research network...</div>
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
          Academic Research Network
        </h3>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search researchers, publications, publishers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedNodeType}
            onChange={(e) => setSelectedNodeType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Researcher">Researchers ({nodeTypeCounts.Researcher})</option>
            <option value="BookPublication">Book Publications ({nodeTypeCounts.BookPublication})</option>
            <option value="OtherPublication">Other Publications ({nodeTypeCounts.OtherPublication})</option>
            <option value="Publisher">Publishers ({nodeTypeCounts.Publisher})</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span>Showing: {filteredData?.nodes.length || 0} nodes, {filteredData?.links.length || 0} connections</span>
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
        className="border border-gray-200 rounded"
      />

      <div className="mt-4 text-xs text-gray-500">
        Drag nodes to reposition • Scroll to zoom • Hover for details • Limited to {maxNodes} nodes for performance
      </div>
    </div>
  );
}
