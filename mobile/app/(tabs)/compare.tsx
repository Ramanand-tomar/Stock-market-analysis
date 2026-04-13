import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store/store';
import { setMetricsLoading, setMetrics } from '../../store/slices/predictionsSlice';
import { getAllMetrics } from '../../api/predictions';
import ModelMetricsTable from '../../components/ModelMetricsTable';
import ModelComparisonBarChart from '../../components/ModelComparisonBarChart';
import ModelDetailCard from '../../components/ModelDetailCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

type ViewType = 'classification' | 'regression';
type DisplayMode = 'charts' | 'table';

export default function CompareScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { metrics, metricsLoading } = useSelector((s: RootState) => s.predictions);
  const [view, setView] = useState<ViewType>('classification');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('charts');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  const models = metrics?.[view] || {};
  const unsupervised = metrics?.unsupervised || {};
  const entries = Object.entries(models);

  // Sort entries: best model first
  const sortedEntries = [...entries].sort(([, a]: [string, any], [, b]: [string, any]) => {
    if (a.best) return -1;
    if (b.best) return 1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        <Text style={styles.heading}>Model Comparison</Text>
        <Text style={styles.subtitle}>
          Visualize and compare ML model performance
        </Text>

        {/* Type Toggle */}
        <View style={styles.toggleRow}>
          {(['classification', 'regression'] as ViewType[]).map((v) => (
            <Pressable
              key={v}
              style={[styles.toggle, view === v && styles.toggleActive]}
              onPress={() => setView(v)}
            >
              <Ionicons
                name={v === 'classification' ? 'git-branch' : 'trending-up'}
                size={14}
                color={view === v ? Colors.white : Colors.textMuted}
              />
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Display Mode Toggle */}
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, displayMode === 'charts' && styles.modeBtnActive]}
            onPress={() => setDisplayMode('charts')}
          >
            <Ionicons name="bar-chart" size={14} color={displayMode === 'charts' ? Colors.primaryLight : Colors.textMuted} />
            <Text style={[styles.modeText, displayMode === 'charts' && styles.modeTextActive]}>Charts</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, displayMode === 'table' && styles.modeBtnActive]}
            onPress={() => setDisplayMode('table')}
          >
            <Ionicons name="grid" size={14} color={displayMode === 'table' ? Colors.primaryLight : Colors.textMuted} />
            <Text style={[styles.modeText, displayMode === 'table' && styles.modeTextActive]}>Table</Text>
          </Pressable>
        </View>

        {metricsLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : displayMode === 'table' ? (
          <ModelMetricsTable models={models} type={view} />
        ) : (
          <View>
            {/* Summary Stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNum}>{entries.length}</Text>
                <Text style={styles.summaryLabel}>Models</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="star" size={14} color={Colors.warning} />
                <Text style={styles.summaryBest} numberOfLines={1}>
                  {entries.find(([, m]: [string, any]) => m.best)?.[0]?.replace(/_/g, ' ') || '-'}
                </Text>
                <Text style={styles.summaryLabel}>Best Model</Text>
              </View>
            </View>

            {/* Comparison Bar Charts */}
            {view === 'classification' ? (
              <>
                <ModelComparisonBarChart
                  models={models}
                  type="classification"
                  metric="f1"
                  metricLabel="F1 Score"
                  formatValue={(v) => v.toFixed(3)}
                />
                <ModelComparisonBarChart
                  models={models}
                  type="classification"
                  metric="accuracy"
                  metricLabel="Accuracy"
                  formatValue={(v) => `${(v * 100).toFixed(1)}%`}
                />
              </>
            ) : (
              <>
                <ModelComparisonBarChart
                  models={models}
                  type="regression"
                  metric="r2"
                  metricLabel="R² Score"
                  formatValue={(v) => v.toFixed(4)}
                />
                <ModelComparisonBarChart
                  models={models}
                  type="regression"
                  metric="rmse"
                  metricLabel="RMSE (lower is better)"
                  formatValue={(v) => v.toFixed(2)}
                />
                <ModelComparisonBarChart
                  models={models}
                  type="regression"
                  metric="mae"
                  metricLabel="MAE (lower is better)"
                  formatValue={(v) => v.toFixed(2)}
                />
              </>
            )}

            {/* Individual Model Detail Cards */}
            <Text style={styles.sectionHeading}>Individual Model Details</Text>
            <Text style={styles.sectionSub}>Tap a model to expand its detailed graphs</Text>

            {sortedEntries.map(([name, data], index) => (
              <ModelDetailCard
                key={name}
                name={name}
                data={data}
                type={view}
                index={index}
              />
            ))}

            {/* Unsupervised Section */}
            {unsupervised && (unsupervised.pca || unsupervised.kmeans) && (
              <View style={styles.unsupervisedSection}>
                <Text style={styles.sectionHeading}>Unsupervised Models</Text>

                {unsupervised.pca && (
                  <View style={styles.unsupervisedCard}>
                    <View style={styles.unsupHeader}>
                      <Ionicons name="analytics" size={16} color={Colors.primaryLight} />
                      <Text style={styles.unsupTitle}>PCA (Dimensionality Reduction)</Text>
                    </View>
                    <View style={styles.unsupMetrics}>
                      <View style={styles.unsupMetric}>
                        <Text style={styles.unsupValue}>{unsupervised.pca.n_components}</Text>
                        <Text style={styles.unsupLabel}>Components</Text>
                      </View>
                      <View style={styles.unsupMetric}>
                        <Text style={styles.unsupValue}>
                          {((unsupervised.pca.total_explained_variance ?? 0) * 100).toFixed(1)}%
                        </Text>
                        <Text style={styles.unsupLabel}>Variance Explained</Text>
                      </View>
                    </View>
                    {/* PCA Explained Variance Bars */}
                    {unsupervised.pca.explained_variance_ratio && (
                      <View style={styles.varianceBars}>
                        {unsupervised.pca.explained_variance_ratio.map((v: number, i: number) => (
                          <View key={i} style={styles.varianceRow}>
                            <Text style={styles.varianceLabel}>PC{i + 1}</Text>
                            <View style={styles.varianceTrack}>
                              <View style={[styles.varianceFill, { width: `${v * 100}%` }]} />
                            </View>
                            <Text style={styles.varianceVal}>{(v * 100).toFixed(1)}%</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {unsupervised.kmeans && (
                  <View style={styles.unsupervisedCard}>
                    <View style={styles.unsupHeader}>
                      <Ionicons name="ellipse" size={16} color={Colors.secondary} />
                      <Text style={styles.unsupTitle}>K-Means Clustering</Text>
                    </View>
                    <View style={styles.unsupMetrics}>
                      <View style={styles.unsupMetric}>
                        <Text style={styles.unsupValue}>{unsupervised.kmeans.n_clusters}</Text>
                        <Text style={styles.unsupLabel}>Clusters</Text>
                      </View>
                      <View style={styles.unsupMetric}>
                        <Text style={styles.unsupValue}>{unsupervised.kmeans.inertia?.toFixed(0) ?? '-'}</Text>
                        <Text style={styles.unsupLabel}>Inertia</Text>
                      </View>
                    </View>
                    {/* Cluster size bars */}
                    {unsupervised.kmeans.cluster_sizes && (
                      <View style={styles.varianceBars}>
                        {Object.entries(unsupervised.kmeans.cluster_sizes).map(([id, count]) => {
                          const total = Object.values(unsupervised.kmeans.cluster_sizes).reduce((a: number, b: any) => a + b, 0) as number;
                          const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                          return (
                            <View key={id} style={styles.varianceRow}>
                              <Text style={styles.varianceLabel}>C{id}</Text>
                              <View style={styles.varianceTrack}>
                                <View style={[styles.varianceFill, {
                                  width: `${pct}%`,
                                  backgroundColor: Colors.secondary,
                                }]} />
                              </View>
                              <Text style={styles.varianceVal}>{count as number} ({pct.toFixed(0)}%)</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.xs },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg },
  toggleRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  toggleTextActive: { color: Colors.white },
  modeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignSelf: 'flex-end',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary + '25',
  },
  modeText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  modeTextActive: { color: Colors.primaryLight },
  loader: { marginTop: Spacing.xxxl },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  summaryNum: {
    color: Colors.primaryLight,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  summaryBest: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sectionHeading: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  sectionSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  unsupervisedSection: {
    marginTop: Spacing.md,
  },
  unsupervisedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  unsupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  unsupTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  unsupMetrics: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  unsupMetric: {
    alignItems: 'center',
  },
  unsupValue: {
    color: Colors.primaryLight,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  unsupLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  varianceBars: {
    marginTop: Spacing.xs,
  },
  varianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  varianceLabel: {
    width: 30,
    color: Colors.textSecondary,
    fontSize: 10,
    textAlign: 'right',
  },
  varianceTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
  },
  varianceFill: {
    height: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
  },
  varianceVal: {
    width: 70,
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'right',
  },
});
