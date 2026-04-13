import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Email validation ───────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { login, loading, error } = useAuth();
  const toast = useToast();

  const passwordRef = useRef<TextInput>(null);

  // Animated values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Show toast on auth error from Redux
  useEffect(() => {
    if (error) {
      toast.error(error, 'Login Failed');
    }
  }, [error]);

  // ── Field-level validation ────────────────────────────────────────────
  const emailError = emailTouched && email.length > 0 && !isValidEmail(email)
    ? 'Enter a valid email address' : '';
  const passwordError = passwordTouched && password.length > 0 && password.length < 6
    ? 'Password must be at least 6 characters' : '';

  const canSubmit = isValidEmail(email) && password.length >= 6 && !loading;

  // ── Submit ────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    // Mark all touched for validation display
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!email.trim()) {
      toast.warning('Please enter your email address');
      return;
    }
    if (!isValidEmail(email.trim())) {
      toast.warning('Please enter a valid email address');
      return;
    }
    if (!password) {
      toast.warning('Please enter your password');
      return;
    }
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    try {
      await login(email.trim(), password);
      toast.success('Welcome back!', 'Login Successful');
    } catch (err: any) {
      // Error is handled by useAuth → Redux error → useEffect above
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo & branding ───────────────────────────────────────── */}
          <Animated.View style={[styles.brandSection, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoCircle}>
              <Ionicons name="analytics" size={36} color={Colors.white} />
            </View>
            <Text style={styles.appName}>Intelly</Text>
            <Text style={styles.tagline}>AI-Powered Stock Market Analysis</Text>
          </Animated.View>

          {/* ── Form card ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[
                styles.inputWrap,
                emailError ? styles.inputWrapError : (emailTouched && isValidEmail(email) ? styles.inputWrapValid : null),
              ]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailError ? Colors.danger : (emailTouched && isValidEmail(email) ? Colors.secondary : Colors.textMuted)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (!emailTouched) setEmailTouched(true); }}
                  onBlur={() => setEmailTouched(true)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!loading}
                />
                {emailTouched && isValidEmail(email) && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
                )}
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[
                styles.inputWrap,
                passwordError ? styles.inputWrapError : null,
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordError ? Colors.danger : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (!passwordTouched) setPasswordTouched(true); }}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            {/* Login button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Colors.white} size="small" />
                  <Text style={styles.buttonText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <Link href="/(auth)/register" asChild>
              <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}>
                <Text style={styles.secondaryBtnText}>Create New Account</Text>
              </Pressable>
            </Link>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>Intelly Stock Analyser v1.0{'\n'}Developed by Ramanand Tomar</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },

  // Form card
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  formTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.xxl,
  },

  // Fields
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputWrapError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + '08',
  },
  inputWrapValid: {
    borderColor: Colors.secondary + '60',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    height: '100%',
    paddingVertical: 0,
  },
  fieldError: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  // Button
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Secondary button
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primaryLight + '40',
    borderRadius: BorderRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnPressed: {
    backgroundColor: Colors.primaryLight + '10',
  },
  secondaryBtnText: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // Footer
  footer: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
    opacity: 0.6,
  },
});
