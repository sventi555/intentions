import { useUserIntentions } from '@/hooks/intentions';
import { Text, View } from 'react-native';

export const ProfileIntentions: React.FC<{ userId: string }> = ({ userId }) => {
  const { intentions } = useUserIntentions(userId);

  return (
    <View>
      {intentions?.map((intention) => <Text>{intention.data().name}</Text>)}
    </View>
  );
};
