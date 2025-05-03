import { LinkProps, useSegments } from 'expo-router';

export const useProfilePath = (
  userId: string,
): LinkProps['href'] | undefined => {
  const segments = useSegments();

  if (segments[0] === '(tabs)') {
    if (segments[1] === '(search)') {
      return {
        pathname: '/(tabs)/(search)/[userId]',
        params: { userId },
      };
    }
    if (segments[1] === '(feed)') {
      return {
        pathname: '/(tabs)/(feed)/[userId]',
        params: { userId },
      };
    }
  }

  return undefined;
};
