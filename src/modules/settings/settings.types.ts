export interface ISettingsService {
  getProfile(userId: string): Promise<any>;
  updateProfile(userId: string, data: any): Promise<any>;
  getSecuritySettings(userId: string): Promise<any>;
  updateSecurity(userId: string, data: any): Promise<any>;
  toggle2FA(userId: string, enabled: boolean): Promise<any>;
}
