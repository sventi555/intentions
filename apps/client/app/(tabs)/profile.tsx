import { useUserPosts } from '@/hooks/posts';
import { useUser } from '@/hooks/user';
import { FlatList, Text, View } from 'react-native';

const Profile = () => {
  // Change this eventually. Only good for current user profile
  const user = useUser();
  const { posts } = useUserPosts(user?.uid);

  const groupedPosts = posts?.reduce<(typeof posts)[]>((acc, post) => {
    if (acc.length === 0 || acc.at(-1)?.length === 3) {
      acc.push([post]);
    } else {
      acc.at(-1)?.push(post);
    }

    return acc;
  }, []);

  return (
    <View>
      <Text>username</Text>
      <FlatList
        data={groupedPosts}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row' }}>
            {item.map((n) => (
              <Text style={{ flex: 1 }}>{n.data().description}</Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

export default Profile;
