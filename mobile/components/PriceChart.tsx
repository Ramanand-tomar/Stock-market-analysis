import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface DataPoint {
  date: string;
  close: number | null;
}

interface Props {
  data: DataPoint[];
  title?: string;
}

const screenWidth = Dimensions.get('window').width - 32;

export default function PriceChart({ data, title = 'Price History' }: Props) {
  const chartData = data
    .filter((d) => d.close != null)
    .map((d, i) => ({ x: i, close: d.close as number }))
    .reverse();

  if (chartData.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No price data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ height: 220, width: screenWidth }}>
        <CartesianChart data={chartData} xKey="x" yKeys={["close"]}>
          {({ points }) => (
            <Line
              points={points.close}
              color={Colors.primaryLight}
              strokeWidth={2}
              curveType="natural"
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xs },
  empty: { height: 150, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
