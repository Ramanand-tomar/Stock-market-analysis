import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Animated, Dimensions, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
  setPredictionLoading, setPrediction, setExplanation, setPredictionError, clearPrediction,
} from '../../store/slices/predictionsSlice';
import { getPrediction, getExplanation } from '../../api/predictions';
import PredictionCard from '../../components/PredictionCard';
import FeatureImportanceChart from '../../components/FeatureImportanceChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Categorised quick-pick stocks ──────────────────────────────────────
const CATEGORIES: { label: string; icon: string; tickers: string[] }[] = [
  { label: 'Banking', icon: 'business', tickers: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'] },
  { label: 'IT', icon: 'laptop', tickers: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'] },
  { label: 'Energy', icon: 'flash', tickers: ['RELIANCE.NS', 'NTPC.NS', 'ADANIPORTS.NS', 'ONGC.NS', 'POWERGRID.NS'] },
  { label: 'Consumer', icon: 'cart', tickers: ['HINDUNILVR.NS', 'ITC.NS', 'ASIANPAINT.NS', 'TITAN.NS', 'NESTLEIND.NS'] },
  { label: 'Auto', icon: 'car', tickers: ['MARUTI.NS', 'TATAMOTORS.NS', 'BAJAJ-AUTO.NS', 'M&M.NS', 'HEROMOTOCO.NS'] },
  { label: 'Pharma', icon: 'medkit', tickers: ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS'] },
];

export default function PredictScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, explanation, loading, error } = useSelector((s: RootState) => s.predictions);
  const [ticker, setTicker] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [recentPredictions, setRecentPredictions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(20)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(heroTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animate results in when prediction arrives
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
    const t = ticker.trim().toUpperCase();
    if (!t || !current) return;
    setRefreshing(true);
    try {
      const [predRes, explainRes] = await Promise.all([getPrediction(t), getExplanation(t)]);
      dispatch(setPrediction(predRes.data));
      dispatch(setExplanation(explainRes.data));
    } catch {}
    setRefreshing(false);
  };

  const handlePredict = async (quickTicker?: string) => {
    const tickerValue = typeof quickTicker === 'string' ? quickTicker : ticker;
    const t = (tickerValue || '').trim().toUpperCase();
    if (!t) return;
    Keyboard.dismiss();

    if (quickTicker) setTicker(t);

    // Track recent predictions
    setRecentPredictions((prev) => {
      const filtered = prev.filter((p) => p !== t);
      return [t, ...filtered].slice(0, 5);
    });

    dispatch(clearPrediction());
    dispatch(setPredictionLoading(true));
    try {
      const [predRes, explainRes] = await Promise.all([getPrediction(t), getExplanation(t)]);
      dispatch(setPrediction(predRes.data));
      dispatch(setExplanation(explainRes.data));
    } catch (err: any) {
      dispatch(setPredictionError(err.response?.data?.detail || 'Prediction failed'));
    }
  };

  const displayTicker = ticker.replace('.NS', '') || '---';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <Animated.View style={[styles.heroSection, { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }]}>
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="analytics" size={28} color={Colors.white} />
            </View>
            <View style={styles.heroPulse} />
          </View>
          <Text style={styles.heroTitle}>AI Stock Prediction</Text>
          <Text style={styles.heroSubtitle}>
            Powered by ensemble ML models — get real-time price predictions with confidence scores
          </Text>
        </Animated.View>

        {/* ── Search Card ───────────────────────────────────────────── */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Enter Stock Ticker</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="e.g. RELIANCE.NS"
                placeholderTextColor={Colors.textMuted}
                value={ticker}
                onChangeText={setTicker}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={() => handlePredict()}
                editable={!loading}
              />
              {ticker.length > 0 && (
                <Pressable onPress={() => setTicker('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.predictBtn,
                loading && styles.predictBtnDisabled,
                pressed && !loading && styles.predictBtnPressed,
              ]}
              onPress={() => handlePredict()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={Colors.white} />
                  <Text style={styles.predictBtnText}>Predict</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Recent predictions */}
          {recentPredictions.length > 0 && !current && (
            <View style={styles.recentWrap}>
              <Text style={styles.recentLabel}>Recent</Text>
              <View style={styles.recentRow}>
                {recentPredictions.map((t) => (
                  <Pressable key={t} style={styles.recentChip} onPress={() => handlePredict(t)}>
                    <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.recentText}>{t.replace('.NS', '')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Quick Picks by Category ───────────────────────────────── */}
        {!current && !loading && (
          <View style={styles.quickPickSection}>
            <Text style={styles.sectionTitle}>Quick Pick Stocks</Text>

            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat, i) => (
                <Pressable
                  key={cat.label}
                  style={[styles.categoryTab, selectedCategory === i && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(i)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={selectedCategory === i ? Colors.white : Colors.textMuted}
                  />
                  <Text style={[styles.categoryText, selectedCategory === i && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Stock chips for selected category */}
            <View style={styles.stockChipsGrid}>
              {CATEGORIES[selectedCategory].tickers.map((t) => (
                <Pressable
                  key={t}
                  style={({ pressed }) => [styles.stockChip, pressed && styles.stockChipPressed]}
                  onPress={() => handlePredict(t)}
                >
                  <View style={styles.stockChipIcon}>
                    <Ionicons name="trending-up" size={14} color={Colors.primaryLight} />
                  </View>
                  <Text style={styles.stockChipText}>{t.replace('.NS', '')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Loading State ─────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
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
            <Pressable style={styles.retryBtn} onPress={() => handlePredict()}>
              <Ionicons name="refresh" size={16} color={Colors.white} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        {current && (
          <Animated.View style={{ opacity: resultOpacity, transform: [{ translateY: resultTranslateY }] }}>
            {/* Result header */}
            <View style={styles.resultHeader}>
              <View style={styles.resultTickerBadge}>
                <Ionicons name="pulse" size={16} color={Colors.primaryLight} />
                <Text style={styles.resultTickerText}>{current.ticker?.replace('.NS', '') || displayTicker}</Text>
              </View>
              <Pressable style={styles.newPredictBtn} onPress={() => { dispatch(clearPrediction()); setTicker(''); }}>
                <Ionicons name="add-circle-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.newPredictText}>New</Text>
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
                  <Text style={styles.featTitle}>What Drove This Prediction?</Text>
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

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="shield-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>
                Predictions are generated by ML models and should not be used as financial advice. Always do your own research.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── How It Works (shown when idle) ────────────────────────── */}
        {!current && !loading && !error && (
          <View style={styles.howSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howSteps}>
              {[
                { icon: 'search', title: 'Select Stock', desc: 'Choose from quick picks or enter any NSE ticker' },
                { icon: 'server', title: 'ML Analysis', desc: 'Ensemble of 6+ models analyze 20+ technical features' },
                { icon: 'analytics', title: 'Get Prediction', desc: 'Price direction, confidence score, and key drivers' },
              ].map((s, i) => (
                <View key={i} style={styles.howStep}>
                  <View style={styles.howStepNum}>
                    <Text style={styles.howStepNumText}>{i + 1}</Text>
                  </View>
                  <View style={styles.howIconCircle}>
                    <Ionicons name={s.icon as any} size={20} color={Colors.primaryLight} />
                  </View>
                  <Text style={styles.howStepTitle}>{s.title}</Text>
                  <Text style={styles.howStepDesc}>{s.desc}</Text>
                  {i < 2 && <View style={styles.howConnector} />}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  heroIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  heroPulse: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: Colors.primary + '30',
  },
  heroTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.xs },
  heroSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, maxWidth: 300 },

  // Search card
  searchCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, marginHorizontal: Spacing.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  searchLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 48,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md, height: '100%', paddingVertical: 0 },
  predictBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  predictBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  predictBtnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  predictBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },

  // Recent
  recentWrap: { marginTop: Spacing.md },
  recentLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.xs },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  recentText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },

  // Quick picks
  quickPickSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  categoryScroll: { marginBottom: Spacing.md },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  categoryTextActive: { color: Colors.white },
  stockChipsGrid: { gap: Spacing.sm },
  stockChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  stockChipPressed: { backgroundColor: Colors.surfaceLight },
  stockChipIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  stockChipText: { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },

  // Loading
  loadingCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, margin: Spacing.lg,
    padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  loadingTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginTop: Spacing.lg },
  loadingSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs, marginBottom: Spacing.xl },
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

  // Result header
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  resultTickerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  resultTickerText: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: '800' },
  newPredictBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primaryLight + '40',
  },
  newPredictText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },

  // Feature section (wrapping existing FeatureImportanceChart)
  featSection: { paddingHorizontal: Spacing.lg },
  featHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xs },
  featTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  insightExplain: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primary + '10',
    padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  insightExplainText: { color: Colors.textSecondary, fontSize: FontSize.xs, flex: 1, lineHeight: 18 },

  // Disclaimer
  disclaimerBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border,
  },
  disclaimerText: { color: Colors.textMuted, fontSize: 10, flex: 1, lineHeight: 16 },

  // How it works
  howSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  howSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  howStep: { flex: 1, alignItems: 'center', position: 'relative' },
  howStepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  howStepNumText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  howIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  howStepTitle: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  howStepDesc: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', lineHeight: 14, paddingHorizontal: 4 },
  howConnector: {
    position: 'absolute', top: 42, right: -20, width: 40, height: 2,
    backgroundColor: Colors.border,
  },
});
