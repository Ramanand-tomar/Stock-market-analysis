import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={80} color={Colors.primaryLight} />
      </View>

      <Text style={styles.username}>{user?.username || 'User'}</Text>
      <Text style={styles.email}>{user?.email || ''}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{user?.is_admin ? 'Admin' : 'Standard'} Account</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="radio-button-on-outline" size={18} color={user?.is_active ? Colors.up : Colors.danger} />
          <Text style={styles.infoText}>{user?.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

      {/* Developer credit */}
      <View style={styles.devSection}>
        <View style={styles.devDivider} />
        <View style={styles.devCard}>
          <Ionicons name="code-slash" size={18} color={Colors.primaryLight} />
          <View>
            <Text style={styles.devLabel}>Developed by</Text>
            <Text style={styles.devName}>Ramanand Tomar</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xxl, paddingTop: Spacing.sm, alignItems: 'center' },
  avatar: { marginTop: Spacing.xxxl, marginBottom: Spacing.md },
  username: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  email: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xxl },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    gap: Spacing.lg,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoText: { color: Colors.text, fontSize: FontSize.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxxl,
    backgroundColor: Colors.danger + '15',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  logoutText: { color: Colors.danger, fontSize: FontSize.lg, fontWeight: '700' },
  devSection: { marginTop: 'auto', width: '100%', paddingBottom: Spacing.lg },
  devDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  devCard: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: Spacing.sm },
  devLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  devName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' as const },
});
