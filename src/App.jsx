import React, { useState } from 'react';
import HandDisplay from './ui/components/HandDisplay';
import AnalyzerUI from './ui/components/AnalyzerUI';
import { Deck } from './core/deck';
import { HandAnalyzer } from './core/analyzer/analyzer';

function App() {
  const [hand, setHand] = useState([]);
  const [analyzer, setAnalyzer] = useState(new HandAnalyzer());
  const [analysis, setAnalysis] = useState(null);
  
  const dealNewHand = () => {
    const deck = new Deck();
    const newHand = deck.deal(14);
    setHand(newHand);
    const results = analyzer.analyzeHand(newHand);
    setAnalysis(results);
  };

  return (
    <div className="app">
      <header>
        <h1>Mahjongg Tools</h1>
      </header>
      
      <main>
        <div className="controls">
          <button onClick={dealNewHand}>Deal New Hand</button>
        </div>
        
        <div className="hand-container">
          <h2>Your Hand</h2>
          <HandDisplay tiles={hand} />
        </div>
        
        {analysis && (
          <div className="analysis-container">
            <h2>Analysis</h2>
            <AnalyzerUI analysis={analysis} />
          </div>
        )}
      </main>
      
      <footer>
        <p>Mahjongg Tools © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
