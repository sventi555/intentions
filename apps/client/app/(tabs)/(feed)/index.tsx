import { Post } from '@/components/post';
import { auth } from '@/config';
import { useAuthUser } from '@/hooks/auth';
import { useFeedPosts } from '@/hooks/posts';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { FlatList, Text } from 'react-native';

const Feed: React.FC = () => {
  const user = useAuthUser();
  const { posts } = useFeedPosts();
  const queryClient = useQueryClient();

  return (
    <FlatList
      contentContainerStyle={{ gap: 4 }}
      ListHeaderComponent={() =>
        user ? (
          <Text
            onPress={() => {
              queryClient.removeQueries();
              signOut(auth);
            }}
          >
            Sign out
          </Text>
        ) : (
          <Link href="/(auth)/sign-in">Sign in</Link>
        )
      }
      data={posts}
      renderItem={({ item }) => <Post id={item.id} data={item.data()} />}
      keyExtractor={(item) => item.id}
    />
  );
};

export default Feed;
