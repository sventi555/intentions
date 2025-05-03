import { Stack } from 'expo-router';

const FeedLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[userId]" options={{ title: '' }} />
    </Stack>
  );
};

export default FeedLayout;
