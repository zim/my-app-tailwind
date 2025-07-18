'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphMLViewerProps {
  width?: number;
  height?: number;
  graphmlUrl?: string;
}

export default function GraphMLViewer({
  width = 800,
  height = 600,
  graphmlUrl = '/sample-network.graphml'
}: GraphMLViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse GraphML XML to extract nodes and links
  const parseGraphML = (xmlString: string): GraphData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid GraphML format');
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Extract nodes
    const nodeElements = xmlDoc.querySelectorAll('node');
    nodeElements.forEach(nodeEl => {
      const id = nodeEl.getAttribute('id') || '';
      const nameEl = nodeEl.querySelector('data[key="name"]');
      const typeEl = nodeEl.querySelector('data[key="type"]');

      nodes.push({
        id,
        name: nameEl?.textContent || id,
        type: typeEl?.textContent || 'default'
      });
    });

    // Extract edges/links
    const edgeElements = xmlDoc.querySelectorAll('edge');
    edgeElements.forEach(edgeEl => {
      const id = edgeEl.getAttribute('id') || '';
      const source = edgeEl.getAttribute('source') || '';
      const target = edgeEl.getAttribute('target') || '';
      const weightEl = edgeEl.querySelector('data[key="weight"]');
      const relationEl = edgeEl.querySelector('data[key="relation"]');

      links.push({
        id,
        source,
        target,
        weight: parseFloat(weightEl?.textContent || '1'),
        relation: relationEl?.textContent || 'connected'
      });
    });

    return { nodes, links };
  };

  // Load and parse GraphML file
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
        const data = parseGraphML(xmlString);
        setGraphData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadGraphML();
  }, [graphmlUrl]);

  // Create D3 force-directed graph
  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight * 3));

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', d => d.type === 'person' ? '#3b82f6' : '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('pointer-events', 'none')
      .style('fill', '#333');

    // Add edge labels
    const edgeLabels = g.append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(graphData.links)
      .enter()
      .append('text')
      .text(d => d.relation)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .style('pointer-events', 'none');

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, GraphNode>()
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

    // Add tooltips
    node.on('mouseover', function (event, d) {
      d3.select(this).attr('r', 25);

      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .html(`<strong>${d.name}</strong><br/>Type: ${d.type}<br/>ID: ${d.id}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('r', 20);
        d3.selectAll('.tooltip').remove();
      });

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);

      edgeLabels
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);
    });

    // Cleanup function
    return () => {
      simulation.stop();
      d3.selectAll('.tooltip').remove();
    };

  }, [graphData, width, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading GraphML file...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Network Graph from GraphML
        </h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Nodes: {graphData?.nodes.length || 0}</span>
          <span>Links: {graphData?.links.length || 0}</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Person</span>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Organization</span>
          </div>
        </div>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded"
      />
      <div className="mt-2 text-xs text-gray-500">
        Drag nodes to reposition • Scroll to zoom • Hover for details
      </div>
    </div>
  );
}
