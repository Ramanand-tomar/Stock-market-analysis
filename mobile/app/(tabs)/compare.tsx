import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setMetricsLoading, setMetrics } from '../../store/slices/predictionsSlice';
import { getAllMetrics } from '../../api/predictions';
import ModelMetricsTable from '../../components/ModelMetricsTable';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

type ViewType = 'classification' | 'regression';

export default function CompareScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { metrics, metricsLoading } = useSelector((s: RootState) => s.predictions);
  const [view, setView] = useState<ViewType>('classification');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    dispatch(setMetricsLoading(true));
    try {
      const { data } = await getAllMetrics();
      dispatch(setMetrics(data));
    } catch {
      dispatch(setMetricsLoading(false));
    }
  };

  const models = metrics?.[view] || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Model Comparison</Text>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        {(['classification', 'regression'] as ViewType[]).map((v) => (
          <Pressable
            key={v}
            style={[styles.toggle, view === v && styles.toggleActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {metricsLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ModelMetricsTable models={models} type={view} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.lg },
  toggleRow: { flexDirection: 'row', marginBottom: Spacing.lg, gap: Spacing.sm },
  toggle: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  toggleTextActive: { color: Colors.white },
  loader: { marginTop: Spacing.xxxl },
});
