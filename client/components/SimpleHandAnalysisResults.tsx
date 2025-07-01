import React from 'react';
import { TemplateMatchSummary } from '@/lib/analysis/SimpleHandAnalyzer';

interface SimpleHandAnalysisResultsProps {
  results: TemplateMatchSummary[];
  isLoading?: boolean;
  error?: string | null;
}

export function SimpleHandAnalysisResults({ 
  results, 
  isLoading = false, 
  error = null 
}: SimpleHandAnalysisResultsProps) {
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

  // Function to get match status class
  const getMatchStatusClass = (matched: number, total: number) => {
    const percentage = (matched / total) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Matching Templates</h3>
      <div className="border rounded-md divide-y">
        {topResults.map((result, index) => {
          const { matchedCount, totalTiles } = result.bestMatch;
          const matchPercentage = Math.round((matchedCount / totalTiles) * 100);
          const matchStatusClass = getMatchStatusClass(matchedCount, totalTiles);
          
          // Format: Template Name, tiles=n, vars=m, totvars=o
          const matchSummary = `${result.templateName}, tiles=${matchedCount}, vars=${result.maxMatchedVariations}, totvars=${result.variantCount}`;
          
          return (
            <div key={result.templateId} className="p-3 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">
                  {matchSummary}
                </span>
              </div>
              
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${matchStatusClass}`} 
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
                <span className="ml-2 text-xs font-medium text-gray-600 w-12 text-right">
                  {matchPercentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
