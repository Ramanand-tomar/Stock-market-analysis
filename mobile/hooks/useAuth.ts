import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { AppDispatch, RootState } from '../store/store';
import { setCredentials, setUser, setLoading, setError, logout as logoutAction } from '../store/slices/authSlice';
import { loginApi, registerApi, getMeApi } from '../api/auth';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);

  const login = useCallback(async (email: string, password: string) => {
    dispatch(setLoading(true));
    try {
      const { data } = await loginApi({ email, password });
      dispatch(setCredentials({ accessToken: data.access_token, refreshToken: data.refresh_token }));
      await SecureStore.setItemAsync('accessToken', data.access_token);
      await SecureStore.setItemAsync('refreshToken', data.refresh_token);
      const me = await getMeApi();
      dispatch(setUser(me.data));
    } catch (err: any) {
      dispatch(setError(err.response?.data?.detail || 'Login failed'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const register = useCallback(async (email: string, username: string, password: string) => {
    dispatch(setLoading(true));
    try {
      await registerApi({ email, username, password });
      await login(email, password);
    } catch (err: any) {
      dispatch(setError(err.response?.data?.detail || 'Registration failed'));
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, login]);

  const logout = useCallback(async () => {
    dispatch(logoutAction());
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }, [dispatch]);

  const restoreSession = useCallback(async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (accessToken && refreshToken) {
      dispatch(setCredentials({ accessToken, refreshToken }));
      try {
        const me = await getMeApi();
        dispatch(setUser(me.data));
      } catch {
        dispatch(logoutAction());
      }
    }
  }, [dispatch]);

  return { ...auth, login, register, logout, restoreSession };
}
