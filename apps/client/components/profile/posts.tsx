import { Post } from '@/components/post';
import { useUserPosts } from '@/hooks/posts';
import { FlatList } from 'react-native';

export const ProfilePosts: React.FC<{ userId: string }> = ({ userId }) => {
  const { posts } = useUserPosts(userId);

  return (
    <FlatList
      contentContainerStyle={{ gap: 8 }}
      data={posts}
      renderItem={({ item }) => <Post id={item.id} data={item.data()} />}
    />
  );
};
