import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Stock {
  ticker: string;
  company_name: string;
  sector: string;
}

export interface StockPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

interface StocksState {
  list: Stock[];
  total: number;
  loading: boolean;
  error: string | null;
  history: Record<string, StockPrice[]>;
  historyLoading: boolean;
}

const initialState: StocksState = {
  list: [],
  total: 0,
  loading: false,
  error: null,
  history: {},
  historyLoading: false,
};

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    setStocksLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setStocks(state, action: PayloadAction<{ items: Stock[]; total: number }>) {
      state.list = action.payload.items;
      state.total = action.payload.total;
      state.loading = false;
      state.error = null;
    },
    setStocksError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    setHistoryLoading(state, action: PayloadAction<boolean>) {
      state.historyLoading = action.payload;
    },
    setHistory(state, action: PayloadAction<{ ticker: string; data: StockPrice[] }>) {
      state.history[action.payload.ticker] = action.payload.data;
      state.historyLoading = false;
    },
  },
});

export const { setStocksLoading, setStocks, setStocksError, setHistoryLoading, setHistory } = stocksSlice.actions;
export default stocksSlice.reducer;
