import { LinkProps, useSegments } from 'expo-router';

export const useProfilePath = (
  userId: string,
): LinkProps['href'] | undefined => {
  const segments = useSegments();

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
  }

  return undefined;
};

export const useIntentionPath = (
  intentionId: string,
): LinkProps['href'] | undefined => {
  const segments = useSegments();

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
