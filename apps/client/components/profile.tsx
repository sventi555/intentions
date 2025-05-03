import { Post, PostProps } from '@/components/post';
import { db } from '@/config/firebase';
import { useUserPosts } from '@/hooks/posts';
import { useAuthUser, useUser } from '@/hooks/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { Button, FlatList, Text, View } from 'react-native';

interface ProfileProps {
  userId: string | undefined;
}

const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const { posts } = useUserPosts(userId);
  const { user } = useUser(userId);
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const { data: follow } = useQuery({
    enabled: !!authUser,
    queryKey: ['follow', `from-${authUser?.uid}`, `to-${userId}`],
    queryFn: async () => {
      const follow = await getDoc(
        doc(db, `follows/${userId}/from/${authUser?.uid}`),
      );
      return follow.data();
    },
  });

  const { mutateAsync: followUser } = useMutation({
    mutationFn: async () => {
      const idToken = await authUser?.getIdToken();
      fetch(`${process.env.EXPO_PUBLIC_API_HOST}/follows/${userId}`, {
        method: 'POST',
        headers: { Authorization: idToken ?? '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follow', `from-${authUser?.uid}`, `to-${userId}`],
      });
    },
  });

  const { mutateAsync: unfollowUser } = useMutation({});

  return (
    <View style={{ flex: 1 }}>
      <Text>{user?.username}</Text>
      {authUser?.uid === userId ? null : (
        <View>
          <Button
            title={followButtonText(follow)}
            onPress={() => (follow ? unfollowUser() : followUser())}
            color={follow ? 'gray' : undefined}
          />
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

const followButtonText = (followData: any | undefined) => {
  if (!followData) {
    return 'Follow';
  }

  if (followData.status === 'pending') {
    return 'Pending';
  }

  return 'Following';
};
