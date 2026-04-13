import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
  Animated, Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import {
  setPredictionLoading, setPrediction, setExplanation, setPredictionError, clearPrediction,
} from '../../../store/slices/predictionsSlice';
import { getPrediction, getExplanation } from '../../../api/predictions';
import PredictionCard from '../../../components/PredictionCard';
import FeatureImportanceChart from '../../../components/FeatureImportanceChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

export default function StockPredictScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { current, explanation, loading, error } = useSelector((s: RootState) => s.predictions);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultTranslateY = useRef(new Animated.Value(30)).current;

  const fetchPrediction = async () => {
    if (!ticker) return;
    dispatch(setPredictionLoading(true));
    try {
      const [predRes, explRes] = await Promise.all([
        getPrediction(ticker),
        getExplanation(ticker),
      ]);
      dispatch(setPrediction(predRes.data));
      dispatch(setExplanation(explRes.data));
    } catch (err: any) {
      dispatch(setPredictionError(err.response?.data?.detail || 'Prediction failed'));
    }
  };

  useEffect(() => {
    if (!ticker) return;
    dispatch(clearPrediction());
    fetchPrediction();
  }, [ticker]);

  // Animate results
  useEffect(() => {
    if (current) {
      resultOpacity.setValue(0);
      resultTranslateY.setValue(30);
      Animated.parallel([
        Animated.timing(resultOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(resultTranslateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      ]).start();
    }
  }, [current]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrediction();
    setRefreshing(false);
  };

  const displayTicker = ticker?.replace('.NS', '') || '';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          title: `${displayTicker} Prediction`,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* ── Loading State ─────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.loadingTitle}>Analyzing {displayTicker}</Text>
            <Text style={styles.loadingSubtitle}>Running ML models on latest market data...</Text>
            <View style={styles.loadingSteps}>
              {['Fetching market data', 'Running regression model', 'Running classification model', 'Computing confidence'].map((step, i) => (
                <View key={i} style={styles.loadingStep}>
                  <View style={[styles.loadingDot, i < 2 && styles.loadingDotActive]} />
                  <Text style={[styles.loadingStepText, i < 2 && styles.loadingStepTextActive]}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Error State ───────────────────────────────────────────── */}
        {error && !loading && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="alert-circle" size={32} color={Colors.danger} />
            </View>
            <Text style={styles.errorTitle}>Prediction Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchPrediction}>
              <Ionicons name="refresh" size={16} color={Colors.white} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        {current && (
          <Animated.View style={{ opacity: resultOpacity, transform: [{ translateY: resultTranslateY }] }}>
            {/* Ticker header badge */}
            <View style={styles.tickerHeader}>
              <View style={styles.tickerBadge}>
                <Ionicons name="pulse" size={16} color={Colors.primaryLight} />
                <Text style={styles.tickerBadgeText}>{displayTicker}</Text>
              </View>
              <Pressable style={styles.refreshBtn} onPress={handleRefresh}>
                <Ionicons name="refresh" size={16} color={Colors.primaryLight} />
              </Pressable>
            </View>

            {/* Prediction card */}
            <PredictionCard
              predictedClose={current.predicted_close}
              direction={current.direction}
              confidence={current.confidence}
              modelUsed={current.model_used}
              insight={current.insight}
              cached={current.cached}
            />

            {/* Feature importance */}
            {explanation && (
              <View style={styles.featSection}>
                <View style={styles.featHeader}>
                  <Ionicons name="bar-chart" size={16} color={Colors.primaryLight} />
                  <Text style={styles.featTitle}>Key Prediction Drivers</Text>
                </View>
                <FeatureImportanceChart features={explanation.top_features} />
                {explanation.insight && (
                  <View style={styles.insightExplain}>
                    <Ionicons name="information-circle" size={14} color={Colors.primaryLight} />
                    <Text style={styles.insightExplainText}>{explanation.insight}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Back to stock detail */}
            <Pressable
              style={styles.backToStockBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primaryLight} />
              <Text style={styles.backToStockText}>Back to {displayTicker} Details</Text>
            </Pressable>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="shield-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>
                Predictions are generated by ML models and should not be used as financial advice. Always do your own research.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingVertical: Spacing.lg, paddingBottom: 100 },

  // Loading
  loadingCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, margin: Spacing.lg,
    padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  loadingIconWrap: { marginBottom: Spacing.md },
  loadingTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  loadingSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xl },
  loadingSteps: { width: '100%', gap: Spacing.md },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceLight },
  loadingDotActive: { backgroundColor: Colors.secondary },
  loadingStepText: { color: Colors.textMuted, fontSize: FontSize.sm },
  loadingStepTextActive: { color: Colors.textSecondary },

  // Error
  errorCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, margin: Spacing.lg,
    padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger + '30',
  },
  errorIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.danger + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  errorTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  errorMessage: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.lg },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },

  // Ticker header
  tickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  tickerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  tickerBadgeText: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: '800' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },

  // Feature section
  featSection: { paddingHorizontal: Spacing.lg },
  featHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xs },
  featTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  insightExplain: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primary + '10',
    padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  insightExplainText: { color: Colors.textSecondary, fontSize: FontSize.xs, flex: 1, lineHeight: 18 },

  // Back button
  backToStockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primaryLight + '40',
  },
  backToStockText: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: '600' },

  // Disclaimer
  disclaimerBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border,
  },
  disclaimerText: { color: Colors.textMuted, fontSize: 10, flex: 1, lineHeight: 16 },
});
