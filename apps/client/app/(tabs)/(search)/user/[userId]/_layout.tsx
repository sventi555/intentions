import { ProfileLayout } from '@/components/profile/layout';
import { useLocalSearchParams } from 'expo-router';

const UserLayout: React.FC = () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfileLayout userId={userId} />;
};

export default UserLayout;
