import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  predictedClose: number;
  direction: number;
  confidence: number;
  modelUsed: string;
  insight: string;
  cached: boolean;
}

// ─── Confidence Gauge (SVG ring) ────────────────────────────────────────
function ConfidenceGauge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const size = 90;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - confidence);
  const color = pct >= 70 ? Colors.up : pct >= 50 ? Colors.warning : Colors.danger;

  return (
    <View style={gaugeStyles.wrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={Colors.surfaceLight} strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress */}
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Center text */}
        <SvgText
          x={size / 2} y={size / 2 - 4}
          fontSize={20} fontWeight="800"
          fill={color} textAnchor="middle"
        >
          {pct}
        </SvgText>
        <SvgText
          x={size / 2} y={size / 2 + 12}
          fontSize={9} fontWeight="600"
          fill={Colors.textMuted} textAnchor="middle"
        >
          % conf
        </SvgText>
      </Svg>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});

export default function PredictionCard({ predictedClose, direction, confidence, modelUsed, insight, cached }: Props) {
  const isUp = direction === 1;
  const dirColor = isUp ? Colors.up : Colors.down;
  const dirIcon = isUp ? 'trending-up' : 'trending-down';
  const dirLabel = isUp ? 'Bullish' : 'Bearish';

  return (
    <View style={styles.card}>
      {/* Top row: direction badge + cached tag */}
      <View style={styles.topRow}>
        <View style={[styles.dirBadge, { backgroundColor: dirColor + '15', borderColor: dirColor + '30' }]}>
          <Ionicons name={dirIcon} size={18} color={dirColor} />
          <Text style={[styles.dirText, { color: dirColor }]}>{dirLabel}</Text>
        </View>
        {cached && (
          <View style={styles.cachedBadge}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.cachedText}>Cached</Text>
          </View>
        )}
      </View>

      {/* Main body: price + gauge */}
      <View style={styles.bodyRow}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Predicted Close</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceValue}>{predictedClose.toFixed(2)}</Text>
          </View>
          <View style={styles.modelRow}>
            <Ionicons name="hardware-chip-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.modelText}>{modelUsed}</Text>
          </View>
        </View>
        <ConfidenceGauge confidence={confidence} />
      </View>

      {/* Confidence bar (linear) */}
      <View style={styles.confBarSection}>
        <View style={styles.confBarLabels}>
          <Text style={styles.confBarLabel}>Confidence</Text>
          <Text style={[styles.confBarPct, {
            color: confidence >= 0.7 ? Colors.up : confidence >= 0.5 ? Colors.warning : Colors.danger
          }]}>{Math.round(confidence * 100)}%</Text>
        </View>
        <View style={styles.confBarTrack}>
          <View style={[styles.confBarFill, {
            width: `${Math.round(confidence * 100)}%`,
            backgroundColor: confidence >= 0.7 ? Colors.up : confidence >= 0.5 ? Colors.warning : Colors.danger,
          }]} />
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insightBox}>
        <View style={styles.insightIconWrap}>
          <Ionicons name="bulb" size={14} color={Colors.warning} />
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>AI Insight</Text>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dirText: { fontSize: FontSize.sm, fontWeight: '800' },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  cachedText: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },

  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  priceSection: { flex: 1 },
  priceLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceCurrency: { color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: '600', marginRight: 2 },
  priceValue: { color: Colors.text, fontSize: 32, fontWeight: '800' },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  modelText: { color: Colors.textMuted, fontSize: 10 },

  confBarSection: { marginBottom: Spacing.lg },
  confBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  confBarLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  confBarPct: { fontSize: FontSize.xs, fontWeight: '700' },
  confBarTrack: { height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3 },
  confBarFill: { height: 6, borderRadius: 3 },

  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.warning + '08',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '15',
  },
  insightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: { flex: 1 },
  insightTitle: { color: Colors.warning, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  insightText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
});
