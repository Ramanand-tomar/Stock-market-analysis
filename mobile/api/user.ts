import client from './client';

export const getWatchlist = () =>
  client.get('/user/watchlist');

export const addToWatchlist = (ticker: string) =>
  client.post('/user/watchlist', { ticker });

export const removeFromWatchlist = (ticker: string) =>
  client.delete(`/user/watchlist/${ticker}`);

export const getPredictionHistory = (limit = 50) =>
  client.get('/user/predictions', { params: { limit } });
