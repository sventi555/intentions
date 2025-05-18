import { ProfileLayout } from '@/components/profile/layout';
import { useLocalSearchParams } from 'expo-router';

export default () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfileLayout userId={userId} />;
};
