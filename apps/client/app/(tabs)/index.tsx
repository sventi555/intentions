import { PageWrapper } from '@/components/page-wrapper';
import { Post } from '@/components/post';
import { auth } from '@/config/firebase';
import { useFeedPosts } from '@/hooks/posts';
import { useUser } from '@/hooks/user';
import { Link } from 'expo-router';
import { signOut } from 'firebase/auth';
import { ScrollView, Text, View } from 'react-native';

const Feed = () => {
  const user = useUser();
  const { posts } = useFeedPosts();

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView>
        <PageWrapper>
          <View style={{ gap: 8 }}>
            {posts?.map((post) => {
              return <Post key={post.id} {...(post.data() as any)} />;
            })}
          </View>
        </PageWrapper>
      </ScrollView>
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        {user ? (
          <Text onPress={() => signOut(auth)}>Sign out</Text>
        ) : (
          <Link href="/sign-in">Sign in</Link>
        )}
      </View>
    </View>
  );
};

export default Feed;
