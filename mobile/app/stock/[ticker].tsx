import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setWatchlist } from '../../store/slices/watchlistSlice';
import { useStockHistory } from '../../hooks/useStockHistory';
import { getStock, getStockIndicators } from '../../api/stocks';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../../api/user';
import PriceChart from '../../components/PriceChart';
import VolumeChart from '../../components/VolumeChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

type TimeRange = '1M' | '3M' | '1Y';

function getStartDate(range: TimeRange): string {
  const d = new Date();
  if (range === '1M') d.setMonth(d.getMonth() - 1);
  else if (range === '3M') d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

export default function StockDetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const watchlistTickers = useSelector((s: RootState) => s.watchlist.tickers);

  const [range, setRange] = useState<TimeRange>('3M');
  const [stock, setStock] = useState<any>(null);
  const [indicators, setIndicators] = useState<any>(null);
  const [stockLoading, setStockLoading] = useState(true);

  const start = getStartDate(range);
  const { history, loading: histLoading } = useStockHistory(ticker!, start);
  const isWatched = watchlistTickers.includes(ticker!);

  useEffect(() => {
    if (!ticker) return;
    setStockLoading(true);
    Promise.all([
      getStock(ticker),
      getStockIndicators(ticker, start),
    ]).then(([stockRes, indRes]) => {
      setStock(stockRes.data);
      setIndicators(indRes.data?.[0] || null);
    }).catch(() => {})
      .finally(() => setStockLoading(false));
  }, [ticker]);

  const toggleWatchlist = async () => {
    try {
      if (isWatched) {
        await removeFromWatchlist(ticker!);
      } else {
        await addToWatchlist(ticker!);
      }
      const { data } = await getWatchlist();
      dispatch(setWatchlist(data.tickers));
    } catch {}
  };

  if (stockLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          title: ticker?.replace('.NS', '') || '',
          headerRight: () => (
            <Pressable onPress={toggleWatchlist} style={{ marginRight: 8 }}>
              <Ionicons
                name={isWatched ? 'star' : 'star-outline'}
                size={24}
                color={isWatched ? Colors.warning : Colors.textMuted}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {stock && (
          <View style={styles.header}>
            <Text style={styles.companyName}>{stock.company_name}</Text>
            <Text style={styles.sector}>{stock.sector}</Text>
          </View>
        )}

        {/* Time range tabs */}
        <View style={styles.rangeRow}>
          {(['1M', '3M', '1Y'] as TimeRange[]).map((r) => (
            <Pressable
              key={r}
              style={[styles.rangeTab, range === r && styles.rangeTabActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        {histLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            <PriceChart data={history} title={`${ticker?.replace('.NS', '')} Close Price`} />
            <VolumeChart data={history} />
          </>
        )}

        {/* Stats grid */}
        {indicators && (
          <View style={styles.statsGrid}>
            <StatItem label="PE Ratio" value={indicators.pe_ratio?.toFixed(2)} />
            <StatItem label="Beta" value={indicators.beta?.toFixed(3)} />
            <StatItem label="RSI (14)" value={indicators.rsi_14?.toFixed(2)} />
            <StatItem label="MACD" value={indicators.macd?.toFixed(4)} />
            <StatItem label="MA 50" value={indicators.ma_50?.toFixed(2)} />
            <StatItem label="MA 200" value={indicators.ma_200?.toFixed(2)} />
          </View>
        )}

        <Pressable
          style={styles.predictBtn}
          onPress={() => router.push(`/stock/${ticker}/predict`)}
        >
          <Ionicons name="analytics" size={20} color={Colors.white} />
          <Text style={styles.predictBtnText}>Get AI Prediction</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function StatItem({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { marginBottom: Spacing.lg },
  companyName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  sector: { color: Colors.textSecondary, fontSize: FontSize.sm },
  rangeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  rangeTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  rangeTabActive: { backgroundColor: Colors.primary },
  rangeText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  rangeTextActive: { color: Colors.white },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  statItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '48%',
  },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  statValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginTop: 2 },
  predictBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  predictBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
