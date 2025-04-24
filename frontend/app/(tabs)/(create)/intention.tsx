import { PageWrapper } from "@/components/page-wrapper";
import { functions } from "@/config/firebase";
import { useUser } from "@/hooks/user";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";

const CreateIntention = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUser();

  const [intention, setIntention] = useState("");

  const createIntention = async () => {
    const addIntention = httpsCallable(functions, "addIntention");
    await addIntention({ name: intention });

    await queryClient.invalidateQueries({
      queryKey: ["intentions", user?.uid],
    });

    router.back();
  };

  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Write an intention"
          value={intention}
          onChangeText={(val) => setIntention(val)}
        />
        <Button
          title="Create"
          disabled={!intention}
          onPress={createIntention}
        />
      </View>
    </PageWrapper>
  );
};

export default CreateIntention;
