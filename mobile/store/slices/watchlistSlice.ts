import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WatchlistState {
  tickers: string[];
  loading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  tickers: [],
  loading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlistLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setWatchlist(state, action: PayloadAction<string[]>) {
      state.tickers = action.payload;
      state.loading = false;
      state.error = null;
    },
    setWatchlistError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setWatchlistLoading, setWatchlist, setWatchlistError } = watchlistSlice.actions;
export default watchlistSlice.reducer;
