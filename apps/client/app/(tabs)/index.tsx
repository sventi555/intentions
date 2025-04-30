import { Post, PostProps } from '@/components/post';
import { auth } from '@/config/firebase';
import { useFeedPosts } from '@/hooks/posts';
import { useUser } from '@/hooks/user';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { FlatList, Text, View } from 'react-native';

const Feed = () => {
  const user = useUser();
  const { posts } = useFeedPosts();

  return (
    <View style={{ flex: 1 }}>
      {user ? (
        <Text onPress={() => signOut(auth)}>Sign out</Text>
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
