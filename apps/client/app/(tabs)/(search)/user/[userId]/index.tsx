import { ProfilePosts } from '@/components/profile/posts';
import { useLocalSearchParams } from 'expo-router';

export default () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfilePosts userId={userId} />;
};
