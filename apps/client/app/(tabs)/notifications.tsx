import { useFollowsToUser, useRespondToFollow } from '@/hooks/follows';
import { useAuthUser } from '@/hooks/user';
import { dayjs } from '@/utils/time';
import { Button, Text, View } from 'react-native';

const Notifications = () => {
  const authUser = useAuthUser();
  const { follows } = useFollowsToUser(authUser?.uid);
  const respondToFollow = useRespondToFollow();

  return (
    <View>
      {follows?.map((follow) => {
        const { fromUser, status, createdAt } = follow.data();

        return (
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <View>
              <Text>
                {fromUser.username}{' '}
                {status === 'pending'
                  ? 'requested to follow you'
                  : 'followed you'}{' '}
              </Text>
              <Text style={{ color: 'gray' }}>
                {dayjs(createdAt).fromNow()}
              </Text>
            </View>
            {status === 'pending' ? (
              <>
                <Button
                  title="Accept"
                  onPress={() =>
                    respondToFollow({
                      userId: follow.id,
                      data: { action: 'accept' },
                    })
                  }
                />
                <Button
                  title="Decline"
                  onPress={() =>
                    respondToFollow({
                      userId: follow.id,
                      data: { action: 'decline' },
                    })
                  }
                />
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

export default Notifications;
