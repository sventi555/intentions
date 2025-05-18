import { useProfileIntentionsPath, useProfilePath } from '@/hooks/navigation';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { Text, View } from 'react-native';
import ProfileHeader from './header';

export const ProfileLayout: React.FC<{ userId: string }> = ({ userId }) => {
  const profilePath = useProfilePath(userId);
  const profileIntionsPath = useProfileIntentionsPath(userId);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 8 }}>
        <ProfileHeader userId={userId} />
      </View>
      <Tabs>
        <TabList>
          <TabTrigger
            style={{
              flex: 1,
              padding: 8,
              backgroundColor: 'lightgray',
              borderRightWidth: 2,
            }}
            name="index"
            href={profilePath}
          >
            <Text style={{ textAlign: 'center' }}>Posts</Text>
          </TabTrigger>
          <TabTrigger
            style={{ flex: 1, padding: 8, backgroundColor: 'lightgray' }}
            name="intentions"
            href={profileIntionsPath}
          >
            <Text style={{ textAlign: 'center' }}>Intentions</Text>
          </TabTrigger>
        </TabList>
        <View style={{ padding: 8 }}>
          <TabSlot />
        </View>
      </Tabs>
    </View>
  );
};
