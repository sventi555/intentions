import { ProfileIntentions } from '@/components/profile/intentions';
import { useLocalSearchParams } from 'expo-router';

const UserIntentions: React.FC = () => {
  const userId = useLocalSearchParams().userId as string;

  return <ProfileIntentions userId={userId} />;
};

export default UserIntentions;
