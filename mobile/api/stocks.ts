import client from './client';

export const getStocks = (page = 1, perPage = 100) =>
  client.get('/stocks', { params: { page, per_page: perPage } });

export const getStock = (ticker: string) =>
  client.get(`/stocks/${ticker}`);

export const getStockHistory = (ticker: string, start?: string, end?: string, limit = 500) =>
  client.get(`/stocks/${ticker}/history`, { params: { start, end, limit } });

export const getStockIndicators = (ticker: string, start?: string, end?: string) =>
  client.get(`/stocks/${ticker}/indicators`, { params: { start, end } });
