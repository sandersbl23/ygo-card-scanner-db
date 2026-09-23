import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getDeckCards,
  addCardToDeck,
  setDeckCardQuantity,
  removeCardFromDeck,
  searchCards,
} from '../db/database';

export default function DeckDetailScreen({ route, navigation }) {
  const { deckId, deckName } = route.params;
  const [deckCards, setDeckCards] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const loadDeckCards = useCallback(async () => {
    setDeckCards(await getDeckCards(deckId));
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: deckName });
      loadDeckCards();
    }, [loadDeckCards, navigation, deckName])
  );

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setSearchResults(await searchCards(text.trim()));
  };

  const handleAddCard = async (cardId) => {
    await addCardToDeck(deckId, cardId);
    loadDeckCards();
  };

  const handleQuantityChange = async (deckCardId, quantity) => {
    await setDeckCardQuantity(deckCardId, quantity);
    loadDeckCards();
  };

  const totalCards = deckCards.reduce((sum, c) => sum + c.deck_quantity, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{totalCards} card{totalCards === 1 ? '' : 's'} in this deck</Text>

      <FlatList
        data={deckCards}
        keyExtractor={(item) => String(item.deck_card_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardType}>{item.type}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => handleQuantityChange(item.deck_card_id, item.deck_quantity - 1)}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{item.deck_quantity}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => handleQuantityChange(item.deck_card_id, item.deck_quantity + 1)}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeCardFromDeck(item.deck_card_id).then(loadDeckCards)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No cards in this deck yet.</Text>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.addButtonText}>Add card from collection</Text>
      </TouchableOpacity>

      <Modal visible={addModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your collection"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.searchResultRow} onPress={() => handleAddCard(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardType}>
                    {item.type} - you own {item.quantity}
                  </Text>
                </View>
                <Text style={styles.addLabel}>Add</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery ? (
                <Text style={styles.emptyText}>No matches in your collection.</Text>
              ) : null
            }
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              setAddModalVisible(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  summary: { fontSize: 13, color: '#666', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  cardName: { fontSize: 14, fontWeight: '500' },
  cardType: { fontSize: 12, color: '#666', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 15 },
  stepperValue: { fontSize: 14, fontWeight: '600', minWidth: 18, textAlign: 'center' },
  removeButton: { paddingHorizontal: 8 },
  removeButtonText: { color: '#e24b4a', fontSize: 12, fontWeight: '500' },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 24 },
  addButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addLabel: { color: '#1a1a1a', fontSize: 13, fontWeight: '600' },
  doneButton: { paddingVertical: 14, alignItems: 'center' },
  doneButtonText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
});
