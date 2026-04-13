import React, { useState, useRef, useEffect, useMemo } from 'react';
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

// ─── Validators ─────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

interface PasswordStrength {
  score: number;    // 0-4
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
}

function getPasswordStrength(pw: string): PasswordStrength {
  const checks = [
    { label: 'At least 6 characters', passed: pw.length >= 6 },
    { label: 'Contains uppercase', passed: /[A-Z]/.test(pw) },
    { label: 'Contains lowercase', passed: /[a-z]/.test(pw) },
    { label: 'Contains number', passed: /[0-9]/.test(pw) },
    { label: 'Contains special char', passed: /[^a-zA-Z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.passed).length;

  if (score <= 1) return { score, label: 'Very Weak', color: Colors.danger, checks };
  if (score === 2) return { score, label: 'Weak', color: '#F97316', checks };
  if (score === 3) return { score, label: 'Fair', color: Colors.warning, checks };
  if (score === 4) return { score, label: 'Good', color: '#84CC16', checks };
  return { score, label: 'Strong', color: Colors.secondary, checks };
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Touched tracking
  const [emailTouched, setEmailTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const { register, loading, error } = useAuth();
  const toast = useToast();

  // Refs for focus chaining
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Show toast on API error
  useEffect(() => {
    if (error) toast.error(error, 'Registration Failed');
  }, [error]);

  // ── Validation ────────────────────────────────────────────────────────
  const emailError = emailTouched && email.length > 0 && !isValidEmail(email)
    ? 'Enter a valid email address' : '';
  const usernameError = usernameTouched && username.length > 0 && !isValidUsername(username)
    ? 'Username: 3-20 chars, letters, numbers, underscore only' : '';
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordError = passwordTouched && password.length > 0 && password.length < 6
    ? 'Password must be at least 6 characters' : '';
  const confirmError = confirmTouched && confirmPassword.length > 0 && confirmPassword !== password
    ? 'Passwords do not match' : '';

  const canSubmit = isValidEmail(email) && isValidUsername(username)
    && password.length >= 6 && confirmPassword === password && !loading;

  // ── Submit ────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setEmailTouched(true);
    setUsernameTouched(true);
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!email.trim()) { toast.warning('Please enter your email'); return; }
    if (!isValidEmail(email.trim())) { toast.warning('Please enter a valid email address'); return; }
    if (!username.trim()) { toast.warning('Please choose a username'); return; }
    if (!isValidUsername(username.trim())) { toast.warning('Username must be 3-20 characters (letters, numbers, underscore)'); return; }
    if (!password) { toast.warning('Please create a password'); return; }
    if (password.length < 6) { toast.warning('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.warning('Passwords do not match'); return; }

    try {
      await register(email.trim(), username.trim(), password);
      toast.success('Your account has been created!', 'Welcome to Intelly');
    } catch {
      // Handled by useAuth → Redux error → useEffect
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
          {/* ── Header ────────────────────────────────────────────────── */}
          <Animated.View style={[styles.headerSection, { opacity: headerOpacity }]}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.backBtn} hitSlop={12}>
                <Ionicons name="arrow-back" size={22} color={Colors.text} />
              </Pressable>
            </Link>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSub}>Join Intelly and start your AI-powered analysis</Text>
            </View>
          </Animated.View>

          {/* ── Form card ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>

            {/* ── Step indicator ───────────────────────────────────────── */}
            <View style={styles.progressRow}>
              <ProgressDot filled={email.length > 0} valid={isValidEmail(email)} label="Email" />
              <View style={styles.progressLine} />
              <ProgressDot filled={username.length > 0} valid={isValidUsername(username)} label="Username" />
              <View style={styles.progressLine} />
              <ProgressDot filled={password.length > 0} valid={password.length >= 6} label="Password" />
              <View style={styles.progressLine} />
              <ProgressDot filled={confirmPassword.length > 0} valid={confirmPassword === password && confirmPassword.length > 0} label="Confirm" />
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[
                styles.inputWrap,
                emailError ? styles.inputWrapError : (emailTouched && isValidEmail(email) ? styles.inputWrapValid : null),
              ]}>
                <Ionicons name="mail-outline" size={18} color={emailError ? Colors.danger : (emailTouched && isValidEmail(email) ? Colors.secondary : Colors.textMuted)} style={styles.inputIcon} />
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
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  editable={!loading}
                />
                {emailTouched && isValidEmail(email) && <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />}
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={[
                styles.inputWrap,
                usernameError ? styles.inputWrapError : (usernameTouched && isValidUsername(username) ? styles.inputWrapValid : null),
              ]}>
                <Ionicons name="person-outline" size={18} color={usernameError ? Colors.danger : (usernameTouched && isValidUsername(username) ? Colors.secondary : Colors.textMuted)} style={styles.inputIcon} />
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={(t) => { setUsername(t); if (!usernameTouched) setUsernameTouched(true); }}
                  onBlur={() => setUsernameTouched(true)}
                  autoCapitalize="none"
                  autoComplete="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!loading}
                />
                {usernameTouched && isValidUsername(username) && <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />}
              </View>
              {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}
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
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (!passwordTouched) setPasswordTouched(true); }}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

              {/* Password strength meter */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBarTrack}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBarSegment,
                          { backgroundColor: level <= strength.score ? strength.color : Colors.surfaceLight },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              {/* Password requirements checklist */}
              {passwordTouched && password.length > 0 && (
                <View style={styles.checksWrap}>
                  {strength.checks.map((c, i) => (
                    <View key={i} style={styles.checkRow}>
                      <Ionicons
                        name={c.passed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={c.passed ? Colors.secondary : Colors.textMuted}
                      />
                      <Text style={[styles.checkText, c.passed && styles.checkTextPassed]}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={[
                styles.inputWrap,
                confirmError ? styles.inputWrapError : (confirmTouched && confirmPassword === password && confirmPassword.length > 0 ? styles.inputWrapValid : null),
              ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={confirmError ? Colors.danger : (confirmTouched && confirmPassword === password && confirmPassword.length > 0 ? Colors.secondary : Colors.textMuted)}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (!confirmTouched) setConfirmTouched(true); }}
                  onBlur={() => setConfirmTouched(true)}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </Pressable>
              </View>
              {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
            </View>

            {/* Register button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Colors.white} size="small" />
                  <Text style={styles.buttonText}>Creating account...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Ionicons name="person-add" size={18} color={Colors.white} />
                  <Text style={styles.buttonText}>Create Account</Text>
                </View>
              )}
            </Pressable>

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>

          {/* Login link */}
          <View style={styles.bottomLink}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.bottomBold}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Progress Dot sub-component ─────────────────────────────────────────
function ProgressDot({ filled, valid, label }: { filled: boolean; valid: boolean; label: string }) {
  const bg = valid ? Colors.secondary : filled ? Colors.warning : Colors.surfaceLight;
  return (
    <View style={progressStyles.wrap}>
      <View style={[progressStyles.dot, { backgroundColor: bg }]}>
        {valid && <Ionicons name="checkmark" size={10} color={Colors.white} />}
      </View>
      <Text style={[progressStyles.label, valid && progressStyles.labelValid]}>{label}</Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.textMuted, fontSize: 9 },
  labelValid: { color: Colors.secondary },
});

// ─── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  headerSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

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

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    gap: 2,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.surfaceLight,
    marginHorizontal: 2,
    marginBottom: 14,
  },

  // Fields
  fieldWrap: { marginBottom: Spacing.lg },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm },
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
  inputWrapError: { borderColor: Colors.danger, backgroundColor: Colors.danger + '08' },
  inputWrapValid: { borderColor: Colors.secondary + '60' },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    height: '100%',
    paddingVertical: 0,
  },
  fieldError: { color: Colors.danger, fontSize: FontSize.xs, marginTop: Spacing.xs, marginLeft: Spacing.xs },

  // Password strength
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  strengthBarTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    gap: 3,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: { fontSize: 10, fontWeight: '700', width: 60, textAlign: 'right' },

  // Password checks
  checksWrap: { marginTop: Spacing.sm, gap: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkText: { color: Colors.textMuted, fontSize: 10 },
  checkTextPassed: { color: Colors.textSecondary },

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
  buttonDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  // Terms
  terms: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 16 },
  termsLink: { color: Colors.primaryLight },

  // Bottom
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  bottomText: { color: Colors.textMuted, fontSize: FontSize.md },
  bottomBold: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: '700' },
});
