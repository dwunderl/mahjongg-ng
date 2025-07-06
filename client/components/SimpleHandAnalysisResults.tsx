import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TemplateMatchSummary } from '@/lib/analysis/SimpleHandAnalyzer';
import HandDisplay from './HandDisplay';
import { TemplateResultsTable } from './TemplateResultsTable';
import { type Tile } from '@/types/tile';

// Props for the component
interface SimpleHandAnalysisResultsProps {
  results: TemplateMatchSummary[];
  isLoading?: boolean;
  error?: string | null;
  hand: Tile[];
  sortBy?: 'suit' | 'number';
  onSortChange?: (sortBy: 'suit' | 'number') => void;
}

// State for the selected template
type SelectedTemplateState = {
  templateId: string;
  variationIndex: number;
} | null;

// Helper component to render the main content
const ResultsContent = ({ 
  results, 
  selectedTemplate, 
  onTemplateClick, 
  hand 
}: { 
  results: TemplateMatchSummary[]; 
  selectedTemplate: SelectedTemplateState;
  onTemplateClick: (templateId: string, event: React.MouseEvent) => void;
  hand: Tile[];
}) => {
  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <TemplateResultsTable 
          results={results}
          selectedTemplate={selectedTemplate}
          onTemplateClick={onTemplateClick}
          hand={hand}
        />
      </div>
    </div>
  );
};

export function SimpleHandAnalysisResults({ 
  results, 
  isLoading = false, 
  error = null,
  hand,
  sortBy = 'suit',
  onSortChange = () => {}
}: SimpleHandAnalysisResultsProps) {
  // State for template selection
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplateState>(null);
  
  // Handle template selection and variation cycling from the table
  const handleTableTemplateClick = useCallback((templateId: string, event: React.MouseEvent) => {
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
    } else {
      // Select first variation of this template and update immediately
      setSelectedTemplate({
        templateId,
        variationIndex: 0
      });
    }
  }, [results, selectedTemplate]);

  // Update selected template when results change
  useEffect(() => {
    if (results.length > 0 && !selectedTemplate) {
      // Auto-select first template if none is selected
      setSelectedTemplate({
        templateId: results[0].templateId,
        variationIndex: 0
      });
    }
  }, [results]);
  
  // Notify parent component when selected template or variation changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = results.find(t => t.templateId === selectedTemplate.templateId);
      if (template && template.maxMatchedVariationsList[selectedTemplate.variationIndex]) {
        const matchedIndices = template.maxMatchedVariationsList[selectedTemplate.variationIndex].matchedTileIndices;
        const matchedTileIds = matchedIndices
          .map(index => hand[index]?.id)
          .filter(Boolean) as string[];
        
        // Trigger a custom event to update the matched tile IDs
        const event = new CustomEvent('updateMatchedTiles', { 
          detail: { matchedTileIds } 
        });
        window.dispatchEvent(event);
      }
    }
  }, [selectedTemplate, results, hand]);

  // Handle loading and error states
  return (
    <div className="analysis-results">
      {isLoading ? (
        <div className="p-4 text-center">
          <p>Analyzing hand...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-red-600">
          <p>Error: {error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-gray-500">
          <p>No template matches found. Try a different hand or check back for more templates.</p>
        </div>
      ) : (
        <ResultsContent 
          results={results} 
          selectedTemplate={selectedTemplate} 
          onTemplateClick={handleTableTemplateClick}
          hand={hand}
        />
      )}
    </div>
  );
}
