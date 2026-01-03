import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { PuzzleGrid } from '../components/PuzzleGrid';
import { THEMES } from '../data/themes';
import { generatePuzzle, PlacedWord } from '../lib/puzzle-generator';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Game: { themeId: string };
};

type GameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Game'
>;

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: {
    params: { themeId: string };
  };
}

export const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { themeId } = route.params;
  const theme = THEMES.find((t) => t.id === themeId);

  useEffect(() => {
    console.log('GameScreen mounted with themeId:', themeId);
    if (!theme) {
      console.error('Theme not found:', themeId);
    }
  }, [themeId, theme]);

  const [puzzle, setPuzzle] = useState<{ grid: string[][]; placedWords: PlacedWord[] } | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordPositions, setFoundWordPositions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (theme) {
      const newPuzzle = generatePuzzle(theme.words, 12);
      setPuzzle(newPuzzle);
      setFoundWords([]);
      setFoundWordPositions(new Set());
    }
  }, [theme]);

  const handleWordSelect = useCallback(
    (selectedWord: string) => {
      if (!puzzle || !theme) return;

      const upperWord = selectedWord.toUpperCase();
      const reversedWord = upperWord.split('').reverse().join('');

      // Check both forward and reverse
      const wordsToCheck = [upperWord];
      if (reversedWord !== upperWord) {
        wordsToCheck.push(reversedWord);
      }

      for (const wordToCheck of wordsToCheck) {
        // Skip if already found
        if (foundWords.includes(wordToCheck)) continue;

        // Check if word is in theme
        const isInTheme = theme.words.some(
          (w) => w.toUpperCase() === wordToCheck
        );

        if (isInTheme) {
          // Check if it matches a placed word (validate positions)
          const placedWord = puzzle.placedWords.find(
            (pw) => pw.word === wordToCheck
          );

          if (placedWord) {
            // Word found!
            setFoundWords((prev) => {
              if (prev.includes(wordToCheck)) return prev;
              const newFound = [...prev, wordToCheck];
              
              // Check if all words found
              if (newFound.length === theme.words.length) {
                setTimeout(() => {
                  Alert.alert(
                    'Congratulations! 🎉',
                    'You found all the words!',
                    [
                      {
                        text: 'New Game',
                        onPress: () => {
                          const newPuzzle = generatePuzzle(theme.words, 12);
                          setPuzzle(newPuzzle);
                          setFoundWords([]);
                          setFoundWordPositions(new Set());
                        },
                      },
                      {
                        text: 'Back to Home',
                        onPress: () => navigation.goBack(),
                      },
                    ]
                  );
                }, 500);
              }
              
              return newFound;
            });
            
            // Mark positions as found
            setFoundWordPositions((prev) => {
              const newSet = new Set(prev);
              const positionKeys = placedWord.positions.map(
                (pos) => `${pos.row}-${pos.col}`
              );
              positionKeys.forEach((key) => newSet.add(key));
              return newSet;
            });

            // Haptic feedback (with error handling for Android/web)
            try {
              if (Haptics && Haptics.notificationAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              // Haptics may not be available on all devices
              // Silently fail - not critical for functionality
            }

            break; // Found the word, no need to check reverse
          }
        }
      }
    },
    [puzzle, theme, foundWords, navigation]
  );

  const handleReset = () => {
    if (theme) {
      const newPuzzle = generatePuzzle(theme.words, 12);
      setPuzzle(newPuzzle);
      setFoundWords([]);
      setFoundWordPositions(new Set());
    }
  };

  if (!theme || !puzzle) {
    return (
      <View style={styles.container}>
        <Text allowFontScaling={false} style={styles.errorText}>Theme not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text allowFontScaling={false} style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.headerTitle}>{theme.title}</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text allowFontScaling={false} style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <PuzzleGrid
          grid={puzzle.grid}
          boxSize={32}
          foundWords={foundWords}
          foundWordPositions={foundWordPositions}
          onWordSelect={handleWordSelect}
        />
      </View>

      {/* Footer - Words to Find */}
      <View style={styles.footer}>
        <Text allowFontScaling={false} style={styles.footerTitle}>Words to Find</Text>
        <ScrollView style={styles.wordList} contentContainerStyle={styles.wordListContent}>
          {theme.words.map((word, index) => {
            const isFound = foundWords.includes(word.toUpperCase());
            return (
              <View key={index} style={styles.wordItem}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.wordText,
                    isFound && styles.wordTextFound,
                  ]}
                >
                  {word}
                </Text>
                {isFound && <View style={styles.strikeThrough} />}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Slate-700
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3B82F6', // Blue-500
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: '#F1F5F9', // Slate-100
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    color: '#EF4444', // Red-500
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footer: {
    height: 200,
    backgroundColor: '#1E293B', // Slate-800
    borderTopWidth: 1,
    borderTopColor: '#334155', // Slate-700
    padding: 16,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: '#F1F5F9', // Slate-100
    marginBottom: 12,
  },
  wordList: {
    flex: 1,
  },
  wordListContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordItem: {
    position: 'relative',
    marginRight: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0F172A', // Slate-900
    borderRadius: 8,
  },
  wordText: {
    fontSize: 16,
    color: '#94A3B8', // Slate-400
    fontWeight: '500',
  },
  wordTextFound: {
    color: '#10B981', // Green-500
    textDecorationLine: 'line-through',
  },
  strikeThrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#10B981', // Green-500
  },
  errorText: {
    color: '#EF4444', // Red-500
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});

