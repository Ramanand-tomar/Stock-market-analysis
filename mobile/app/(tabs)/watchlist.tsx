import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store/store';
import { setWatchlistLoading, setWatchlist, setWatchlistError } from '../../store/slices/watchlistSlice';
import { getWatchlist, removeFromWatchlist } from '../../api/user';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function WatchlistScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { tickers, loading, error } = useSelector((s: RootState) => s.watchlist);

  const fetch = useCallback(async () => {
    dispatch(setWatchlistLoading(true));
    try {
      const { data } = await getWatchlist();
      dispatch(setWatchlist(data.tickers));
    } catch (err: any) {
      dispatch(setWatchlistError(err.message));
    }
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleRemove = (ticker: string) => {
    Alert.alert('Remove', `Remove ${ticker} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await removeFromWatchlist(ticker);
            dispatch(setWatchlist(data.tickers));
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Watchlist</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={tickers}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/stock/${item}`)}>
              <Ionicons name="star" size={20} color={Colors.warning} />
              <Text style={styles.ticker}>{item.replace('.NS', '')}</Text>
              <Pressable onPress={() => handleRemove(item)} hitSlop={10}>
                <Ionicons name="close-circle" size={22} color={Colors.danger} />
              </Pressable>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No stocks in your watchlist. Add some from the Explore tab!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.lg },
  list: { gap: Spacing.sm },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ticker: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  loader: { marginTop: Spacing.xxxl },
  error: { color: Colors.danger, textAlign: 'center', marginTop: Spacing.xl },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
