import Profile from '@/components/profile';
import { useLocalSearchParams } from 'expo-router';

const UserProfile = () => {
  const userId = useLocalSearchParams().userId as string;

  return <Profile userId={userId} />;
};

export default UserProfile;
