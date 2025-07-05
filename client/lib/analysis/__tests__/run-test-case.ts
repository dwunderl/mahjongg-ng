import fs from 'fs';
import path from 'path';
import { SimpleMatcher } from '../SimpleMatcher';
import type { Tile } from '@/types/tile';
import type { TemplateVariant } from '@/types/template';

console.log('Starting test runner...');

// Define interfaces for our test case structure
interface TestMatch {
  type: 'exact' | 'joker';
  handIndex: number;
  variationIndex: number;
}

interface TestCase {
  name: string;
  description?: string;
  hand: string[];
  variation: string[];
  expected: {
    matches: TestMatch[];
  };
}

interface TestCases {
  testCases: TestCase[];
}

// Load test cases
console.log('Loading test cases...');
const testCasesPath = path.join(__dirname, 'test-cases', 'matcher-test-cases.json');
console.log(`Test cases path: ${testCasesPath}`);

if (!fs.existsSync(testCasesPath)) {
  console.error(`Error: Test cases file not found at ${testCasesPath}`);
  process.exit(1);
}

let testCases: TestCases;
try {
  const fileContent = fs.readFileSync(testCasesPath, 'utf-8');
  testCases = JSON.parse(fileContent) as TestCases;
  console.log(`Loaded ${testCases.testCases.length} test case(s)`);
} catch (error) {
  console.error('Error loading test cases:', error);
  process.exit(1);
}

// Simple function to convert string arrays to Tile objects
function createTiles(codes: string[]): Tile[] {
  return codes.map((code, index) => {
    const upperCode = code.toUpperCase();
    // Extract numeric value for numbered tiles (1-9)
    const numericValue = /^([1-9])[cbd]$/i.test(upperCode) 
      ? parseInt(upperCode[0], 10) 
      : 0;
    
    return {
      id: `tile-${index}`,
      code: upperCode,
      value: numericValue,
      display: upperCode,
      isSelected: false,
      isMatched: false,
      isJokerMatch: false,
      isHonor: /^[ESWND]/.test(upperCode),
      isFlower: upperCode === 'F',
      isJoker: upperCode === 'J',
      // Default values for other required Tile properties
      suit: /[cbd]$/i.test(upperCode) ? upperCode.slice(-1).toLowerCase() as 'c' | 'b' | 'd' : undefined,
      isDragon: /^D[dbc]$/i.test(upperCode),
      isWind: /^[ESWN]$/i.test(upperCode)
    } as Tile; // Type assertion since we're providing all required properties
  });
}

// Process a single test case
function runTestCase(testCase: TestCase, index: number) {
  console.log(`\n=== Running Test Case ${index + 1}: ${testCase.name} ===`);
  console.log(`Description: ${testCase.description}`);
  
  // Convert test case data to Tile arrays
  const handTiles = createTiles(testCase.hand);
  
  // Create a template variant for the test
  const templateVariant: TemplateVariant = {
    id: 'test-variant',
    name: 'Test Variant',
    description: 'Test variant for test case',
    requiredTiles: testCase.variation.map((code: string, index: number) => {
      const upperCode = code.toUpperCase();
      return {
        code: upperCode,
        position: index + 1,
        groupSize: 1, // Default group size of 1 for testing
        // Add other required properties for RequiredTile
        suit: /[cbd]$/i.test(upperCode) ? upperCode.slice(-1).toLowerCase() as 'c' | 'b' | 'd' : undefined,
        value: /^[1-9]/.test(upperCode) ? parseInt(upperCode[0], 10) : 0,
        isHonor: /^[ESWND]/.test(upperCode),
        isFlower: upperCode === 'F',
        isJoker: upperCode === 'J',
        isDragon: /^D[dbc]$/i.test(upperCode),
        isWind: /^[ESWN]$/i.test(upperCode)
      };
    })
  };

  // Run the matcher
  const matcher = new SimpleMatcher(handTiles, templateVariant);

  // Get the match results
  const result = matcher.match();
  
  // Convert results to a format we can easily check against expected
  const actualMatches = [
    ...Array.from(result.exactMatches.entries()).map(([handIdx, varIdx]) => ({
      type: 'exact',
      handIndex: handIdx,
      variationIndex: varIdx
    })),
    ...Array.from(result.jokerMatches.entries()).map(([handIdx, varIdx]) => ({
      type: 'joker',
      handIndex: handIdx,
      variationIndex: varIdx
    }))
  ];

  // Sort both actual and expected matches for comparison
  const sortMatches = (a: any, b: any) => 
    a.handIndex - b.handIndex || a.variationIndex - b.variationIndex;
    
  const expectedMatches = [...testCase.expected.matches].sort(sortMatches);
  const actualMatchesSorted = actualMatches.sort(sortMatches);

  // Check if matches are as expected
  const isMatchCorrect = JSON.stringify(actualMatchesSorted) === JSON.stringify(expectedMatches);
  
  console.log('\nHand Tiles:');
  console.log(handTiles.map((t, i) => `${i}: ${t.code}`).join(' | '));
  
  console.log('\nVariation Tiles:');
  console.log(testCase.variation.map((t: string, i: number) => `${i}: ${t}`).join(' | '));
  
  console.log('\nExpected Matches:');
  expectedMatches.forEach((m: any) => {
    console.log(`- Hand[${m.handIndex}] (${handTiles[m.handIndex].code}) ${m.type} matches Variation[${m.variationIndex}] (${testCase.variation[m.variationIndex]})`);
  });
  
  console.log('\nActual Matches:');
  if (actualMatchesSorted.length === 0) {
    console.log('- No matches found');
  } else {
    actualMatchesSorted.forEach((m: any) => {
      console.log(`- Hand[${m.handIndex}] (${handTiles[m.handIndex].code}) ${m.type} matches Variation[${m.variationIndex}] (${testCase.variation[m.variationIndex]})`);
    });
  }
  
  console.log('\nResult:', isMatchCorrect ? 'PASSED ✅' : 'FAILED ❌');
  
  if (!isMatchCorrect) {
    console.log('\nExpected Matches:');
    console.log(JSON.stringify(expectedMatches, null, 2));
    console.log('\nActual Matches:');
    console.log(JSON.stringify(actualMatchesSorted, null, 2));
  }
  
  return isMatchCorrect;
}

// Run all test cases
function runAllTests() {
  console.log('Starting Mahjong Matcher Tests');
  console.log('=============================');
  
  let passed = 0;
  const total = testCases.testCases.length;
  
  testCases.testCases.forEach((testCase: any, index: number) => {
    const passedTest = runTestCase(testCase, index);
    if (passedTest) passed++;
  });
  
  console.log('\nTest Summary:');
  console.log('=============');
  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);
  
  return passed === total ? 0 : 1;
}

// Run the tests
const exitCode = runAllTests();
process.exit(exitCode);
