import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Cell } from './Cell';
import { WordSearchGame } from '../GameLogic';

interface GridProps {
  game: WordSearchGame;
  onWordFound: (word: string) => void;
}

export interface CellPosition {
  row: number;
  col: number;
}

export const Grid: React.FC<GridProps> = ({ game, onWordFound }) => {
  const grid = game.getGrid();
  const wordPositions = game.getWordPositions();
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const selectedCellsRef = useRef<CellPosition[]>([]);
  const isSelectingRef = useRef(false);
  const gridLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Update ref whenever state changes
  useEffect(() => {
    selectedCellsRef.current = selectedCells;
  }, [selectedCells]);

  // Get the row and col from touch coordinates
  const getCellFromTouch = (
    pageX: number,
    pageY: number
  ): CellPosition | null => {
    if (!gridLayoutRef.current) return null;

    // Convert page coordinates to relative coordinates
    const relativeX = pageX - gridLayoutRef.current.x;
    const relativeY = pageY - gridLayoutRef.current.y;

    // Account for padding (8px on each side)
    const padding = 8;
    const cellX = relativeX - padding;
    const cellY = relativeY - padding;

    // Cell size including margins (32px cell + 2px margin on each side = 34px)
    const cellSize = 34;
    const col = Math.floor(Math.max(0, cellX) / cellSize);
    const row = Math.floor(Math.max(0, cellY) / cellSize);

    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      return { row, col };
    }

    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        console.log('PanResponder Grant - pageX:', pageX, 'pageY:', pageY);
        const cell = getCellFromTouch(pageX, pageY);
        console.log('PanResponder Grant - cell:', cell);
        if (cell) {
          isSelectingRef.current = true;
          console.log('PanResponder Grant - Setting initial cell:', cell);
          setSelectedCells([cell]);
        } else {
          console.log('PanResponder Grant - No cell found at touch location');
        }
      },

      onPanResponderMove: (evt) => {
        if (!isSelectingRef.current) {
          console.log('PanResponder Move - not selecting, returning');
          return;
        }

        const { pageX, pageY } = evt.nativeEvent;
        const cell = getCellFromTouch(pageX, pageY);

        if (cell) {
          setSelectedCells((prev) => {
            // Don't add duplicates
            const exists = prev.some(
              (c) => c.row === cell.row && c.col === cell.col
            );
            if (exists) {
              console.log('PanResponder Move - duplicate cell, skipping:', cell);
              return prev;
            }

            // If first cell, just add it
            if (prev.length === 0) {
              console.log('PanResponder Move - adding first cell:', cell);
              return [cell];
            }

            // Check if this cell is adjacent to the last selected cell
            const lastCell = prev[prev.length - 1];
            if (!lastCell) {
              console.log('PanResponder Move - no last cell, adding:', cell);
              return [cell];
            }

            const rowDiff = Math.abs(cell.row - lastCell.row);
            const colDiff = Math.abs(cell.col - lastCell.col);

            // Must be adjacent (horizontally, vertically, or diagonally)
            const isAdjacent = rowDiff <= 1 && colDiff <= 1 && (rowDiff === 1 || colDiff === 1);

            if (isAdjacent) {
              // Check if it's in a straight line
              const allCells = [...prev, cell];
              if (isStraightLine(allCells)) {
                console.log('PanResponder Move - adding adjacent cell in line:', cell, 'Total:', allCells.length);
                return allCells;
              } else if (prev.length === 1) {
                // Allow second cell even if line not established yet
                console.log('PanResponder Move - adding second cell:', cell);
                return allCells;
              }
            } else {
              console.log('PanResponder Move - cell not adjacent:', cell, 'last:', lastCell);
            }

            return prev;
          });
        } else {
          console.log('PanResponder Move - no cell found at', pageX, pageY);
        }
      },

      onPanResponderRelease: () => {
        // Use ref to get current selection (avoid stale closure)
        const currentSelection = [...selectedCellsRef.current];
        isSelectingRef.current = false;

        console.log('Selection released. Selected cells:', currentSelection);
        console.log('Number of selected cells:', currentSelection.length);

        // Check if selection matches a word
        if (currentSelection.length >= 2) {
          const grid = game.getGrid();
          const selectedWord = currentSelection
            .map(({ row, col }) => grid[row][col])
            .join('');
          console.log('Selected word string:', selectedWord);
          
          const foundWord = game.checkSelection(currentSelection);
          console.log('Found word result:', foundWord);
          
          if (foundWord) {
            console.log('Word found! Calling onWordFound with:', foundWord);
            onWordFound(foundWord);
            // Keep the selected cells for found words (they'll be marked as found)
          } else {
            console.log('Word not found. Clearing selection.');
            // Clear selection if word not found
            setTimeout(() => {
              setSelectedCells([]);
            }, 300);
          }
        } else {
          console.log('Selection too short, clearing.');
          setSelectedCells([]);
        }
      },

      onPanResponderTerminate: () => {
        isSelectingRef.current = false;
        setTimeout(() => {
          setSelectedCells([]);
        }, 100);
      },
    })
  ).current;

  // Helper function to check if cells form a straight line
  const isStraightLine = (cells: CellPosition[]): boolean => {
    if (cells.length <= 2) return true;

    // Check horizontal
    const allSameRow = cells.every((cell) => cell.row === cells[0].row);
    if (allSameRow) {
      const cols = cells.map((c) => c.col).sort((a, b) => a - b);
      for (let i = 1; i < cols.length; i++) {
        if (cols[i] !== cols[i - 1] + 1) return false;
      }
      return true;
    }

    // Check vertical
    const allSameCol = cells.every((cell) => cell.col === cells[0].col);
    if (allSameCol) {
      const rows = cells.map((c) => c.row).sort((a, b) => a - b);
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] !== rows[i - 1] + 1) return false;
      }
      return true;
    }

    // Check diagonal forward
    const rowDiffs = cells.map((c, i) => (i > 0 ? c.row - cells[i - 1].row : 0));
    const colDiffs = cells.map((c, i) => (i > 0 ? c.col - cells[i - 1].col : 0));
    if (rowDiffs.every((d) => d === 1) && colDiffs.every((d) => d === 1)) {
      return true;
    }

    // Check diagonal backward
    if (rowDiffs.every((d) => d === 1) && colDiffs.every((d) => d === -1)) {
      return true;
    }

    return false;
  };

  // Get found cell positions
  const getFoundCellPositions = (): Set<string> => {
    const found = new Set<string>();
    const foundWords = game.getFoundWords();

    wordPositions.forEach((wp) => {
      if (foundWords.includes(wp.word)) {
        wp.positions.forEach((pos) => {
          found.add(`${pos.row}-${pos.col}`);
        });
      }
    });

    return found;
  };

  const foundCells = getFoundCellPositions();

  // Convert selected cells to Set for quick lookup
  const selectedSet = new Set(
    selectedCells.map((c) => `${c.row}-${c.col}`)
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    gridLayoutRef.current = { x, y, width, height };
  };

  return (
    <View
      style={styles.gridContainer}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      collapsable={false}
    >
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const isSelected = selectedSet.has(cellKey);
            const isFound = foundCells.has(cellKey);

            return (
              <Cell
                key={cellKey}
                letter={letter}
                isSelected={isSelected}
                isFound={isFound}
                onPress={() => {}}
                onDrag={() => {}}
                onRelease={() => {}}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
