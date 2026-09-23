import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';

export default function SortDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>Sort: {current.label}</Text>
        <Text style={styles.chevron}>{'\u25be'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  triggerText: { fontSize: 13, color: '#333' },
  chevron: { fontSize: 10, color: '#666' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-start' },
  menu: {
    marginTop: 100,
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  option: { paddingVertical: 12, paddingHorizontal: 16 },
  optionText: { fontSize: 15, color: '#333' },
  optionTextActive: { fontWeight: '600' },
});
