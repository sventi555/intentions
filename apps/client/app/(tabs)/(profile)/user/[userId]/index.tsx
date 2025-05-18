import { ProfilePosts } from '@/components/profile/posts';
import { useLocalSearchParams } from 'expo-router';

const UserPosts: React.FC = () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfilePosts userId={userId} />;
};

export default UserPosts;
