import { Intention } from '@/components/intention';
import { useLocalSearchParams } from 'expo-router';

const IntentionPage = () => {
  const intentionId = useLocalSearchParams().intentionId as string;

  return <Intention intentionId={intentionId} />;
};

export default IntentionPage;
