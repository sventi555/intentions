import { Post } from '@/components/post';
import { useIntention } from '@/hooks/intentions';
import { useIntentionPosts } from '@/hooks/posts';
import { FlatList, Text } from 'react-native';

interface IntentionProps {
  intentionId: string;
}

export const Intention: React.FC<IntentionProps> = ({ intentionId }) => {
  const { intention } = useIntention(intentionId);
  const { posts } = useIntentionPosts(intention?.userId, intentionId);

  return (
    <FlatList
      ListHeaderComponent={() => <Text>{intention?.name}</Text>}
      data={posts}
      renderItem={({ item }) => <Post id={item.id} data={item.data()} />}
    />
  );
};
