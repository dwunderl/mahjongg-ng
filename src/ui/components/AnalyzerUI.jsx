import React from 'react';

const AnalyzerUI = ({ analysis }) => {
  if (!analysis) {
    return <div className="analyzer-ui">Deal a hand to see analysis</div>;
  }

  return (
    <div className="analyzer-ui">
      {analysis.matches.length === 0 ? (
        <div className="no-matches">No matching patterns found</div>
      ) : (
        <div className="matches-container">
          <h3>Matching Patterns ({analysis.matches.length})</h3>
          <div className="matches-list">
            {analysis.matches.map((match, index) => (
              <div key={index} className="match-item">
                <div className="match-header">
                  <h4>{match.template}</h4>
                  <span className="score">Score: {match.score}</span>
                </div>
                {match.message && (
                  <div className="match-message">{match.message}</div>
                )}
                {match.matchedTiles && match.matchedTiles.length > 0 && (
                  <div className="matched-tiles">
                    <div>Matched Tiles:</div>
                    <div className="tile-set">
                      {match.matchedTiles.map((tile, i) => (
                        <span key={i} className="tile-badge">
                          {tile.value}{tile.type[0].toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerUI;
