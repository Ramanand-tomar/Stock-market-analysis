import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
  setPredictionLoading, setPrediction, setExplanation, setPredictionError, clearPrediction,
} from '../../store/slices/predictionsSlice';
import { getPrediction, getExplanation } from '../../api/predictions';
import PredictionCard from '../../components/PredictionCard';
import FeatureImportanceChart from '../../components/FeatureImportanceChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const EXAMPLES = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS',
  'HINDUNILVR.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'TITAN.NS',
  'BAJFINANCE.NS', 'SUNPHARMA.NS', 'ADANIPORTS.NS', 'ULTRACEMCO.NS', 'NTPC.NS'
];

export default function PredictScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, explanation, loading, error } = useSelector((s: RootState) => s.predictions);
  const [ticker, setTicker] = useState('');

  const handlePredict = async (quickTicker?: string) => {
    // Ensure we only use string values (ignore event objects from Pressable)
    const tickerValue = typeof quickTicker === 'string' ? quickTicker : ticker;
    const t = (tickerValue || '').trim().toUpperCase();
    if (!t) return;

    if (quickTicker) setTicker(t);

    dispatch(clearPrediction());
    dispatch(setPredictionLoading(true));
    try {
      const [predRes, explainRes] = await Promise.all([
        getPrediction(t),
        getExplanation(t),
      ]);
      dispatch(setPrediction(predRes.data));
      dispatch(setExplanation(explainRes.data));
    } catch (err: any) {
      dispatch(setPredictionError(err.response?.data?.detail || 'Prediction failed'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>AI Stock Prediction</Text>

        <Text style={styles.subheading}>Try these examples:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesScroll}>
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex}
              style={styles.chip}
              onPress={() => handlePredict(ex)}
            >
              <Text style={styles.chipText}>{ex}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter ticker (e.g. RELIANCE.NS)"
            placeholderTextColor={Colors.textMuted}
            value={ticker}
            onChangeText={setTicker}
            autoCapitalize="characters"
          />
          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={() => handlePredict()} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.buttonText}>Predict</Text>}
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {current && (
          <PredictionCard
            predictedClose={current.predicted_close}
            direction={current.direction}
            confidence={current.confidence}
            modelUsed={current.model_used}
            insight={current.insight}
            cached={current.cached}
          />
        )}

        {explanation && <FeatureImportanceChart features={explanation.top_features} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Spacing.sm },
  content: { padding: Spacing.lg },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.lg },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  error: { color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md },
  subheading: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  examplesScroll: { marginBottom: Spacing.lg },
  chip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '600' },
});
