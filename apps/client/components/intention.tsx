import { Post } from '@/components/post';
import { useIntention } from '@/hooks/intentions';
import { useIntentionPosts } from '@/hooks/posts';
import { FlatList, Text } from 'react-native';

interface IntentionPostsProps {
  intentionId: string;
}

export const IntentionPosts: React.FC<IntentionPostsProps> = ({
  intentionId,
}) => {
  const { intention } = useIntention(intentionId);
  const { posts } = useIntentionPosts(intention?.userId, intentionId);

  return (
    <FlatList
      ListHeaderComponent={() => <Text>{intention?.name}</Text>}
      data={posts}
      renderItem={({ item }) => <Post id={item.id} data={item.data()} />}
      keyExtractor={(item) => item.id}
    />
  );
};
