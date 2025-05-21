import { DisplayPic } from '@/components/display-pic';
import { useAuthUser } from '@/hooks/auth';
import { useFollowsToUser, useRespondToFollow } from '@/hooks/follows';
import { dayjs } from '@/utils/time';
import { Button, FlatList, Text, View } from 'react-native';

const Notifications: React.FC = () => {
  const authUser = useAuthUser();
  const { follows } = useFollowsToUser(authUser?.uid);
  const respondToFollow = useRespondToFollow();

  return (
    <FlatList
      contentContainerStyle={{ padding: 8 }}
      data={follows}
      renderItem={({ item }) => {
        const { fromUser, status, createdAt } = item.data();

        return (
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                flexShrink: 1,
              }}
            >
              <DisplayPic user={fromUser} size={32} />
              <Text>
                {fromUser.username}{' '}
                {status === 'pending'
                  ? 'requested to follow you'
                  : 'followed you'}{' '}
                <Text style={{ color: 'gray' }}>
                  {dayjs(createdAt).fromNow()}
                </Text>
              </Text>
            </View>
            {status === 'pending' ? (
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <Button
                  title="Accept"
                  color="green"
                  onPress={() =>
                    respondToFollow({
                      userId: item.id,
                      data: { action: 'accept' },
                    })
                  }
                />
                <Button
                  title="Decline"
                  color="gray"
                  onPress={() =>
                    respondToFollow({
                      userId: item.id,
                      data: { action: 'decline' },
                    })
                  }
                />
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
};

export default Notifications;
