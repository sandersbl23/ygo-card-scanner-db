import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getAllCards, getCardsByType } from '../db/database';
import CardListItem from '../components/CardListItem';

const FILTERS = ['All', 'Monster', 'Spell', 'Trap'];

export default function CollectionScreen({ navigation }) {
  const [cards, setCards] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const loadCards = useCallback(async (filter) => {
    const data =
      filter === 'All' ? await getAllCards() : await getCardsByType(filter);
    setCards(data);
  }, []);

  // Reload every time the screen regains focus (e.g. after adding a card)
  useFocusEffect(
    useCallback(() => {
      loadCards(activeFilter);
    }, [activeFilter, loadCards])
  );

  return (
    <View style={styles.container}>
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

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CardListItem card={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No cards yet - scan one to get started.</Text>
        }
        contentContainerStyle={cards.length === 0 && styles.emptyContainer}
      />

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>Scan a card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
  scanButton: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
