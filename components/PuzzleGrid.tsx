import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';

interface CellPosition {
  row: number;
  col: number;
}

interface SelectionLine {
  start: CellPosition;
  end: CellPosition;
}

interface PuzzleGridProps {
  grid: string[][];
  boxSize: number;
  foundWords: string[];
  foundWordPositions?: Set<string>;
  onWordSelect: (word: string) => void;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({
  grid,
  boxSize,
  foundWords,
  foundWordPositions: propsFoundPositions,
  onWordSelect,
}) => {
  const [selectionLine, setSelectionLine] = useState<SelectionLine | null>(null);
  const gridLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectedCellsRef = useRef<CellPosition[]>([]);
  const foundPositions = propsFoundPositions || new Set<string>();
  
  // Ensure boxSize is a number
  const cellSize = typeof boxSize === 'number' ? boxSize : Number(boxSize) || 32;

  // Get cell position from touch coordinates
  const getCellFromTouch = (
    locationX: number,
    locationY: number
  ): CellPosition | null => {
    if (!gridLayoutRef.current || grid.length === 0 || grid[0].length === 0) {
      return null;
    }

    // Calculate relative position (locationX/Y are relative to the view)
    // Account for container padding
    const padding = 8;
    const cellX = locationX - padding;
    const cellY = locationY - padding;

    const col = Math.floor(Math.max(0, cellX) / cellSize);
    const row = Math.floor(Math.max(0, cellY) / cellSize);

    // Account for cell margin (1px on each side)
    const adjustedCol = Math.floor(Math.max(0, cellX - 1) / (cellSize + 2));
    const adjustedRow = Math.floor(Math.max(0, cellY - 1) / (cellSize + 2));

    // Use adjusted values if they're within bounds, otherwise use original
    const finalRow = (adjustedRow >= 0 && adjustedRow < grid.length) ? adjustedRow : row;
    const finalCol = (adjustedCol >= 0 && adjustedCol < grid[0].length) ? adjustedCol : col;

    if (finalRow >= 0 && finalRow < grid.length && finalCol >= 0 && finalCol < grid[0].length) {
      return { row: finalRow, col: finalCol };
    }

    return null;
  };

  // Get cells in a line between start and end
  const getCellsInLine = (start: CellPosition, end: CellPosition): CellPosition[] => {
    const cells: CellPosition[] = [];
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;

    // Check if it's a valid line (horizontal, vertical, or diagonal)
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    // Must be straight line
    if (absRowDiff > 0 && absColDiff > 0 && absRowDiff !== absColDiff) {
      return [start]; // Invalid line, just return start
    }

    const steps = Math.max(absRowDiff, absColDiff);
    
    for (let i = 0; i <= steps; i++) {
      let row: number, col: number;
      
      if (steps === 0) {
        row = start.row;
        col = start.col;
      } else {
        row = start.row + Math.round((rowDiff * i) / steps);
        col = start.col + Math.round((colDiff * i) / steps);
      }

      // Check bounds
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        cells.push({ row, col });
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
        try {
          const { locationX, locationY } = evt.nativeEvent;
          const cell = getCellFromTouch(locationX, locationY);
          
          if (cell) {
            setSelectionLine({ start: cell, end: cell });
            selectedCellsRef.current = [cell];
          }
        } catch (error) {
          console.error('Error in onPanResponderGrant:', error);
        }
      },

      onPanResponderMove: (evt) => {
        if (!selectionLine) return;

        try {
          const { locationX, locationY } = evt.nativeEvent;
          const cell = getCellFromTouch(locationX, locationY);

          if (cell) {
            // Snap to valid line from start
            const lineCells = getCellsInLine(selectionLine.start, cell);
            
            if (lineCells.length > 0) {
              setSelectionLine({ start: selectionLine.start, end: cell });
              selectedCellsRef.current = lineCells;
            }
          }
        } catch (error) {
          console.error('Error in onPanResponderMove:', error);
        }
      },

      onPanResponderRelease: () => {
        try {
          if (selectedCellsRef.current.length > 0) {
            // Get the word string from selected cells
            const word = selectedCellsRef.current
              .map(({ row, col }) => {
                if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
                  return grid[row][col];
                }
                return '';
              })
              .filter(Boolean)
              .join('');

            if (word.length >= 2) {
              // Send the word to parent - parent will check both forward and reverse
              onWordSelect(word);
            }
          }
        } catch (error) {
          console.error('Error in onPanResponderRelease:', error);
        } finally {
          setSelectionLine(null);
          selectedCellsRef.current = [];
        }
      },

      onPanResponderTerminate: () => {
        setSelectionLine(null);
        selectedCellsRef.current = [];
      },
    })
  ).current;

  // Check if a cell is selected (part of current selection line)
  const isCellSelected = (row: number, col: number): boolean => {
    if (!selectionLine) return false;
    
    const lineCells = getCellsInLine(selectionLine.start, selectionLine.end);
    return lineCells.some(cell => cell.row === row && cell.col === col);
  };

  // Check if a cell is part of a found word
  const isCellFound = (row: number, col: number): boolean => {
    return foundPositions.has(`${row}-${col}`);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    try {
      const { x, y, width, height } = event.nativeEvent.layout;
      // Ensure all values are numbers
      gridLayoutRef.current = {
        x: Number(x) || 0,
        y: Number(y) || 0,
        width: Number(width) || 0,
        height: Number(height) || 0,
      };
    } catch (error) {
      console.error('Error in handleLayout:', error);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter, colIndex) => {
            const isSelected = isCellSelected(rowIndex, colIndex);
            const isFound = isCellFound(rowIndex, colIndex);

            const cellStyle: any[] = [
              styles.cell,
              { 
                width: Number(cellSize), 
                height: Number(cellSize) 
              },
            ];
            
            if (isFound) {
              cellStyle.push(styles.cellFound);
            } else if (isSelected) {
              cellStyle.push(styles.cellSelected);
            }

            return (
              <View key={`${rowIndex}-${colIndex}`} style={cellStyle}>
                <Text allowFontScaling={false} style={styles.letter}>{letter}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A', // Slate-900
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Slate-800
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
    margin: 1,
  },
  cellSelected: {
    backgroundColor: '#6366F1', // Indigo-500
    borderColor: '#818CF8', // Indigo-400
  },
  cellFound: {
    backgroundColor: '#10B981', // Green-500
    borderColor: '#34D399', // Green-400
  },
  letter: {
    fontSize: 16,
    fontWeight: '700' as any,
    color: '#F1F5F9', // Slate-100
  },
});

