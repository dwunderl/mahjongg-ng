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
  hand, 
  sortBy, 
  onSortChange 
}: { 
  results: TemplateMatchSummary[]; 
  selectedTemplate: SelectedTemplateState;
  onTemplateClick: (templateId: string, event: React.MouseEvent) => void;
  hand: Tile[];
  sortBy: 'suit' | 'number';
  onSortChange: (sortBy: 'suit' | 'number') => void;
}) => {
  // Get the currently selected variant's match details
  const selectedMatchData = useMemo(() => {
    if (!selectedTemplate) return null;
    const template = results.find(t => t.templateId === selectedTemplate.templateId);
    return template?.maxMatchedVariationsList[selectedTemplate.variationIndex] || null;
  }, [results, selectedTemplate]);

  // Memoize the hand display to prevent unnecessary re-renders
  const handDisplay = useMemo(() => {
    // Convert matched tile indices to tile IDs for highlighting
    const matchedTileIds = selectedMatchData?.matchedTileIndices
      ?.map(index => hand[index]?.id)
      .filter(Boolean) || [];
      
    console.log('Rendering HandDisplay with matchedTileIds:', {
      matchedIndices: selectedMatchData?.matchedTileIndices,
      matchedTileIds,
      hand: hand.map(t => ({ id: t.id, code: t.code }))
    });
    
    return (
      <HandDisplay 
        key={`hand-${selectedMatchData?.matchedTileIndices?.join('-') || 'none'}`}
        tiles={hand} 
        matchedTileIds={matchedTileIds}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
    );
  }, [hand, selectedMatchData?.matchedTileIndices, sortBy, onSortChange]);

  return (
    <div className="mt-4">
      <div className="mb-4">
        {handDisplay}
      </div>
      
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

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Analyzing hand...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No matching templates found. Try a different hand.
      </div>
    );
  }

  return (
    <ResultsContent 
      results={results}
      selectedTemplate={selectedTemplate}
      onTemplateClick={handleTableTemplateClick}
      hand={hand}
      sortBy={sortBy}
      onSortChange={onSortChange}
    />
  );
}
