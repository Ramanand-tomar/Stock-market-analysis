import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { setStocksLoading, setStocks, setStocksError, Stock } from '../../store/slices/stocksSlice';
import { getStocks } from '../../api/stocks';
import StockCard from '../../components/StockCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function ExploreScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { list, loading, error } = useSelector((s: RootState) => s.stocks);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    dispatch(setStocksLoading(true));
    try {
      const { data } = await getStocks(1, 100);
      dispatch(setStocks({ items: data.items, total: data.total }));
    } catch (err: any) {
      dispatch(setStocksError(err.response?.data?.detail || err.message));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStocks();
    setRefreshing(false);
  };

  const sectors = useMemo(() => {
    const s = new Set(list.map((stock) => stock.sector));
    return Array.from(s).sort();
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.company_name.toLowerCase().includes(q)
      );
    }
    if (selectedSector) {
      result = result.filter((s) => s.sector === selectedSector);
    }
    return result;
  }, [list, search, selectedSector]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TextInput
        style={styles.search}
        placeholder="Search by ticker or company..."
        placeholderTextColor={Colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      
      {/* Sector chips */}
      <View style={styles.chipRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {[null, ...sectors].map((item) => (
            <Pressable
              key={item || 'all'}
              style={[styles.chip, selectedSector === item && styles.chipActive]}
              onPress={() => setSelectedSector(item)}
            >
              <Text style={[styles.chipText, selectedSector === item && styles.chipTextActive]}>
                {item || 'All'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.ticker}
          renderItem={({ item }) => (
            <StockCard
              ticker={item.ticker}
              companyName={item.company_name}
              sector={item.sector}
              onPress={() => router.push(`/stock/${item.ticker}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stocks found</Text>
              <Pressable style={styles.retryBtn} onPress={fetchStocks}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Spacing.sm },
  search: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    margin: Spacing.lg,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipRowContainer: { marginBottom: Spacing.md },
  chipRow: { paddingHorizontal: Spacing.lg },
  chip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight },
  chipText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.lg },
  loader: { marginTop: Spacing.xxxl },
  error: { color: Colors.danger, textAlign: 'center', marginTop: Spacing.xl },
  emptyContainer: { alignItems: 'center', marginTop: Spacing.xxxl },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md },
  retryBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  retryText: { color: Colors.primaryLight, fontWeight: '600' },
});
