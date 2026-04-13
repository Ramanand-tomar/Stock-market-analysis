import client from './client';

export const getPrediction = (ticker: string) =>
  client.get(`/predict/${ticker}`);

export const getExplanation = (ticker: string) =>
  client.get(`/predict/${ticker}/explain`);

export const getAllMetrics = () =>
  client.get('/models/metrics');

export const getModelMetrics = (modelName: string) =>
  client.get(`/models/${modelName}/metrics`);
