import { Post } from '@/components/post';
import { auth } from '@/config';
import { useFeedPosts } from '@/hooks/posts';
import { useAuthUser } from '@/hooks/user';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { FlatList, Text } from 'react-native';

const Feed = () => {
  const user = useAuthUser();
  const { posts } = useFeedPosts();
  const queryClient = useQueryClient();

  return (
    <FlatList
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
      renderItem={({ item }) => <Post {...item.data()} />}
    />
  );
};

export default Feed;
