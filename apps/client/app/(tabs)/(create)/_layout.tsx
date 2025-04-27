import { Stack } from "expo-router";

const CreateLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="intention"
        options={{ title: "Create a new intention" }}
      />
    </Stack>
  );
};

export default CreateLayout;
