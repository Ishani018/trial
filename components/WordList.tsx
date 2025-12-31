import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WordListProps {
  words: string[];
  foundWords: string[];
}

export const WordList: React.FC<WordListProps> = ({ words, foundWords }) => {
  const foundSet = new Set(foundWords.map((w) => w.toUpperCase()));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find these words:</Text>
      <View style={styles.wordContainer}>
        {words.map((word, index) => {
          const isFound = foundSet.has(word.toUpperCase());
          return (
            <View key={index} style={styles.wordItem}>
              <Text
                style={[
                  styles.word,
                  isFound && styles.wordFound,
                ]}
              >
                {isFound ? '✓ ' : ''}{word.toUpperCase()}
              </Text>
              {isFound && <View style={styles.strikeThrough} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 12,
    textAlign: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  wordItem: {
    position: 'relative',
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  word: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  wordFound: {
    color: '#28A745',
  },
  strikeThrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#28A745',
    transform: [{ rotate: '-5deg' }],
  },
});

