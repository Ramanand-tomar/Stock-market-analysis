import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface DataPoint {
  date: string;
  volume: number | null;
}

interface Props {
  data: DataPoint[];
}

const screenWidth = Dimensions.get('window').width - 32;

export default function VolumeChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.volume != null)
    .map((d, i) => ({ x: i, volume: d.volume as number }))
    .reverse()
    .slice(-60);

  if (chartData.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volume</Text>
      <View style={{ height: 140, width: screenWidth }}>
        <CartesianChart data={chartData} xKey="x" yKeys={["volume"]}>
          {({ points, chartBounds }) => (
            <Bar
              points={points.volume}
              chartBounds={chartBounds}
              color={Colors.primaryLight}
              roundedCorners={{ topLeft: 2, topRight: 2 }}
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
});
