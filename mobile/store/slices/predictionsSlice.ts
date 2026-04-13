import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Prediction {
  ticker: string;
  predicted_close: number;
  direction: number;
  confidence: number;
  model_used: string;
  insight: string;
  cached: boolean;
}

export interface Explanation {
  ticker: string;
  top_features: { feature: string; importance: number }[];
  insight: string;
}

interface PredictionsState {
  current: Prediction | null;
  explanation: Explanation | null;
  loading: boolean;
  error: string | null;
  metrics: Record<string, any> | null;
  metricsLoading: boolean;
}

const initialState: PredictionsState = {
  current: null,
  explanation: null,
  loading: false,
  error: null,
  metrics: null,
  metricsLoading: false,
};

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    setPredictionLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    setPrediction(state, action: PayloadAction<Prediction>) {
      state.current = action.payload;
      state.loading = false;
    },
    setExplanation(state, action: PayloadAction<Explanation>) {
      state.explanation = action.payload;
    },
    setPredictionError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    setMetricsLoading(state, action: PayloadAction<boolean>) {
      state.metricsLoading = action.payload;
    },
    setMetrics(state, action: PayloadAction<Record<string, any>>) {
      state.metrics = action.payload;
      state.metricsLoading = false;
    },
    clearPrediction(state) {
      state.current = null;
      state.explanation = null;
      state.error = null;
    },
  },
});

export const {
  setPredictionLoading, setPrediction, setExplanation,
  setPredictionError, setMetricsLoading, setMetrics, clearPrediction,
} = predictionsSlice.actions;
export default predictionsSlice.reducer;
