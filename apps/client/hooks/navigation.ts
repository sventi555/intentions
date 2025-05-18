import { LinkProps, useNavigation, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

export const useProfilePath = (
  userId: string,
): LinkProps['href'] | undefined => {
  const segments = useCachedSegments();

  if (segments[0] === '(tabs)') {
    if (segments[1] === '(search)') {
      return {
        pathname: '/(tabs)/(search)/user/[userId]',
        params: { userId },
      };
    }
    if (segments[1] === '(feed)') {
      return {
        pathname: '/(tabs)/(feed)/user/[userId]',
        params: { userId },
      };
    }
    if (segments[1] === '(profile)') {
      return {
        pathname: '/(tabs)/(profile)/user/[userId]',
        params: { userId },
      };
    }
  }

  return undefined;
};

export const useProfileIntentionsPath = (
  userId: string,
): LinkProps['href'] | undefined => {
  const segments = useCachedSegments();

  if (segments[0] === '(tabs)') {
    if (segments[1] === '(search)') {
      return {
        pathname: '/(tabs)/(search)/user/[userId]/intentions',
        params: { userId },
      };
    }
    if (segments[1] === '(feed)') {
      return {
        pathname: '/(tabs)/(feed)/user/[userId]/intentions',
        params: { userId },
      };
    }
    if (segments[1] === '(profile)') {
      return {
        pathname: '/(tabs)/(profile)/user/[userId]/intentions',
        params: { userId },
      };
    }
  }

  return undefined;
};

export const useIntentionPath = (
  intentionId: string,
): LinkProps['href'] | undefined => {
  const segments = useCachedSegments();

  if (segments[0] === '(tabs)') {
    if (segments[1] === '(search)') {
      return {
        pathname: '/(tabs)/(search)/intention/[intentionId]',
        params: { intentionId },
      };
    }
    if (segments[1] === '(feed)') {
      return {
        pathname: '/(tabs)/(feed)/intention/[intentionId]',
        params: { intentionId },
      };
    }
    if (segments[1] === '(profile)') {
      return {
        pathname: '/(tabs)/(profile)/intention/[intentionId]',
        params: { intentionId },
      };
    }
  }

  return undefined;
};

const useCachedSegments = () => {
  const segments = useSegments();
  const [cachedSegments, setCachedSegments] = useState(segments);
  const navigation = useNavigation();
  const isFocused = navigation.isFocused();

  useEffect(() => {
    if (isFocused) {
      setCachedSegments(segments);
    }
  }, [segments, isFocused]);

  return cachedSegments;
};
