import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { pie, arc } from 'd3-shape';
import { CATEGORY_COLORS, FALLBACK_COLORS, normalizeCategoryKey, getCategoryColor } from '@/constants/categoryColors';

type Group = { key: string; label: string; total: number; txs: any[] };

export default function BudgetDonut({ grouped, selectedGroup, setSelectedGroup, totalSpent, categories = [] }: { grouped: Group[]; selectedGroup: any; setSelectedGroup: (g: any) => void; totalSpent: number; categories?: any[] }) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.chartContainer}>
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
                    const color = getCategoryColor(group.key, categories, i);
                  const isSelected = selectedGroup && selectedGroup.key === group.key;
                  const pathForRender = isSelected
                    ? arc<any>().outerRadius(radius + 8).innerRadius(inner - 4).cornerRadius(6)(slice)
                    : path;

                  return (
                    <Path
                      key={i}
                      d={pathForRender || undefined}
                      fill={color}
                      stroke="#000000"
                      strokeWidth={isSelected ? 3 : 1}
                      onPress={() => setSelectedGroup(group)}
                    />
                  );
                });
              })()}
            </G>
          </Svg>
        ) : (
          <View style={styles.emptyDonut} />
        )}

        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerValue}>{selectedGroup ? `$${(selectedGroup.total || 0).toFixed(2)}` : `$${totalSpent.toFixed(2)}`}</Text>
          <Text style={styles.centerText}>{selectedGroup ? (selectedGroup.label || 'Category') : 'Spent'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDonut: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#0ea5a7',
  },
  centerLabel: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -70 }, { translateY: -54 }],
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  centerText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
});
