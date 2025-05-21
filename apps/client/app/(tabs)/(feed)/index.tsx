import { PostList } from '@/components/post-list';
import { auth } from '@/config';
import { useAuthUser } from '@/hooks/auth';
import { useFeedPosts } from '@/hooks/posts';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Text } from 'react-native';

const Feed: React.FC = () => {
  const user = useAuthUser();
  const { posts } = useFeedPosts();
  const queryClient = useQueryClient();

  return (
    <PostList
      Header={
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
      posts={posts}
    />
  );
};

export default Feed;
