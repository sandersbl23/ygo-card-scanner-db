import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAllCards, getCardsByCategory, searchCards } from '../db/database';
import { exportCollection } from '../services/exportCollection';
import CardListItem from '../components/CardListItem';
import SortDropdown from '../components/SortDropdown';

const FILTERS = ['All', 'Monster', 'Spell', 'Trap'];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'rarity', label: 'Rarity' },
];

export default function CollectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [query, setQuery] = useState('');

  const loadCards = useCallback(async (filter, sort, search) => {
    let data;
    if (search && search.trim().length > 0) {
      data = await searchCards(search.trim(), { sortBy: sort });
      if (filter !== 'All') {
        data = data.filter((c) => c.category === filter);
      }
    } else if (filter === 'All') {
      data = await getAllCards({ sortBy: sort });
    } else {
      data = await getCardsByCategory(filter, { sortBy: sort });
    }
    setCards(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCards(activeFilter, sortBy, query);
    }, [activeFilter, sortBy, query, loadCards])
  );

  const handleExport = (format) => {
    Alert.alert('Export collection', `Export ${cards.length} visible cards as ${format.toUpperCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          const allCards = await getAllCards({ sortBy });
          await exportCollection(allCards, format);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() =>
            Alert.alert('Export as', undefined, [
              { text: 'CSV', onPress: () => handleExport('csv') },
              { text: 'JSON', onPress: () => handleExport('json') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortRow}>
        <SortDropdown value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        <Text style={styles.countText}>{cards.length} cards</Text>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('EditCard', { cardId: item.id })}>
            <CardListItem card={item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? 'No cards match your search.' : 'No cards yet - scan one to get started.'}
          </Text>
        }
        contentContainerStyle={[
          cards.length === 0 && styles.emptyContainer,
          { paddingBottom: 90 + insets.bottom },
        ]}
      />

      <TouchableOpacity
        style={[styles.scanButton, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>Scan a card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  topRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  exportButton: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exportButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  filterText: { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff' },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  countText: { fontSize: 12, color: '#888' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  scanButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
