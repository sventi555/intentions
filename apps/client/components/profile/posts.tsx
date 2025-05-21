import { useUserPosts } from '@/hooks/posts';
import { PostList } from '../post-list';

export const ProfilePosts: React.FC<{ userId: string }> = ({ userId }) => {
  const { posts } = useUserPosts(userId);

  return <PostList posts={posts} />;
};
