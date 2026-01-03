import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEMES, Theme } from '../data/themes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Game: { themeId: string };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  React.useEffect(() => {
    console.log('HomeScreen mounted');
  }, []);

  const renderThemeCard = ({ item }: { item: Theme }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Game', { themeId: item.id })}
      activeOpacity={0.7}
    >
      <Text allowFontScaling={false} style={styles.cardTitle}>{item.title}</Text>
      <Text allowFontScaling={false} style={styles.cardSubtitle}>{item.words.length} words</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text allowFontScaling={false} style={styles.title}>Word Search</Text>
      <Text allowFontScaling={false} style={styles.subtitle}>Choose a Theme</Text>
      
      <FlatList
        data={THEMES}
        renderItem={renderThemeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as any,
    color: '#F1F5F9', // Slate-100
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8', // Slate-400
    textAlign: 'center',
    marginBottom: 32,
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 0,
    width: '48%' as any,
    backgroundColor: '#1E293B', // Slate-800
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: '#F1F5F9', // Slate-100
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94A3B8', // Slate-400
  },
});

