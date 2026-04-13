import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
  Alert, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchWatchlist = useCallback(async () => {
    dispatch(setWatchlistLoading(true));
    try {
      const { data } = await getWatchlist();
      dispatch(setWatchlist(data.tickers));
    } catch (err: any) {
      dispatch(setWatchlistError(err.message));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWatchlist();
    setRefreshing(false);
  };

  const handleRemove = (ticker: string) => {
    const display = ticker.replace('.NS', '');
    Alert.alert(
      'Remove Stock',
      `Are you sure you want to remove ${display} from your watchlist?`,
      [
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
      ],
    );
  };

  const ListHeader = (
    <View style={styles.headerSection}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.heading}>Watchlist</Text>
          <Text style={styles.subtitle}>Your tracked stocks</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countNum}>{tickers.length}</Text>
          <Text style={styles.countLabel}>stocks</Text>
        </View>
      </View>

      {/* Loading */}
      {loading && !refreshing && (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchWatchlist}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={loading ? [] : tickers}
        keyExtractor={(item) => item}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        renderItem={({ item, index }) => (
          <WatchlistItem
            ticker={item}
            index={index}
            onPress={() => router.push(`/stock/${item}`)}
            onPredict={() => router.push(`/stock/${item}/predict`)}
            onRemove={() => handleRemove(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="star-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Stocks Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start building your watchlist by adding stocks from the Explore tab
              </Text>
              <Pressable
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/')}
              >
                <Ionicons name="search" size={16} color={Colors.white} />
                <Text style={styles.exploreBtnText}>Explore Stocks</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Watchlist Item Component ───────────────────────────────────────────
function WatchlistItem({ ticker, index, onPress, onPredict, onRemove }: {
  ticker: string; index: number; onPress: () => void; onPredict: () => void; onRemove: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const display = ticker.replace('.NS', '');
  // Generate a consistent color for each stock
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6'];
  const accent = colors[index % colors.length];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        style={({ pressed }) => [styles.stockCard, pressed && styles.stockCardPressed]}
        onPress={onPress}
      >
        {/* Left: avatar + info */}
        <View style={[styles.stockAvatar, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.stockAvatarText, { color: accent }]}>
            {display.slice(0, 2)}
          </Text>
        </View>

        <View style={styles.stockInfo}>
          <Text style={styles.stockTicker}>{display}</Text>
          <Text style={styles.stockExchange}>NSE</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={onPredict} hitSlop={6}>
            <Ionicons name="analytics" size={18} color={Colors.primaryLight} />
          </Pressable>
          <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={6}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },

  // Header
  headerSection: { marginBottom: Spacing.md },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heading: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  countBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  countNum: { color: Colors.primaryLight, fontSize: FontSize.xl, fontWeight: '800' },
  countLabel: { color: Colors.textMuted, fontSize: 9 },

  loader: { marginTop: Spacing.xxxl },

  // Error
  errorCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.danger + '30',
  },
  errorText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },

  // Stock card
  stockCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stockCardPressed: {
    backgroundColor: Colors.surfaceLight,
  },
  stockAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockAvatarText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  stockInfo: {
    flex: 1,
  },
  stockTicker: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  stockExchange: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.danger + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exploreBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
