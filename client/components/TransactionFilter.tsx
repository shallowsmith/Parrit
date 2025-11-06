import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';

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
      <View style={{ flex: 1, backgroundColor: 'rgba(17, 19, 16, 0.3)', justifyContent: 'flex-end' }}>
        <View style={{ height: '85%', backgroundColor: '#000000', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: '#9CA3AF' }}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={{ color: '#9CA3AF', marginBottom: 6 }}>Date Range</Text>
            <Text style={{ color: '#fff', marginBottom: 6 }}>Start Date</Text>
            <TextInput placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} style={{ backgroundColor: '#111310', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 }} />
            <Text style={{ color: '#fff', marginBottom: 6 }}>End Date</Text>
            <TextInput placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} style={{ backgroundColor: '#111310', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16 }} />

            <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>Categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((c: any) => {
                const id = c.id || c._id || c.name;
                const label = (c.name || c.label || id) as string;
                const checked = selected.has(String(id));
                return (
                  <TouchableOpacity key={id} onPress={() => toggle(String(id))} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 12 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: checked ? '#7CA66B' : '#000000', borderWidth: 1, borderColor: '#2b3036', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={{ color: '#fff' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); setSelected(new Set()); onClear(); onClose(); }} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#000000' }}>
              <Text style={{ color: '#fff' }}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onApply({ startDate: startDate || undefined, endDate: endDate || undefined, categories: Array.from(selected) }); onClose(); }} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#7CA66B' }}>
              <Text style={{ color: '#000000' }}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
