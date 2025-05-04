import { Post, PostProps } from '@/components/post';
import { useFollow, useFollowUser, useRemoveFollow } from '@/hooks/follows';
import { useUserPosts } from '@/hooks/posts';
import { useAuthUser, useUser } from '@/hooks/user';
import { Button, FlatList, Text, View } from 'react-native';

interface ProfileProps {
  userId: string;
}

const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const authUser = useAuthUser();
  const { user } = useUser(userId);
  const { posts } = useUserPosts(userId);
  const { follow } = useFollow({ from: authUser?.uid, to: userId });

  const followUser = useFollowUser(userId);
  const removeFollow = useRemoveFollow();
  const unfollowUser = () =>
    removeFollow({ userId, data: { direction: 'to' } });

  return (
    <View style={{ flex: 1 }}>
      <Text>{user?.username}</Text>
      {authUser?.uid === userId ? null : (
        <View>
          {follow ? (
            <Button
              title={follow.status === 'pending' ? 'Pending' : 'Unfollow'}
              onPress={() => unfollowUser()}
              color="gray"
            />
          ) : (
            <Button title={'Follow'} onPress={() => followUser()} />
          )}
        </View>
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

export default Profile;
