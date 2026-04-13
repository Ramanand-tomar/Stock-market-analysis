import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, {
  Circle, Defs, LinearGradient, Stop, Path, G, Line,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, FontSize } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

// ─── Animated SVG Logo ──────────────────────────────────────────────────
function IntellyLogo() {
  const size = 120;
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3B82F6" />
          <Stop offset="1" stopColor="#1E40AF" />
        </LinearGradient>
        <LinearGradient id="chartGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#10B981" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#10B981" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Outer circle */}
      <Circle cx={center} cy={center} r={56} fill="url(#logoGrad)" />

      {/* Inner ring */}
      <Circle cx={center} cy={center} r={48} fill="none" stroke="#FFFFFF15" strokeWidth={1} />

      {/* Chart line (upward trend) */}
      <Path
        d="M30 78 L42 65 L52 70 L62 52 L72 58 L82 38 L90 42"
        stroke="#10B981"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Chart area fill */}
      <Path
        d="M30 78 L42 65 L52 70 L62 52 L72 58 L82 38 L90 42 L90 82 L30 82 Z"
        fill="url(#chartGrad)"
      />

      {/* Grid lines */}
      {[48, 58, 68, 78].map((y) => (
        <Line key={y} x1={28} y1={y} x2={92} y2={y} stroke="#FFFFFF10" strokeWidth={0.5} />
      ))}

      {/* Candlesticks */}
      <G>
        <Line x1={38} y1={60} x2={38} y2={75} stroke="#EF4444" strokeWidth={2} strokeLinecap="round" />
        <Line x1={50} y1={55} x2={50} y2={68} stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
        <Line x1={74} y1={45} x2={74} y2={60} stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
      </G>

      {/* AI dot pulse (top right) */}
      <Circle cx={82} cy={32} r={6} fill="#F59E0B" opacity={0.9} />
      <Circle cx={82} cy={32} r={10} fill="none" stroke="#F59E0B" strokeWidth={1} opacity={0.4} />
      <SvgText x={82} y={35} fontSize={7} fill="#FFF" fontWeight="800" textAnchor="middle">AI</SvgText>
    </Svg>
  );
}

export default function SplashScreenView({ onFinish }: Props) {
  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_W)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Logo springs in
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Phase 2: Title slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleTranslateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      ]).start();
    }, 300);

    // Phase 3: Subtitle & tagline
    setTimeout(() => {
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 800);

    // Phase 4: Shimmer across the logo
    setTimeout(() => {
      Animated.timing(shimmerTranslate, { toValue: SCREEN_W, duration: 800, useNativeDriver: true }).start();
    }, 900);

    // Phase 5: Footer
    setTimeout(() => {
      Animated.timing(footerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 1000);

    // Phase 6: Fade out & finish
    setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onFinish();
      });
    }, 2400);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Background glow */}
      <View style={styles.glowCircle} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <IntellyLogo />
        {/* Shimmer overlay */}
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
        <Text style={styles.title}>Intelly</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View style={{ opacity: subtitleOpacity }}>
        <Text style={styles.subtitle}>Stock Analyser</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <View style={styles.taglineBadge}>
          <View style={styles.taglineDot} />
          <Text style={styles.taglineText}>AI-Powered Analysis</Text>
        </View>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View style={[styles.featureRow, { opacity: taglineOpacity }]}>
        {['ML Models', 'Real-time Data', 'Smart Insights'].map((feat, i) => (
          <View key={i} style={styles.featurePill}>
            <Text style={styles.featurePillText}>{feat}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerDev}>Developed by</Text>
        <Text style={styles.footerName}>Ramanand Tomar</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.06,
    top: SCREEN_H * 0.25,
  },
  logoWrap: {
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 60,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 80,
    backgroundColor: '#FFFFFF15',
    transform: [{ skewX: '-20deg' }],
  },
  title: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taglineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  taglineText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  featurePill: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  featurePillText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerDev: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  footerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  footerVersion: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.6,
  },
});
