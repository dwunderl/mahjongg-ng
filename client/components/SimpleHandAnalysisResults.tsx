import React, { useState } from 'react';
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
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplateState>(null);
  
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
  
  // Get the currently selected variation for highlighting
  const getSelectedVariation = (): SimpleMatchResult | null => {
    if (!selectedTemplate) return null;
    
    const template = results.find(t => t.templateId === selectedTemplate.templateId);
    if (!template) return null;
    
    return template.maxMatchedVariationsList[selectedTemplate.variationIndex] || null;
  };
  
  // Get the current variation display text
  const getVariationText = (template: TemplateMatchSummary): string => {
    if (template.maxMatchedVariations <= 1) return '';
    
    if (selectedTemplate?.templateId === template.templateId) {
      const currentVar = selectedTemplate.variationIndex + 1;
      return ` (var ${currentVar} of ${template.maxMatchedVariations})`;
    }
    
    return ` (${template.maxMatchedVariations} variations)`;
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
  const selectedVariation = getSelectedVariation();

  // Function to get the selected template class
  const getSelectedClass = (templateId: string) => {
    return selectedTemplate?.templateId === templateId 
      ? 'ring-2 ring-blue-500 bg-blue-50' 
      : 'hover:bg-gray-50';
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Matching Templates</h3>
      
      {/* Hand display with highlighted matches */}
      {hand.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Hand</h4>
          <HandDisplay 
            tiles={hand} 
            matchedTileIndices={selectedVariation?.matchedTileIndices || []} 
          />
          {selectedVariation && (
            <div className="mt-2 text-xs text-gray-500">
              Showing matches for: {selectedVariation.variantName}
            </div>
          )}
        </div>
      )}
      
      {/* Template matches list */}
      <div className="border rounded-md divide-y">
        {topResults.map((result) => {
          const { matchedCount, totalTiles } = result.bestMatch;
          const isSelected = selectedTemplate?.templateId === result.templateId;
          
          // Format: Template Name, tiles=n, vars=m, totvars=o
          const matchSummary = `${result.templateName}, tiles=${matchedCount}, vars=${result.maxMatchedVariations}, totvars=${result.variantCount}${getVariationText(result)}`;
          
          return (
            <div 
              key={result.templateId} 
              className={`p-3 cursor-pointer transition-colors ${getSelectedClass(result.templateId)}`}
              onClick={(e) => handleTemplateClick(result.templateId, e)}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">
                  {matchSummary}
                </span>
                {isSelected && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500">
        Click a template to highlight matches. Click again to cycle through variations.
      </div>
    </div>
  );
}
