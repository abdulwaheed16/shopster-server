export interface IDashboardService {
  getUserStats(userId: string): Promise<any>;
  getAdminStats(): Promise<any>;
}
