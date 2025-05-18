import { ProfileIntentions } from '@/components/profile/intentions';
import { useLocalSearchParams } from 'expo-router';

export default () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfileIntentions userId={userId} />;
};
