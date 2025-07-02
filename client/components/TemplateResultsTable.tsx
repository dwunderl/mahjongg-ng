import React from 'react';
import { TemplateMatchSummary } from '@/lib/analysis/SimpleHandAnalyzer';
import { type Tile } from '@/types/tile';

interface TemplateResultsTableProps {
  results: TemplateMatchSummary[];
  selectedTemplate: {
    templateId: string;
    variationIndex: number;
  } | null;
  onTemplateClick: (templateId: string, event: React.MouseEvent) => void;
  hand: Tile[];
}

// Color mapping for common color names to CSS colors
const colorMap: Record<string, string> = {
  'red': '#ff0000',
  'green': '#008000',
  'blue': '#0000ff',
  'yellow': '#ffd700',
  'orange': '#ffa500',
  'purple': '#800080',
  'pink': '#ff69b4',
  'brown': '#8b4513',
  'black': '#000000',
  'white': '#ffffff',
  'gray': '#808080',
  'grey': '#808080',
};

export function TemplateResultsTable({
  results,
  selectedTemplate,
  onTemplateClick,
  hand
}: TemplateResultsTableProps) {
  // Function to render colorized image string with HTML color tags
  const renderColorizedString = (str: string) => {
    if (!str) return null;
    
    // If the string doesn't contain any color tags, just return it as is
    if (!str.includes('<')) {
      return <span className="font-mono">{str}</span>;
    }

    // Parse the string for color tags and split into parts
    const parts: JSX.Element[] = [];
    let remaining = str;
    let match;
    
    // Match color tags like <red> or <#ff0000>
    const colorRegex = /<([^>]+)>([^<]*)<\/[^>]+>|<([^>]+)>([^<]*)(?=<|$)|([^<]+)/g;
    let key = 0;
    
    while ((match = colorRegex.exec(remaining)) !== null) {
      if (match[1] && match[2]) {
        // Matched a color tag with closing tag
        const color = colorMap[match[1].toLowerCase()] || match[1];
        parts.push(
          <span key={key++} style={{ color }}>
            {match[2]}
          </span>
        );
      } else if (match[3] && match[4]) {
        // Matched a color tag without closing tag (self-closing)
        const color = colorMap[match[3].toLowerCase()] || match[3];
        parts.push(
          <span key={key++} style={{ color }}>
            {match[4]}
          </span>
        );
      } else if (match[5]) {
        // Matched text outside of color tags
        parts.push(
          <span key={key++} className="text-gray-900">
            {match[5]}
          </span>
        );
      }
    }

    return <span className="font-mono">{parts}</span>;
  };

  // Function to get the selected template class with enhanced styling
  const getSelectedClass = (templateId: string) => {
    const isSelected = selectedTemplate?.templateId === templateId;
    return [
      isSelected 
        ? 'bg-blue-50 font-semibold' 
        : '',
      isSelected ? 'text-blue-900' : 'text-gray-700',
    ].join(' ');
  };

  return (
    <div className="w-full overflow-x-auto" style={{ fontSize: '0.7rem' }}>
      <table className="w-full border-collapse" style={{
        tableLayout: 'fixed',
        border: '1px solid #e2e8f0',
        lineHeight: '1.3'
      }}>
        <colgroup>
          <col className="w-16" />  {/* Category */}
          <col className="w-auto" />  {/* Template */}
          <col className="w-6" />    {/* Tiles */}
          <col className="w-6" />    {/* Vars */}
          <col className="w-8" />    {/* TotVars */}
          <col className="w-12" />   {/* Var */}
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{
              padding: '0.4rem 0.6rem',
              textAlign: 'left',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }}>Category</th>
            <th style={{
              padding: '0.4rem 0.6rem',
              textAlign: 'left',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }}>Template</th>
            <th style={{
              padding: '0.4rem 0.3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }} title="Matching Tiles">Tiles</th>
            <th style={{
              padding: '0.4rem 0.3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }} title="Matching Variations">Vars</th>
            <th style={{
              padding: '0.4rem 0.3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }} title="Total Variations">TotVars</th>
            <th style={{
              padding: '0.4rem 0.3rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.03em'
            }} title="Current Variation">Var</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {results.map((result, index) => {
            const isSelected = selectedTemplate?.templateId === result.templateId;
            const currentVariantIndex = isSelected 
              ? selectedTemplate.variationIndex 
              : 0;
            const variantCount = result.maxMatchedVariationsList.length;
            
            return (
              <tr 
                key={`${result.templateId}-${index}`}
                style={{
                  backgroundColor: isSelected ? '#f0f9ff' : 'white',
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.15s ease',
                  cursor: 'pointer',
                  ...(isSelected ? {
                    boxShadow: 'inset 4px 0 0 0 #3b82f6',
                    backgroundColor: '#f0f9ff',
                    fontWeight: 500
                  } : {})
                }}
                onClick={(e) => onTemplateClick(result.templateId, e)}
              >
                <td style={{
                  padding: '0.4rem 0.6rem',
                  border: '1px solid #e2e8f0',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isSelected ? '#1e40af' : '#1f2937'
                }}>
                  {result.category}
                </td>
                <td style={{
                  padding: '0.4rem 0.6rem',
                  border: '1px solid #e2e8f0',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isSelected ? '#1e40af' : '#1f2937'
                }}>
                  {renderColorizedString(result.image || result.templateName)}
                </td>
                <td style={{
                  padding: '0.4rem 0.3rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                  backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                  color: isSelected ? '#1e40af' : '#1f2937',
                  fontWeight: isSelected ? 500 : 'normal'
                }} title="Matching Tiles">
                  {result.bestMatch.matchedCount}
                </td>
                <td style={{
                  padding: '0.4rem 0.3rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                  backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                  color: isSelected ? '#1e40af' : '#1f2937',
                  fontWeight: isSelected ? 500 : 'normal'
                }} title="Matching Variations">
                  {result.maxMatchedVariations}
                </td>
                <td style={{
                  padding: '0.4rem 0.3rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  fontFamily: 'monospace',
                  backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                  color: isSelected ? '#1e40af' : '#1f2937',
                  fontWeight: isSelected ? 500 : 'normal'
                }} title="Total Variations">
                  {result.variantCount}
                </td>
                <td style={{
                  padding: '0.4rem 0.3rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  color: isSelected ? '#1e40af' : '#1f2937'
                }} title="Current Variation">
                  {isSelected && variantCount > 1 && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      lineHeight: '1.2'
                    }}>
                      {currentVariantIndex + 1}/{variantCount}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
