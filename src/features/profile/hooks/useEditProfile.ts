import { useState, useCallback, useMemo } from 'react';
import { UserProfile, EditProfileInput } from '../types';
import { IProfileService, profileService } from '../service';

export interface UseEditProfileReturn {
  form: EditProfileInput;
  errors: {
    displayName?: string;
    username?: string;
    bio?: string;
    website?: string;
  };
  isValid: boolean;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  setField: (field: keyof EditProfileInput, value: string) => void;
  save: () => Promise<UserProfile | null>;
  reset: () => void;
}

export function useEditProfile(
  initialProfile: UserProfile,
  service: IProfileService = profileService,
  onSuccess?: (updated: UserProfile) => void
): UseEditProfileReturn {
  const initialForm = useMemo<EditProfileInput>(
    () => ({
      displayName: initialProfile.displayName,
      username: initialProfile.username,
      bio: initialProfile.bio || '',
      website: initialProfile.website || '',
      avatarUri: initialProfile.avatarUrl,
    }),
    [initialProfile]
  );

  const [form, setForm] = useState<EditProfileInput>(initialForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const errs: {
      displayName?: string;
      username?: string;
      bio?: string;
      website?: string;
    } = {};

    if (!form.displayName.trim()) {
      errs.displayName = 'Display name cannot be empty';
    } else if (form.displayName.length > 50) {
      errs.displayName = 'Display name maximum is 50 characters';
    }

    if (!form.username.trim()) {
      errs.username = 'Username cannot be empty';
    } else if (!/^[a-zA-Z0-9._]+$/.test(form.username)) {
      errs.username = 'Username can only contain letters, numbers, underscores, and dots';
    } else if (form.username.length > 30) {
      errs.username = 'Username maximum is 30 characters';
    }

    if (form.bio.length > 150) {
      errs.bio = 'Bio maximum is 150 characters';
    }

    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      errs.website = 'Website must begin with http:// or https://';
    }

    return errs;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const isDirty = useMemo(() => {
    return (
      form.displayName !== initialForm.displayName ||
      form.username !== initialForm.username ||
      form.bio !== initialForm.bio ||
      form.website !== initialForm.website ||
      form.avatarUri !== initialForm.avatarUri
    );
  }, [form, initialForm]);

  const setField = useCallback((field: keyof EditProfileInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  }, []);

  const reset = useCallback(() => {
    setForm(initialForm);
    setSaveError(null);
  }, [initialForm]);

  const save = useCallback(async (): Promise<UserProfile | null> => {
    if (!isValid) return null;
    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await service.updateProfile(form);
      if (onSuccess) {
        onSuccess(updated);
      }
      return updated;
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile changes');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [form, isValid, service, onSuccess]);

  return {
    form,
    errors,
    isValid,
    isDirty,
    isSaving,
    saveError,
    setField,
    save,
    reset,
  };
}
