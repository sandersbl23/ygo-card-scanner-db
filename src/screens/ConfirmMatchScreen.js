import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

import { getPrintings, getPrimaryImageUrl } from '../services/ygoApi';
import { addOrIncrementCard } from '../db/database';

export default function ConfirmMatchScreen({ route, navigation }) {
  const { candidates } = route.params;
  // searchCardsFuzzy ranks candidates by similarity to the vision guess,
  // so the best match is first - but OCR misreads mean it's not always
  // right, so the other candidates stay selectable below.
  const [selectedIndex, setSelectedIndex] = useState(0);
  const card = candidates[selectedIndex];
  const printings = useMemo(() => getPrintings(card), [card]);
  const [selectedPrinting, setSelectedPrinting] = useState(printings[0]);
  const [quantity, setQuantity] = useState(1);

  // Reset the chosen printing whenever the selected candidate card changes.
  React.useEffect(() => {
    setSelectedPrinting(printings[0]);
  }, [printings]);

  const handleAdd = async () => {
    await addOrIncrementCard({
      ygo_id: card.id,
      name: card.name,
      type: card.type,
      rarity: selectedPrinting.rarity,
      set_code: selectedPrinting.set_code,
      image_url: getPrimaryImageUrl(card),
      quantity,
    });
    navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Image source={{ uri: getPrimaryImageUrl(card) }} style={styles.thumbnail} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.type}>{card.type}</Text>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>
              {selectedIndex === 0 ? 'Match found' : 'Alternate match'}
            </Text>
          </View>
        </View>
      </View>

      {candidates.length > 1 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Not the right card?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {candidates.map((candidate, index) => (
              <TouchableOpacity
                key={candidate.id}
                style={[
                  styles.candidateChip,
                  index === selectedIndex && styles.candidateChipSelected,
                ]}
                onPress={() => setSelectedIndex(index)}
              >
                <Text
                  style={[
                    styles.candidateChipText,
                    index === selectedIndex && styles.candidateChipTextSelected,
                  ]}
                >
                  {candidate.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Select printing</Text>
      {printings.map((printing, index) => {
        const isSelected = printing === selectedPrinting;
        return (
          <TouchableOpacity
            key={`${printing.set_code}-${index}`}
            style={[styles.printingRow, isSelected && styles.printingRowSelected]}
            onPress={() => setSelectedPrinting(printing)}
          >
            <Text style={styles.printingText}>
              {printing.rarity ?? 'Unknown rarity'}
              {printing.set_code ? ` \u00b7 ${printing.set_code}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.quantityRow}>
        <Text style={styles.sectionLabel}>Quantity</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Add to collection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  thumbnail: { width: 72, height: 100, borderRadius: 6, backgroundColor: '#eee' },
  name: { fontSize: 17, fontWeight: '600' },
  type: { fontSize: 13, color: '#666', marginTop: 2, marginBottom: 6 },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f5e9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  matchBadgeText: { color: '#1c7c3f', fontSize: 12, fontWeight: '500' },
  candidateChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  candidateChipSelected: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  candidateChipText: { fontSize: 12, color: '#555' },
  candidateChipTextSelected: { color: '#fff' },
  sectionLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  printingRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  printingRowSelected: { borderColor: '#1a1a1a', borderWidth: 2 },
  printingText: { fontSize: 14 },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 18 },
  stepperValue: { fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  addButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
