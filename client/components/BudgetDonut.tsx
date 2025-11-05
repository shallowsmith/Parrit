import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { pie, arc } from 'd3-shape';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#10B981',
  rent: '#EF4444',
  utilities: '#3B82F6',
  transportation: '#F59E0B',
  entertainment: '#8B5CF6',
  travel: '#06B6D4',
  gift: '#EC4899',
  misc: '#ffe100ff',
};

const FALLBACK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

type Group = { key: string; label: string; total: number; txs: any[] };

export default function BudgetDonut({ grouped, selectedGroup, setSelectedGroup, totalSpent }: { grouped: Group[]; selectedGroup: any; setSelectedGroup: (g: any) => void; totalSpent: number; }) {
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
                  const color = CATEGORY_COLORS[group.key] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
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
          <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0ea5a7' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>${totalSpent.toFixed(2)}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>Spent</Text>
          </View>
        )}

        <View style={{ position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -70 }, { translateY: -40 }], width: 140, height: 120, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{selectedGroup ? `$${(selectedGroup.total || 0).toFixed(2)}` : `$${totalSpent.toFixed(2)}`}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>{selectedGroup ? (selectedGroup.label || 'Category') : 'Spent'}</Text>
        </View>
      </View>
    </View>
  );
}
