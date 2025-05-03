import { Post, PostProps } from '@/components/post';
import { auth } from '@/config/firebase';
import { useFeedPosts } from '@/hooks/posts';
import { useAuthUser } from '@/hooks/user';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { FlatList, Text, View } from 'react-native';

const Feed = () => {
  const user = useAuthUser();
  const { posts } = useFeedPosts();
  const queryClient = useQueryClient();

  return (
    <View style={{ flex: 1 }}>
      {user ? (
        <Text
          onPress={() => {
            queryClient.removeQueries();
            signOut(auth);
          }}
        >
          Sign out
        </Text>
      ) : (
        <Link href="/sign-in">Sign in</Link>
      )}
      {posts && (
        <FlatList
          data={posts}
          renderItem={({ item }) => <Post {...(item.data() as PostProps)} />}
        />
      )}
    </View>
  );
};

export default Feed;
