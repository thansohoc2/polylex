import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function useUserDefaults() {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const primaryLearningLanguage = user?.learningLanguages.find((language) => language.isPrimary)
      ?? user?.learningLanguages[0];

    return {
      targetLangCode: primaryLearningLanguage?.code ?? 'en',
      nativeLangCode: user?.nativeLanguageCode ?? 'vi',
      currentCefrLevel: primaryLearningLanguage?.currentCefrLevel ?? 'B1',
    };
  }, [user]);
}