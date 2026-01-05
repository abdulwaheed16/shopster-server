import { AnalyticsQuery } from "./analytics.validation";

export interface IAnalyticsService {
  getAdAnalytics(userId: string, query: AnalyticsQuery): Promise<any>;
  getStoreAnalytics(userId: string, query: AnalyticsQuery): Promise<any>;
  getProductAnalytics(userId: string, query: AnalyticsQuery): Promise<any>;
}
