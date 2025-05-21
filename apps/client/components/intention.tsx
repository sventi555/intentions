import { useIntention } from '@/hooks/intentions';
import { useIntentionPosts } from '@/hooks/posts';
import { Text } from 'react-native';
import { PostList } from './post-list';

interface IntentionPostsProps {
  intentionId: string;
}

export const IntentionPosts: React.FC<IntentionPostsProps> = ({
  intentionId,
}) => {
  const { intention } = useIntention(intentionId);
  const { posts } = useIntentionPosts(intention?.userId, intentionId);

  return <PostList Header={<Text>{intention?.name}</Text>} posts={posts} />;
};
