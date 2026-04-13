import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
  setPredictionLoading, setPrediction, setExplanation, setPredictionError, clearPrediction,
} from '../../store/slices/predictionsSlice';
import { getPrediction, getExplanation } from '../../api/predictions';
import PredictionCard from '../../components/PredictionCard';
import FeatureImportanceChart from '../../components/FeatureImportanceChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function PredictScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { current, explanation, loading, error } = useSelector((s: RootState) => s.predictions);
  const [ticker, setTicker] = useState('');

  const handlePredict = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>AI Stock Prediction</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter ticker (e.g. RELIANCE.NS)"
          placeholderTextColor={Colors.textMuted}
          value={ticker}
          onChangeText={setTicker}
          autoCapitalize="characters"
        />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handlePredict} disabled={loading}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
});
