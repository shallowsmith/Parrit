import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { pie, arc } from 'd3-shape';
import { CATEGORY_COLORS, FALLBACK_COLORS, normalizeCategoryKey } from '@/constants/categoryColors';

type Group = { key: string; label: string; total: number; txs: any[] };

export default function BudgetDonut({ grouped, selectedGroup, setSelectedGroup, totalSpent, categories = [] }: { grouped: Group[]; selectedGroup: any; setSelectedGroup: (g: any) => void; totalSpent: number; categories?: any[] }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
        {totalSpent > 0 ? (
          <Svg width={240} height={240} viewBox="0 0 240 240">
            <G x={120} y={120}>
              {(() => {
                const values = grouped.map((g) => g.total);
                const pieGen = pie<number>().value((d: number) => d).sort(null as any);
                const arcs = pieGen(values);
                const radius = 100;
                const inner = 56;
                const arcGen = arc<any>().outerRadius(radius).innerRadius(inner).cornerRadius(4);

                return arcs.map((slice: any, i: number) => {
                  const path = arcGen(slice) || undefined;
                    const group = grouped[i];
                    // Derive color: prefer category color if available, otherwise map by normalized key
                    // Resolve color: prefer normalized category key from group, then server category color, then local mapping, then fallback palette
                    let color: string | undefined;
                    const key = normalizeCategoryKey(String(group.key || ''));
                    if (key && CATEGORY_COLORS[key]) color = CATEGORY_COLORS[key];
                    if (!color && categories && categories.length) {
                      const found = categories.find((c: any) => String(c.id) === String(group.key) || String(c._id) === String(group.key) || normalizeCategoryKey(c.name) === key);
                      if (found && found.color) color = found.color;
                      if (!color && found) color = CATEGORY_COLORS[normalizeCategoryKey(found.name)];
                    }
                    if (!color) color = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  const isSelected = selectedGroup && selectedGroup.key === group.key;
                  const pathForRender = isSelected
                    ? arc<any>().outerRadius(radius + 8).innerRadius(inner - 4).cornerRadius(6)(slice)
                    : path;

                  return (
                    <Path
                      key={i}
                      d={pathForRender}
                      fill={color}
                      stroke="#0b1220"
                      strokeWidth={isSelected ? 3 : 1}
                      onPress={() => setSelectedGroup(group)}
                    />
                  );
                });
              })()}
            </G>
          </Svg>
        ) : (
          <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0ea5a7' }} />
        )}

        <View style={{ position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -70 }, { translateY: -54 }], width: 140, height: 120, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{selectedGroup ? `$${(selectedGroup.total || 0).toFixed(2)}` : `$${totalSpent.toFixed(2)}`}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>{selectedGroup ? (selectedGroup.label || 'Category') : 'Spent'}</Text>
        </View>
      </View>
    </View>
  );
}
