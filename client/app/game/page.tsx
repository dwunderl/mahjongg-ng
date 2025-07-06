'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { HandTemplate } from '@/types/template';
import { Tile } from '@/types/tile';
import { createDeck, shuffleDeck, sortHand } from '@/lib/deck';
import HandDisplay from '@/components/HandDisplay';
import { SimpleHandAnalysisResults } from '@/components/SimpleHandAnalysisResults';
import useTemplates from '@/hooks/useTemplates';
import { useSimpleHandAnalysis } from '@/hooks/useSimpleHandAnalysis';
import styles from './page.module.css';
import TemplateBrowser from '@/components/TemplateBrowser';

interface TemplateBrowserProps {
  templates: HandTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: HandTemplate | null) => void;
  onClearSelection: () => void;
  isLoading: boolean;
  error: string | null;
}

const GamePage = () => {
  // State for deck management
  const [deck, setDeck] = useState<Tile[]>([]);
  const [hand, setHand] = useState<Tile[]>([]);
  const [remainingTiles, setRemainingTiles] = useState(0);
  const [isDeckShuffled, setIsDeckShuffled] = useState(false);
  
  // Total tiles in our deck (includes 8 flowers and 8 jokers)
  const totalTiles = 152;

  // State for UI controls
  const [sortBy, setSortBy] = useState<'suit' | 'number'>('suit');
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<HandTemplate | null>(null);
  const [matchedTileIds, setMatchedTileIds] = useState<string[]>([]);
  const [showHighlights, setShowHighlights] = useState(false);
  
  // Load templates using the custom hook
  const { templates, loading: templatesLoading, error: templatesError } = useTemplates();

  // Hand analysis
  const { analyzeHand, results, isAnalyzing, error: analysisError } = useSimpleHandAnalysis(templates || []);

  // Handle manual analysis trigger
  const handleAnalyzeHand = useCallback(async () => {
    if (hand.length === 0 || !templates || templates.length === 0) {
      setMatchedTileIds([]);
      return;
    }
    
    try {
      await analyzeHand(hand);
      setShowHighlights(true);
    } catch (error) {
      console.error('Error analyzing hand:', error);
      setMatchedTileIds([]);
      setShowHighlights(false);
    }
  }, [hand, templates, analyzeHand]);
  
  // Toggle highlighting on/off
  const toggleHighlights = useCallback(() => {
    setShowHighlights(prev => !prev);
  }, []);
  
  // Update matched tiles when analysis results change
  useEffect(() => {
    if (results.length > 0 && showHighlights) {
      // Get the best match (first result is the best match)
      const bestMatch = results[0];
      if (bestMatch && bestMatch.bestMatch) {
        // Convert matched tile indices to tile IDs
        const matchedIds = bestMatch.bestMatch.matchedTileIndices
          .map(index => {
            const tile = hand[index];
            if (!tile) {
              console.warn('Invalid tile index in matchedTileIndices:', index, 'hand length:', hand.length);
              return null;
            }
            return tile.id;
          })
          .filter(Boolean) as string[]; // Filter out any undefined/null values
        
        setMatchedTileIds(matchedIds);
      } else {
        setMatchedTileIds([]);
      }
    } else {
      setMatchedTileIds([]);
    }
  }, [results, hand, showHighlights]);
  
  // Handle template selection and update matched tiles
  const handleSelectTemplate = useCallback((template: HandTemplate | null): void => {
    setSelectedTemplate(template);
    
    // Clear matched tiles when clearing template selection
    if (!template) {
      setMatchedTileIds([]);
      return;
    }
    
    // Find the best match for the selected template
    const templateMatch = results.find(t => t.templateId === template.id);
    if (templateMatch && templateMatch.maxMatchedVariationsList.length > 0) {
      const bestMatch = templateMatch.maxMatchedVariationsList[0];
      const matchedIds = bestMatch.matchedTileIndices
        .map(index => hand[index]?.id)
        .filter(Boolean) as string[];
      setMatchedTileIds(matchedIds);
    } else {
      setMatchedTileIds([]);
    }
  }, [hand, results]);
  
  // Clear the current template selection
  const clearTemplateSelection = useCallback(() => {
    setSelectedTemplate(null);
    setMatchedTileIds([]);
  }, [setSelectedTemplate, setMatchedTileIds]);

  // Update matched tiles when selected template changes
  useEffect(() => {
    if (!selectedTemplate || hand.length === 0) {
      setMatchedTileIds([]);
      return;
    }

    // Re-analyze hand when template changes to update highlighting
    if (hand.length > 0 && templates && templates.length > 0) {
      analyzeHand(hand).catch(error => {
        console.error('Error analyzing hand:', error);
        setMatchedTileIds([]);
      });
    }
  }, [selectedTemplate, hand, analyzeHand, templates]);

  // Handle dealing a hand
  const handleDeal = useCallback((count: number) => {
    if (!isDeckShuffled || remainingTiles < count) return;
    
    const newDeck = [...deck];
    const dealtTiles = newDeck.splice(0, count);
    
    setDeck(newDeck);
    setHand(sortHand(dealtTiles, sortBy));
    setRemainingTiles(newDeck.length);
    // Clear any selected template when dealing new tiles
    setSelectedTemplate(null);
    setMatchedTileIds([]);
    // Clear analysis results
    results.length = 0;
    setShowHighlights(false);
  }, [deck, isDeckShuffled, remainingTiles, results, sortBy]);

  // Handle shuffling the deck
  const handleShuffle = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setHand([]);
    setRemainingTiles(newDeck.length);
    setIsDeckShuffled(true);
  }, []);

  // Handle tile click
  const handleTileClick = useCallback((tile: Tile) => {
    setSelectedTileId(prevId => prevId === tile.id ? null : tile.id);
  }, []);

  // Initialize a new deck when the component mounts
  useEffect(() => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setRemainingTiles(newDeck.length);
    setIsDeckShuffled(true);
  }, []);

  // Clear template selection, matches, and results when hand changes
  useEffect(() => {
    setSelectedTemplate(null);
    setMatchedTileIds([]);
    setShowHighlights(false);
    // Clear results when hand changes
    if (hand.length === 0) {
      results.length = 0;
    }
  }, [hand]);
  
  // Listen for updateMatchedTiles event from SimpleHandAnalysisResults
  useEffect(() => {
    const handleUpdateMatchedTiles = (event: Event) => {
      const customEvent = event as CustomEvent<{ matchedTileIds: string[] }>;
      if (customEvent.detail?.matchedTileIds) {
        setMatchedTileIds(customEvent.detail.matchedTileIds);
      }
    };
    
    window.addEventListener('updateMatchedTiles', handleUpdateMatchedTiles);
    
    return () => {
      window.removeEventListener('updateMatchedTiles', handleUpdateMatchedTiles);
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Mahjongg Hand Generator</title>
        <meta name="description" content="Generate and analyze Mahjong hands" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Mahjongg Hand Generator</h1>
        <div className={styles.deckStatus}>
          <span>Deck: {isDeckShuffled ? 'Shuffled' : 'Not Shuffled'}</span>
        </div>
      </header>

      <div className={styles.contentWrapper}>
        <main className={styles.main}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Your Hand</h2>
            </div>
            
            {hand.length > 0 ? (
              <HandDisplay 
                tiles={hand}
                selectedTileId={selectedTileId}
                onTileClick={handleTileClick}
                matchedTileIds={showHighlights ? matchedTileIds : []}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            ) : (
              <div className="p-4 bg-gray-100 rounded">
                <p className="text-gray-600 mb-2">No tiles in hand. Shuffle the deck and deal some tiles to begin.</p>
                <button
                  onClick={handleShuffle}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Shuffle Deck
                </button>
              </div>
            )}
          </div>
          
          <div className={`${styles.controls} mb-6`}>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleShuffle} 
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                disabled={!isDeckShuffled}
              >
                {isDeckShuffled ? 'Reshuffle' : 'Shuffle'} Deck
              </button>
              <button 
                onClick={() => handleDeal(14)} 
                className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
                disabled={!isDeckShuffled || remainingTiles < 14}
              >
                Deal 14 Tiles
              </button>
              <button 
                onClick={handleAnalyzeHand} 
                className={`px-4 py-2 ${hand.length > 0 ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-300'} text-white rounded disabled:opacity-50`}
                disabled={hand.length === 0 || isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Hand'}
              </button>
              <button 
                onClick={toggleHighlights} 
                className={`px-4 py-2 ${showHighlights ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300'} text-white rounded disabled:opacity-50`}
                disabled={hand.length === 0 || results.length === 0}
              >
                {showHighlights ? 'Hide Highlights' : 'Show Highlights'}
              </button>
            </div>
            
            {remainingTiles > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {remainingTiles} tiles remaining in deck
              </div>
            )}
          </div>
          
          {/* Analysis Results */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">Template Matches</h2>
            {hand.length === 0 ? (
              <p className="text-gray-500">Deal a hand to see template matches</p>
            ) : (
              <SimpleHandAnalysisResults 
                results={results} 
                isLoading={isAnalyzing} 
                error={analysisError ? 'Error analyzing hand' : undefined}
                hand={hand}
                sortBy={sortBy}
              />
            )}
          </div>
        </main>
        
        <aside className={styles.sidebar}>
          <h2 className="text-xl font-bold mb-3">Hand Templates</h2>
          {templatesLoading ? (
            <div>Loading templates...</div>
          ) : templatesError ? (
            <div>Error loading templates: {templatesError instanceof Error ? templatesError.message : 'Unknown error'}</div>
          ) : (
            <TemplateBrowser 
              templates={templates || []}
              selectedTemplateId={selectedTemplate?.id || null}
              onSelectTemplate={handleSelectTemplate}
              onClearSelection={clearTemplateSelection}
              isLoading={templatesLoading}
              error={templatesError ? 'Failed to load templates' : undefined}
            />
          )}
        </aside>
      </div>

      <footer className="p-4 bg-gray-100 text-center text-sm text-gray-600">
        <div className="container mx-auto">
          <p>Mahjong Tools v1.0</p>
        </div>
      </footer>
    </div>
  );
};

export default GamePage;
