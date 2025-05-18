import { IntentionPosts } from '@/components/intention';
import { useLocalSearchParams } from 'expo-router';

const Intention: React.FC = () => {
  const intentionId = useLocalSearchParams().intentionId as string;

  return <IntentionPosts intentionId={intentionId} />;
};

export default Intention;
