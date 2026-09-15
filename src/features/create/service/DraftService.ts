import { Draft } from '../types';
import { storageService, IStorageService } from '../../../services/storage';

const DRAFTS_STORAGE_KEY = '@tiktalk_video_drafts';

export class DraftService {
  private storage: IStorageService;

  constructor(storage: IStorageService = storageService) {
    this.storage = storage;
  }

  async getDrafts(): Promise<Draft[]> {
    try {
      const drafts = await this.storage.getItem<Draft[]>(DRAFTS_STORAGE_KEY);
      if (Array.isArray(drafts)) {
        // Sort by most recently updated
        return drafts.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  async getDraftById(id: string): Promise<Draft | null> {
    const drafts = await this.getDrafts();
    return drafts.find((d) => d.id === id) || null;
  }

  async saveDraft(draft: Draft): Promise<Draft> {
    const now = new Date().toISOString();
    const existing = await this.getDrafts();

    const draftToSave: Draft = {
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: now,
    };

    const index = existing.findIndex((d) => d.id === draftToSave.id);
    let updatedList: Draft[];

    if (index >= 0) {
      updatedList = [...existing];
      updatedList[index] = draftToSave;
    } else {
      updatedList = [draftToSave, ...existing];
    }

    await this.storage.setItem(DRAFTS_STORAGE_KEY, updatedList);
    return draftToSave;
  }

  async deleteDraft(id: string): Promise<void> {
    const existing = await this.getDrafts();
    const filtered = existing.filter((d) => d.id !== id);
    await this.storage.setItem(DRAFTS_STORAGE_KEY, filtered);
  }

  async clearAllDrafts(): Promise<void> {
    await this.storage.removeItem(DRAFTS_STORAGE_KEY);
  }
}

export const draftService = new DraftService();
