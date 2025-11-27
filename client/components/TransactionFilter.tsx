import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  categories?: any[];
  initial?: { startDate?: string; endDate?: string; categories?: string[] };
  onApply: (filters: { startDate?: string; endDate?: string; categories?: string[] }) => void;
  onClear: () => void;
};

export default function TransactionFilter({ visible, onClose, categories = [], initial = {}, onApply, onClear }: Props) {
  const [startDate, setStartDate] = useState(initial.startDate || '');
  const [endDate, setEndDate] = useState(initial.endDate || '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.categories || []));

  useEffect(() => {
    setStartDate(initial.startDate || '');
    setEndDate(initial.endDate || '');
    setSelected(new Set(initial.categories || []));
  }, [initial, visible]);

  const toggle = (id: string) => {
    const copy = new Set(selected);
    if (copy.has(id)) copy.delete(id);
    else copy.add(id);
    setSelected(copy);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.sectionLabel}>Date Range</Text>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TextInput placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} style={styles.input} />
            <Text style={styles.inputLabel}>End Date</Text>
            <TextInput placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} style={styles.inputEnd} />

            <Text style={styles.categoriesLabel}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((c: any) => {
                const id = c.id || c._id || c.name;
                const label = (c.name || c.label || id) as string;
                const checked = selected.has(String(id));
                return (
                  <TouchableOpacity key={id} onPress={() => toggle(String(id))} style={styles.categoryItem}>
                    <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.categoryLabel}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); setSelected(new Set()); onClear(); onClose(); }} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onApply({ startDate: startDate || undefined, endDate: endDate || undefined, categories: Array.from(selected) }); onClose(); }} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 16, 0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    backgroundColor: '#000000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#fff',
  },
  sectionLabel: {
    color: '#9CA3AF',
    marginBottom: 6,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111310',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inputEnd: {
    backgroundColor: '#111310',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoriesLabel: {
    color: '#9CA3AF',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2b3036',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7CA66B',
  },
  checkboxUnchecked: {
    backgroundColor: '#000000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
  },
  categoryLabel: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  clearButtonText: {
    color: '#fff',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#7CA66B',
  },
  applyButtonText: {
    color: '#fff',
  },
});
