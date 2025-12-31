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
  // Also checks nearby cells for easier diagonal selection
  const getCellFromTouch = (
    pageX: number,
    pageY: number,
    checkNearby: boolean = false
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
    let col = Math.floor(Math.max(0, cellX) / cellSize);
    let row = Math.floor(Math.max(0, cellY) / cellSize);

    // Check bounds
    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      return { row, col };
    }

    return null;
  };

  // Get all nearby cells (useful for diagonal selection)
  const getNearbyCells = (pageX: number, pageY: number): CellPosition[] => {
    const cells: CellPosition[] = [];
    const mainCell = getCellFromTouch(pageX, pageY);
    
    if (!mainCell) return cells;
    
    cells.push(mainCell);
    
    // Also check adjacent cells (for diagonal selection when touch is between cells)
    const offsets = [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
      { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
    ];
    
    for (const offset of offsets) {
      const newRow = mainCell.row + offset.row;
      const newCol = mainCell.col + offset.col;
      if (
        newRow >= 0 && newRow < grid.length &&
        newCol >= 0 && newCol < grid[0].length
      ) {
        cells.push({ row: newRow, col: newCol });
      }
    }
    
    return cells;
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
        // Get nearby cells for better diagonal detection
        const nearbyCells = getNearbyCells(pageX, pageY);
        const cell = nearbyCells[0]; // Main cell

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

            // Get the last 2 cells to check direction
            const lastCell = prev[prev.length - 1];
            if (!lastCell) {
              console.log('PanResponder Move - no last cell, adding:', cell);
              return [cell];
            }

            // For diagonal selection, be more forgiving
            // Check if cell is adjacent (including diagonals)
            const rowDiff = Math.abs(cell.row - lastCell.row);
            const colDiff = Math.abs(cell.col - lastCell.col);

            // Allow adjacent cells (horizontal, vertical, or diagonal)
            const isAdjacent = rowDiff <= 1 && colDiff <= 1 && (rowDiff === 1 || colDiff === 1);

            if (isAdjacent) {
              // Build the potential new selection
              const allCells = [...prev, cell];

              // For diagonal lines, be more lenient with validation
              if (prev.length === 1) {
                // Always allow second cell - establishes direction
                console.log('PanResponder Move - adding second cell (establishing direction):', cell);
                return allCells;
              }

              // Check if it maintains a straight line (more lenient for diagonals)
              if (isStraightLine(allCells, true)) {
                console.log('PanResponder Move - adding adjacent cell in line:', cell, 'Total:', allCells.length);
                return allCells;
              } else {
                // For diagonals, also check if we're skipping a cell (user moved fast)
                // Try to fill in missing diagonal cells
                const filledCells = fillMissingDiagonalCells(prev, cell);
                if (filledCells && filledCells.length > prev.length) {
                  console.log('PanResponder Move - filled missing diagonal cells');
                  return filledCells;
                }
              }
            } else {
              // If not adjacent, check nearby cells for diagonal continuation
              // Check if any nearby cell continues the diagonal line
              for (const nearbyCell of nearbyCells.slice(1)) {
                const nearRowDiff = Math.abs(nearbyCell.row - lastCell.row);
                const nearColDiff = Math.abs(nearbyCell.col - lastCell.col);
                
                if (nearRowDiff <= 1 && nearColDiff <= 1 && (nearRowDiff === 1 || nearColDiff === 1)) {
                  const allCellsWithNearby = [...prev, nearbyCell];
                  if (isStraightLine(allCellsWithNearby, true)) {
                    console.log('PanResponder Move - using nearby cell for diagonal:', nearbyCell);
                    return allCellsWithNearby;
                  }
                }
              }
              
              // Check if we might have skipped cells in a diagonal
              if (prev.length >= 2) {
                const filledCells = fillMissingDiagonalCells(prev, cell);
                if (filledCells && filledCells.length > prev.length) {
                  console.log('PanResponder Move - filled skipped diagonal cells');
                  return filledCells;
                }
              }
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

  // Helper function to fill in missing diagonal cells (for fast swipes)
  const fillMissingDiagonalCells = (
    prev: CellPosition[],
    newCell: CellPosition
  ): CellPosition[] | null => {
    if (prev.length < 2) return null;

    const lastCell = prev[prev.length - 1];
    const secondLastCell = prev[prev.length - 2];

    // Check if we're moving in a consistent diagonal direction
    const lastRowDiff = lastCell.row - secondLastCell.row;
    const lastColDiff = lastCell.col - secondLastCell.col;

    // Must be diagonal (both row and col change)
    if (Math.abs(lastRowDiff) !== 1 || Math.abs(lastColDiff) !== 1) {
      return null;
    }

    // Check if new cell continues this diagonal direction
    const newRowDiff = newCell.row - lastCell.row;
    const newColDiff = newCell.col - lastCell.col;

    // If new cell is in the same direction but 2 steps away, fill the middle
    if (
      Math.abs(newRowDiff) === 2 &&
      Math.abs(newColDiff) === 2 &&
      Math.sign(newRowDiff) === Math.sign(lastRowDiff) &&
      Math.sign(newColDiff) === Math.sign(lastColDiff)
    ) {
      const missingCell: CellPosition = {
        row: lastCell.row + lastRowDiff,
        col: lastCell.col + lastColDiff,
      };

      // Check if missing cell is within grid bounds
      if (
        missingCell.row >= 0 &&
        missingCell.row < grid.length &&
        missingCell.col >= 0 &&
        missingCell.col < grid[0].length
      ) {
        return [...prev, missingCell, newCell];
      }
    }

    return null;
  };

  // Helper function to check if cells form a straight line
  // lenient: if true, allows slight variations for easier diagonal selection
  const isStraightLine = (cells: CellPosition[], lenient: boolean = false): boolean => {
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

    // Check diagonal - be more lenient
    if (lenient && cells.length === 2) {
      // For just 2 cells, any diagonal is valid
      const rowDiff = Math.abs(cells[1].row - cells[0].row);
      const colDiff = Math.abs(cells[1].col - cells[0].col);
      return rowDiff === colDiff && rowDiff === 1;
    }

    // Check if cells form a consistent diagonal direction
    const rowDiffs: number[] = [];
    const colDiffs: number[] = [];

    for (let i = 1; i < cells.length; i++) {
      rowDiffs.push(cells[i].row - cells[i - 1].row);
      colDiffs.push(cells[i].col - cells[i - 1].col);
    }

    // Check if all diffs are consistent (same direction)
    const rowSign = Math.sign(rowDiffs[0]);
    const colSign = Math.sign(colDiffs[0]);

    // For diagonals, row and col diffs should be same magnitude
    const isDiagonal = rowDiffs.every(
      (d, i) =>
        Math.abs(d) === Math.abs(colDiffs[i]) &&
        Math.abs(d) === 1 &&
        Math.sign(d) === rowSign &&
        Math.sign(colDiffs[i]) === colSign
    );

    if (isDiagonal) return true;

    // Also check reverse diagonal (if we went backwards)
    if (rowDiffs.length >= 2) {
      // Try reverse direction
      const reverseRowDiffs = rowDiffs.map((d) => -d);
      const reverseColDiffs = colDiffs.map((d) => -d);

      const isReverseDiagonal = reverseRowDiffs.every(
        (d, i) =>
          Math.abs(d) === Math.abs(reverseColDiffs[i]) &&
          Math.abs(d) === 1
      );

      if (isReverseDiagonal) return true;
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
