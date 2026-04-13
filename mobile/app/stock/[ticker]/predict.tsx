import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import {
  setPredictionLoading, setPrediction, setExplanation, setPredictionError, clearPrediction,
} from '../../../store/slices/predictionsSlice';
import { getPrediction, getExplanation } from '../../../api/predictions';
import PredictionCard from '../../../components/PredictionCard';
import FeatureImportanceChart from '../../../components/FeatureImportanceChart';
import { Colors, Spacing, FontSize } from '../../../constants/theme';

export default function StockPredictScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { current, explanation, loading, error } = useSelector((s: RootState) => s.predictions);

  useEffect(() => {
    if (!ticker) return;
    dispatch(clearPrediction());
    dispatch(setPredictionLoading(true));

    Promise.all([
      getPrediction(ticker),
      getExplanation(ticker),
    ]).then(([predRes, explRes]) => {
      dispatch(setPrediction(predRes.data));
      dispatch(setExplanation(explRes.data));
    }).catch((err) => {
      dispatch(setPredictionError(err.response?.data?.detail || 'Prediction failed'));
    });
  }, [ticker]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: `${ticker?.replace('.NS', '')} Prediction`,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  loader: { marginTop: Spacing.xxxl },
  error: { color: Colors.danger, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xl },
});
