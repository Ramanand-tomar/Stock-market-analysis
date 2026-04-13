import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { getClusters, getPCA, type Cluster, type PCAPoint } from '../../api/insights';
import ClusterCard from '../../components/ClusterCard';
import PCAScatterPlot from '../../components/PCAScatterPlot';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

type ViewMode = 'clusters' | 'pca';

export default function InsightsScreen() {
  const [view, setView] = useState<ViewMode>('clusters');
  const [clusters, setClusters] = useState<Record<string, Cluster>>({});
  const [pcaPoints, setPcaPoints] = useState<PCAPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clusterRes, pcaRes] = await Promise.all([getClusters(), getPCA()]);
      setClusters(clusterRes.data.clusters);
      setPcaPoints(pcaRes.data.points);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>ML Insights</Text>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        {(['clusters', 'pca'] as ViewMode[]).map((v) => (
          <Pressable
            key={v}
            style={[styles.toggle, view === v && styles.toggleActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {v === 'clusters' ? 'Clusters' : 'PCA Map'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : view === 'clusters' ? (
        <>
          <Text style={styles.subtitle}>
            {Object.keys(clusters).length} clusters across {
              Object.values(clusters).reduce((sum, c) => sum + c.count, 0)
            } stocks
          </Text>
          {Object.values(clusters)
            .sort((a, b) => a.cluster_id - b.cluster_id)
            .map((cluster) => (
              <ClusterCard key={cluster.cluster_id} cluster={cluster} />
            ))}
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            49 stocks projected onto 2 principal components, colored by sector
          </Text>
          <PCAScatterPlot points={pcaPoints} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.lg },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.lg },
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
  errorBox: { alignItems: 'center', marginTop: Spacing.xxxl },
  errorText: { color: Colors.danger, fontSize: FontSize.md, marginBottom: Spacing.md },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
});
