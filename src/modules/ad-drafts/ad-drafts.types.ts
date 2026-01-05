export interface IAdDraftsService {
  getCurrentDraft(userId: string): Promise<any>;
  upsertDraft(userId: string, data: any): Promise<any>;
  deleteDraft(userId: string): Promise<void>;
}
