import client from './client';

export interface ClusterMember {
  ticker: string;
  company_name: string;
  sector: string;
}

export interface Cluster {
  cluster_id: number;
  label: string;
  description: string;
  count: number;
  members: ClusterMember[];
  avg_stats: {
    beta: number;
    volatility: number;
    mean_return: number;
    mean_pe: number;
  };
}

export interface ClustersResponse {
  clusters: Record<string, Cluster>;
  total_tickers: number;
}

export interface PCAPoint {
  ticker: string;
  x: number;
  y: number;
  cluster: number;
  sector: string;
  company_name: string;
}

export interface PCAResponse {
  points: PCAPoint[];
  total: number;
}

export const getClusters = () =>
  client.get<ClustersResponse>('/insights/clusters');

export const getPCA = () =>
  client.get<PCAResponse>('/insights/pca');
