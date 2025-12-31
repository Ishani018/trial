import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WordSearchGame } from './GameLogic';
import { Grid } from './components/Grid';
import { WordList } from './components/WordList';

export default function App() {
  // Simple words for children
  const initialWords = ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'FISH', 'BIRD', 'BOOK'];
  
  const [game] = useState(() => new WordSearchGame(initialWords, 10));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleWordFound = useCallback((word: string) => {
    setFoundWords((prev) => {
      if (!prev.includes(word)) {
        const newFound = [...prev, word];
        
        // Check if all words are found
        if (newFound.length === initialWords.length) {
          setTimeout(() => {
            Alert.alert(
              'Congratulations! 🎉',
              'You found all the words! Great job!',
              [{ text: 'OK' }]
            );
          }, 300);
        }
        
        return newFound;
      }
      return prev;
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Word Search Fun! 🔍</Text>
          <Text style={styles.subtitle}>
            Drag your finger across letters to find words!
          </Text>
        </View>

        <Grid game={game} onWordFound={handleWordFound} />

        <WordList words={initialWords} foundWords={foundWords} />

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Found: {foundWords.length} / {initialWords.length}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1',
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFA07A',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFE5B4',
    borderRadius: 20,
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B9D',
    textAlign: 'center',
  },
});
