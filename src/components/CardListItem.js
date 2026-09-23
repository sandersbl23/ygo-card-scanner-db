import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function CardListItem({ card }) {
  return (
    <View style={styles.row}>
      {card.image_url ? (
        <Image source={{ uri: card.image_url }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.subtitle}>
          {card.type}
          {card.rarity ? ` \u00b7 ${card.rarity}` : ''}
        </Text>
        {card.location && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>{card.location}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quantity}>x{card.quantity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  thumbnail: { width: 32, height: 44, borderRadius: 4, backgroundColor: '#eee' },
  thumbnailPlaceholder: { backgroundColor: '#ddd' },
  name: { fontSize: 14, fontWeight: '500' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 4,
  },
  locationText: { fontSize: 10, color: '#666', fontWeight: '500' },
  quantity: { fontSize: 13, fontWeight: '600', color: '#333' },
});
