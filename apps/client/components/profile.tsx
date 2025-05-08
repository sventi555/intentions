import { Post } from '@/components/post';
import { useFollow, useFollowUser, useRemoveFollow } from '@/hooks/follows';
import { useLayout } from '@/hooks/layout';
import { useUserPosts } from '@/hooks/posts';
import { useAuthUser, useUpdateUser, useUser } from '@/hooks/user';
import { User } from '@lib';
import * as ImagePicker from 'expo-image-picker';
import { Button, FlatList, Pressable, Text, View } from 'react-native';
import { DisplayPic } from './display-pic';

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

  const isOwner = authUser?.uid === userId;

  return (
    <View style={{ flex: 1, gap: 8 }}>
      {user ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ProfileDP user={user} isOwner={isOwner} />
          <Text>{user.username}</Text>
        </View>
      ) : null}
      {isOwner ? null : (
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
          renderItem={({ item }) => <Post {...item.data()} />}
        />
      )}
    </View>
  );
};

export default Profile;

interface ProfileDPProps {
  isOwner: boolean;
  user: User;
}

const ProfileDP: React.FC<ProfileDPProps> = ({ isOwner, user }) => {
  const updateUser = useUpdateUser();
  const updateDP = async (image: string) => {
    await updateUser({ image });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const image = result.assets[0].uri;
      await updateDP(image);
    }
  };

  const size = 112;
  const overlayTextLayout = useLayout();

  return (
    <Pressable disabled={!isOwner} onPress={pickImage}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <DisplayPic user={user} size={size} />
        {isOwner ? (
          <Text
            numberOfLines={1}
            style={{
              padding: 4,
              borderRadius: 8,
              backgroundColor: '#00000080',
              color: '#FFFFFF',
              fontSize: 10,
              position: 'absolute',
              left: '50%',
              transform: `translateX(-${overlayTextLayout.width / 2}px)`,
              bottom: 24,
            }}
            onLayout={overlayTextLayout.onLayout}
          >
            Tap to change
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};
