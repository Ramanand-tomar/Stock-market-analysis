import React, { useCallback, useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { store, persistor, RootState } from '../store/store';
import { Colors } from '../constants/theme';
import { ToastProvider } from '../components/Toast';
import SplashScreenView from '../components/SplashScreen';

// Keep the native splash visible while we load resources
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, ready]);

  return <>{children}</>;
}

function RootLayoutInner() {
  const [showSplash, setShowSplash] = useState(true);

  // Hide the native splash once our custom one is rendering
  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <ToastProvider>
      <AuthGuard>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        />
      </AuthGuard>
      {showSplash && <SplashScreenView onFinish={handleSplashFinish} />}
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <PersistGate
          loading={
            <View style={styles.loading}>
              <View />
            </View>
          }
          persistor={persistor}
        >
          <RootLayoutInner />
        </PersistGate>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.background },
});
