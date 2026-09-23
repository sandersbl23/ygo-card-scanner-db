import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDecks, createDeck, deleteDeck } from '../db/database';

export default function DecksScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [decks, setDecks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const loadDecks = useCallback(async () => {
    setDecks(await getDecks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks])
  );

  const handleCreate = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    await createDeck(name);
    setNewDeckName('');
    setModalVisible(false);
    loadDecks();
  };

  const handleDelete = (deck) => {
    Alert.alert('Delete deck', `Delete "${deck.name}"? Cards stay in your collection.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDeck(deck.id);
          loadDecks();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deckRow}
            onPress={() => navigation.navigate('DeckDetail', { deckId: item.id, deckName: item.name })}
            onLongPress={() => handleDelete(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.deckCount}>{item.card_count} card{item.card_count === 1 ? '' : 's'}</Text>
            </View>
            <Text style={styles.chevron}>{'\u203a'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No decks yet - create one to start building.</Text>
        }
        contentContainerStyle={[decks.length === 0 && styles.emptyContainer, { paddingBottom: 90 + insets.bottom }]}
      />

      <TouchableOpacity
        style={[styles.addButton, { bottom: 16 + insets.bottom }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>New deck</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name your deck</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Blue-Eyes Deck"
              value={newDeckName}
              onChangeText={setNewDeckName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewDeckName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleCreate}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  deckName: { fontSize: 15, fontWeight: '500' },
  deckCount: { fontSize: 12, color: '#888', marginTop: 2 },
  chevron: { fontSize: 20, color: '#ccc' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  addButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  modalButtonPrimary: { backgroundColor: '#1a1a1a' },
  modalButtonText: { fontSize: 14, color: '#333', fontWeight: '500' },
  modalButtonTextPrimary: { color: '#fff' },
});
