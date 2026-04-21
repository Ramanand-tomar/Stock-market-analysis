import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Animated, Text, StyleSheet, View, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;       // ms, default 3000
  title?: string;
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

// ─── Theme per type ─────────────────────────────────────────────────────
const TYPE_THEME: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#05291A', border: '#10B98150', icon: 'checkmark-circle', iconColor: '#10B981' },
  error:   { bg: '#2A0F0F', border: '#EF444450', icon: 'close-circle',    iconColor: '#EF4444' },
  warning: { bg: '#2A1F0A', border: '#F59E0B50', icon: 'warning',         iconColor: '#F59E0B' },
  info:    { bg: '#0A1A2A', border: '#3B82F650', icon: 'information-circle', iconColor: '#3B82F6' },
};

// ─── Context ────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [toast, setToast] = useState<ToastConfig & { type: ToastType } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<(ToastConfig & { type: ToastType })[]>([]);
  const isShowingRef = useRef(false);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      isShowingRef.current = false;
      setToast(null);
      // Show next queued toast
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        showInternal(next);
      }
    });
  }, []);

  const showInternal = useCallback((config: ToastConfig & { type: ToastType }) => {
    isShowingRef.current = true;
    setToast(config);
    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(dismiss, config.duration || 3000);
  }, [dismiss]);

  const MAX_QUEUE = 5;
  const show = useCallback((config: ToastConfig) => {
    const full = { ...config, type: config.type || 'info' as ToastType };
    if (isShowingRef.current) {
      // Cap the queue so a flood of toasts (e.g. retry burst) doesn't grow
      // memory unbounded. Drop oldest queued items beyond the limit.
      if (queueRef.current.length >= MAX_QUEUE) {
        queueRef.current.shift();
      }
      queueRef.current.push(full);
    } else {
      showInternal(full);
    }
  }, [showInternal]);

  // Cleanup pending timer and queue when the provider unmounts
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      queueRef.current = [];
    };
  }, []);

  const success = useCallback((message: string, title?: string) => show({ message, title, type: 'success' }), [show]);
  const error   = useCallback((message: string, title?: string) => show({ message, title, type: 'error', duration: 4000 }), [show]);
  const warning = useCallback((message: string, title?: string) => show({ message, title, type: 'warning' }), [show]);
  const info    = useCallback((message: string, title?: string) => show({ message, title, type: 'info' }), [show]);

  const theme = toast ? TYPE_THEME[toast.type] : TYPE_THEME.info;

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: insets.top + 8,
              transform: [{ translateY }],
              opacity,
              backgroundColor: theme.bg,
              borderColor: theme.border,
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable style={styles.toastInner} onPress={dismiss}>
            <View style={[styles.iconCircle, { backgroundColor: theme.iconColor + '20' }]}>
              <Ionicons name={theme.icon as any} size={20} color={theme.iconColor} />
            </View>
            <View style={styles.textWrap}>
              {toast.title && <Text style={styles.toastTitle}>{toast.title}</Text>}
              <Text style={styles.toastMessage} numberOfLines={3}>{toast.message}</Text>
            </View>
            <Ionicons name="close" size={16} color={Colors.textMuted} style={styles.closeIcon} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  toastTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  closeIcon: {
    padding: 4,
  },
});
