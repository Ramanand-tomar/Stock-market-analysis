import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    dispatch(setStocksLoading(true));
    try {
      const { data } = await getStocks(1, 100);
      dispatch(setStocks({ items: data.items, total: data.total }));
    } catch (err: any) {
      dispatch(setStocksError(err.message));
    }
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
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by ticker or company..."
        placeholderTextColor={Colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {/* Sector chips */}
      <FlatList
        horizontal
        data={[null, ...sectors]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, selectedSector === item && styles.chipActive]}
            onPress={() => setSelectedSector(item)}
          >
            <Text style={[styles.chipText, selectedSector === item && styles.chipTextActive]}>
              {item || 'All'}
            </Text>
          </Pressable>
        )}
      />

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
          ListEmptyComponent={<Text style={styles.emptyText}>No stocks found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  chipRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  chipTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.lg },
  loader: { marginTop: Spacing.xxxl },
  error: { color: Colors.danger, textAlign: 'center', marginTop: Spacing.xl },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxxl },
});
