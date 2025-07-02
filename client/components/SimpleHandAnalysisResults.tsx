import React, { useState, useEffect } from 'react';
import { TemplateMatchSummary } from '@/lib/analysis/SimpleHandAnalyzer';
import HandDisplay from './HandDisplay';
import { type Tile } from '@/types/tile';

// Define SimpleMatchResult here since it's not exported from SimpleHandAnalyzer
type SimpleMatchResult = {
  templateId: string;
  templateName: string;
  variantName: string;
  variantId: string;
  matchedCount: number;
  totalTiles: number;
  matchPercentage: number;
  matchedTileIndices: number[];
};

interface SimpleHandAnalysisResultsProps {
  results: TemplateMatchSummary[];
  isLoading?: boolean;
  error?: string | null;
  hand: Tile[];
}

type SelectedTemplateState = {
  templateId: string;
  variationIndex: number;
} | null;

export function SimpleHandAnalysisResults({ 
  results, 
  isLoading = false, 
  error = null,
  hand
}: SimpleHandAnalysisResultsProps) {
  // State for template selection and sorting
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplateState>(null);
  const [sortBy, setSortBy] = useState<'suit' | 'number'>('suit');
  
  // Handle template selection and variation cycling
  const handleTemplateClick = (templateId: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    const template = results.find(t => t.templateId === templateId);
    if (!template) return;
    
    // If clicking the same template, cycle to next variation
    if (selectedTemplate?.templateId === templateId) {
      const currentIndex = selectedTemplate.variationIndex;
      const nextIndex = (currentIndex + 1) % template.maxMatchedVariationsList.length;
      
      setSelectedTemplate({
        templateId,
        variationIndex: nextIndex
      });
    } 
    // If clicking a different template, select its first variation
    else {
      setSelectedTemplate({
        templateId,
        variationIndex: 0
      });
    }
  };
  
  // Force a re-render when selectedTemplate changes
  const [_, forceUpdate] = React.useState({});
  
  // Get the currently selected variation for display
  const selectedVariation = React.useMemo(() => {
    if (!selectedTemplate) return null;
    const template = results.find(t => t.templateId === selectedTemplate.templateId);
    return template?.maxMatchedVariationsList[selectedTemplate.variationIndex] || null;
  }, [selectedTemplate, results, _]);
  
  // Force update when selected template changes
  React.useEffect(() => {
    forceUpdate({});
  }, [selectedTemplate]);
  
  // Get the current variation display text
  const getVariationText = (template: TemplateMatchSummary): string => {
    if (template.maxMatchedVariations <= 1) return '';
    
    if (selectedTemplate?.templateId === template.templateId) {
      const currentVar = selectedTemplate.variationIndex + 1;
      return ` (var ${currentVar} of ${template.maxMatchedVariations})`;
    }
    
    return '';
  };
  if (isLoading) {
    return <div className="p-4 text-gray-600">Analyzing hand...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!results || results.length === 0) {
    return <div className="p-4 text-gray-600">No matching templates found.</div>;
  }

  // Show top 5 results
  const topResults = results.slice(0, 5);

  // Function to get the selected template class with enhanced styling
  const getSelectedClass = (templateId: string) => {
    const isSelected = selectedTemplate?.templateId === templateId;
    return [
      'transition-all duration-200',
      isSelected 
        ? 'bg-blue-100 border-l-4 border-blue-600 font-semibold shadow-sm' 
        : 'hover:bg-gray-50',
      isSelected ? 'text-blue-900' : 'text-gray-700',
      'relative' // For potential absolute positioning of indicators
    ].join(' ');
  };
  
  // Toggle sort type
  const toggleSort = () => {
    setSortBy(prev => prev === 'suit' ? 'number' : 'suit');
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Matching Templates</h3>
      
      {/* Hand display with highlighted matches */}
      {hand.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Your Hand</h4>
            <button 
              onClick={toggleSort}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              title="Toggle sort order"
            >
              Sort by: {sortBy === 'suit' ? 'Suit' : 'Number'}
            </button>
          </div>
          <HandDisplay 
            tiles={hand} 
            matchedTileIndices={selectedVariation?.matchedTileIndices || []}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>
      )}
      
      {/* Template matches list */}
      <div className="border rounded-md divide-y">
        {topResults.map((result) => {
          const { matchedCount, totalTiles } = result.bestMatch;
          
          // Get the template to access category and image
          const template = results.find(t => t.templateId === result.templateId);
          const category = template?.category || 'UNKNOWN';
          const imageString = template?.image || '';
          
          // Parse the colorized image string with inline styles
          const renderColorizedString = (str: string) => {
            if (!str) return null;
            
            console.log('Rendering colorized string:', str);
            
            // If the string doesn't contain any color tags, just return it as is
            if (!str.includes('<')) {
              return <span style={{ fontFamily: 'monospace' }}>{str}</span>;
            }
            
            // Map color names to hex values
            const colorMap: Record<string, string> = {
              red: '#dc2626',
              green: '#16a34a',
              blue: '#2563eb',
              black: '#1f2937',
              white: '#f3f4f6',
              yellow: '#eab308',
              purple: '#9333ea',
              gray: '#6b7280',
              grey: '#6b7280',
            };
            
            // Split by color tags and process each segment
            const parts: JSX.Element[] = [];
            let currentPos = 0;
            let currentColor = colorMap['black'];
            
            // Process each color tag
            const regex = /<([^>]+)>/g;
            let match;
            let partIndex = 0;
            
            while ((match = regex.exec(str)) !== null) {
              // Add text before the tag
              if (match.index > currentPos) {
                const text = str.substring(currentPos, match.index);
                if (text.trim()) {
                  parts.push(
                    <span 
                      key={`t-${partIndex++}`}
                      style={{
                        fontFamily: 'monospace',
                        color: currentColor,
                        whiteSpace: 'pre'
                      }}
                    >
                      {text}
                    </span>
                  );
                }
              }
              
              // Process the color tag
              const color = match[1].toLowerCase();
              currentColor = colorMap[color] || colorMap['black'];
              currentPos = match.index + match[0].length;
            }
            
            // Add any remaining text after the last tag
            if (currentPos < str.length) {
              const text = str.substring(currentPos);
              if (text.trim()) {
                parts.push(
                  <span 
                    key={`t-${partIndex++}`}
                    style={{
                      fontFamily: 'monospace',
                      color: currentColor,
                      whiteSpace: 'pre'
                    }}
                  >
                    {text}
                  </span>
                );
              }
            }
            
            console.log('Rendered parts:', parts);
            
            return parts.length > 0 ? (
              <div style={{ display: 'inline-flex', gap: '2px' }}>{parts}</div>
            ) : (
              <span style={{ fontFamily: 'monospace' }}>{str.replace(/<[^>]+>/g, '')}</span>
            );
          };
          
          const isSelected = selectedTemplate?.templateId === result.templateId;
          return (
            <div 
              key={result.templateId} 
              className={`p-2 pl-3 cursor-pointer ${getSelectedClass(result.templateId)}`}
              onClick={(e) => handleTemplateClick(result.templateId, e)}
            >
              <div className="flex items-center gap-1 text-sm whitespace-nowrap overflow-hidden">
                <span className="font-semibold uppercase tracking-wider flex-shrink-0">
                  {category} :
                </span>
                <span className="min-w-0 truncate px-1 flex-1">
                  {renderColorizedString(imageString || result.templateName)}
                </span>
                <span className="whitespace-nowrap flex-shrink-0 text-sm">
                  : Tiles={matchedCount} Vars={result.maxMatchedVariations} TotVars={result.variantCount}
                  {isSelected && ` (Var ${selectedTemplate.variationIndex + 1} of ${result.maxMatchedVariations})`}
                </span>
              </div>
            </div>
        );
      })}
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-500">
        Click on a template to highlight matching tiles in your hand
      </div>
    </div>
  );
}
