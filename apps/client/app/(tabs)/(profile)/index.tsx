import { useAuthUser } from '@/hooks/auth';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

const OwnProfile = () => {
  const user = useAuthUser();

  if (!user) {
    return (
      <View>
        <Text>Create an account or sign in to view your profile!</Text>
      </View>
    );
  }

  return (
    <Redirect
      href={{
        pathname: '/(tabs)/(profile)/user/[userId]',
        params: { userId: user.uid },
      }}
    />
  );
};

export default OwnProfile;
