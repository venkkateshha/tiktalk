import { useState, useCallback } from 'react';
import {
  StoryType,
  StoryAudience,
  Story,
  CreateStoryInput,
} from '../types';
import { storyService } from '../service';

export interface UseStoryCreationResult {
  type: StoryType;
  setType: (type: StoryType) => void;
  textContent: string;
  setTextContent: (text: string) => void;
  textBackground: string;
  setTextBackground: (bg: string) => void;
  textStyle: 'classic' | 'neon' | 'bold' | 'minimal' | 'typewriter';
  setTextStyle: (style: 'classic' | 'neon' | 'bold' | 'minimal' | 'typewriter') => void;
  textColor: string;
  setTextColor: (color: string) => void;
  mediaUri?: string;
  setMediaUri: (uri?: string, mimeType?: string) => void;
  audience: StoryAudience;
  setAudience: (audience: StoryAudience) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  mentions: string[];
  addMention: (mention: string) => void;
  removeMention: (mention: string) => void;
  isPublishing: boolean;
  error?: string;
  publish: () => Promise<Story>;
  reset: () => void;
}

export const BACKGROUND_PRESETS = [
  '#000000',
  '#1E1E2F',
  '#0F2027',
  '#2C3E50',
  '#240046',
  '#3D0066',
  '#1A365D',
  '#1B4332',
];

export const useStoryCreation = (onSuccess?: (story: Story) => void): UseStoryCreationResult => {
  const [type, setType] = useState<StoryType>('text');
  const [textContent, setTextContent] = useState<string>('');
  const [textBackground, setTextBackground] = useState<string>('#000000');
  const [textStyle, setTextStyle] = useState<'classic' | 'neon' | 'bold' | 'minimal' | 'typewriter'>('classic');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [mediaUri, setMediaUriState] = useState<string | undefined>();
  const [mediaMimeType, setMediaMimeType] = useState<string | undefined>();
  const [audience, setAudience] = useState<StoryAudience>('everyone');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const setMediaUri = useCallback((uri?: string, mimeType?: string) => {
    setMediaUriState(uri);
    setMediaMimeType(mimeType);
    if (uri) {
      if (mimeType?.startsWith('video/')) {
        setType('video');
      } else {
        setType('photo');
      }
    }
  }, []);

  const addMention = useCallback((mention: string) => {
    const clean = mention.startsWith('@') ? mention : `@${mention}`;
    setMentions((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const removeMention = useCallback((mention: string) => {
    setMentions((prev) => prev.filter((m) => m !== mention));
  }, []);

  const reset = useCallback(() => {
    setType('text');
    setTextContent('');
    setTextBackground('#000000');
    setTextStyle('classic');
    setTextColor('#FFFFFF');
    setMediaUriState(undefined);
    setMediaMimeType(undefined);
    setAudience('everyone');
    setIsMuted(false);
    setMentions([]);
    setIsPublishing(false);
    setError(undefined);
  }, []);

  const publish = useCallback(async (): Promise<Story> => {
    setIsPublishing(true);
    setError(undefined);

    try {
      // Validate
      if (type === 'text' && !textContent.trim()) {
        throw new Error('Please enter some text for your story');
      }
      if ((type === 'photo' || type === 'video') && !mediaUri) {
        throw new Error(`Please select a ${type} file`);
      }

      const input: CreateStoryInput = {
        type,
        textContent: textContent.trim() || undefined,
        textBackground,
        media: mediaUri
          ? {
              id: `med_${Date.now()}`,
              uri: mediaUri,
              mimeType: mediaMimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
              source: 'gallery',
            }
          : undefined,
        audience,
        mentions,
        durationSeconds: type === 'video' ? 15 : 5,
      };

      const created = await storyService.createStory(input);
      setIsPublishing(false);
      reset();
      onSuccess?.(created);
      return created;
    } catch (err) {
      setIsPublishing(false);
      const msg = err instanceof Error ? err.message : 'Failed to publish story';
      setError(msg);
      throw err;
    }
  }, [
    type,
    textContent,
    textBackground,
    mediaUri,
    mediaMimeType,
    audience,
    mentions,
    reset,
    onSuccess,
  ]);

  return {
    type,
    setType,
    textContent,
    setTextContent,
    textBackground,
    setTextBackground,
    textStyle,
    setTextStyle,
    textColor,
    setTextColor,
    mediaUri,
    setMediaUri,
    audience,
    setAudience,
    isMuted,
    setIsMuted,
    mentions,
    addMention,
    removeMention,
    isPublishing,
    error,
    publish,
    reset,
  };
};
