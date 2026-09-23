import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getCardById, setQuantity, setLocation, deleteCard } from '../db/database';

const LOCATIONS = ['Binder', 'Bulk', 'Deck'];

export default function EditCardScreen({ route, navigation }) {
  const { cardId } = route.params;
  const [card, setCard] = useState(null);
  const [quantity, setQuantityState] = useState(1);

  useFocusEffect(
    useCallback(() => {
      getCardById(cardId).then((c) => {
        if (c) {
          setCard(c);
          setQuantityState(c.quantity);
        }
      });
    }, [cardId])
  );

  if (!card) return <View style={styles.container} />;

  const handleSaveQuantity = async (newQuantity) => {
    setQuantityState(newQuantity);
    await setQuantity(cardId, newQuantity);
    if (newQuantity <= 0) {
      navigation.goBack();
    }
  };

  const handleLocationChange = async (location) => {
    setCard({ ...card, location });
    await setLocation(cardId, location);
  };

  const handleDelete = () => {
    Alert.alert('Delete card', `Remove ${card.name} from your collection entirely?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(cardId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {card.image_url ? (
          <Image source={{ uri: card.image_url }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: '#eee' }]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.type}>
            {card.type}
            {card.rarity ? ` \u00b7 ${card.rarity}` : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Quantity</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => handleSaveQuantity(quantity - 1)}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{quantity}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => handleSaveQuantity(quantity + 1)}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Location</Text>
      <View style={styles.locationRow}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[styles.locationChip, card.location === loc && styles.locationChipActive]}
            onPress={() => handleLocationChange(loc)}
          >
            <Text
              style={[
                styles.locationChipText,
                card.location === loc && styles.locationChipTextActive,
              ]}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete card</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  thumbnail: { width: 72, height: 100, borderRadius: 6 },
  name: { fontSize: 17, fontWeight: '600' },
  type: { fontSize: 13, color: '#666', marginTop: 4 },
  sectionLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20 },
  stepperValue: { fontSize: 18, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  locationRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  locationChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationChipActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  locationChipText: { fontSize: 13, color: '#555' },
  locationChipTextActive: { color: '#fff' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#e24b4a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#e24b4a', fontSize: 15, fontWeight: '600' },
});
