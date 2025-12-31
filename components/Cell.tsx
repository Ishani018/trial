import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface CellProps {
  letter: string;
  isSelected: boolean;
  isFound: boolean;
  onPress: () => void;
  onDrag: () => void;
  onRelease: () => void;
}

export const Cell: React.FC<CellProps> = ({
  letter,
  isSelected,
  isFound,
}) => {
  const cellStyle: ViewStyle[] = [
    styles.cell,
    ...(isFound ? [styles.cellFound] : []),
    ...(isSelected && !isFound ? [styles.cellSelected] : []),
  ];

  const textStyle = [
    styles.letter,
    ...(isFound ? [styles.letterFound] : []),
    ...(isSelected && !isFound ? [styles.letterSelected] : []),
  ];

  return (
    <View style={cellStyle} pointerEvents="none">
      <Text style={textStyle}>{letter}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: 32,
    height: 32,
    backgroundColor: '#E8F4F8',
    borderWidth: 1,
    borderColor: '#B8D4E3',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  cellSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
    borderWidth: 2,
  },
  cellFound: {
    backgroundColor: '#90EE90',
    borderColor: '#32CD32',
    borderWidth: 2,
  },
  letter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  letterSelected: {
    color: '#8B4513',
  },
  letterFound: {
    color: '#006400',
  },
});

