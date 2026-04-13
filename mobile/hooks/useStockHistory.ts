import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setHistory, setHistoryLoading } from '../store/slices/stocksSlice';
import { getStockHistory } from '../api/stocks';

export function useStockHistory(ticker: string, start?: string, end?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const history = useSelector((s: RootState) => s.stocks.history[ticker] || []);
  const loading = useSelector((s: RootState) => s.stocks.historyLoading);

  const fetch = useCallback(async () => {
    dispatch(setHistoryLoading(true));
    try {
      const { data } = await getStockHistory(ticker, start, end);
      dispatch(setHistory({ ticker, data }));
    } catch {
      dispatch(setHistoryLoading(false));
    }
  }, [ticker, start, end, dispatch]);

  useEffect(() => {
    if (ticker) fetch();
  }, [fetch]);

  return { history, loading, refetch: fetch };
}
