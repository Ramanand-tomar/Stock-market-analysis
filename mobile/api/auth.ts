import client from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export const loginApi = (data: LoginPayload) =>
  client.post('/auth/login', data);

export const registerApi = (data: RegisterPayload) =>
  client.post('/auth/register', data);

export const refreshApi = (refresh_token: string) =>
  client.post('/auth/refresh', { refresh_token });

export const getMeApi = () =>
  client.get('/auth/me');
