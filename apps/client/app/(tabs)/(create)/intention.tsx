import { PageWrapper } from '@/components/page-wrapper';
import { useUser } from '@/hooks/user';
import { CreateIntentionBody } from '@lib';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

const CreateIntention = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUser();

  const [intention, setIntention] = useState('');

  const { mutateAsync: createIntention } = useMutation({
    mutationFn: async (vars: CreateIntentionBody) => {
      const idToken = await user?.getIdToken();
      await fetch(`${process.env.EXPO_PUBLIC_API_HOST}/intentions`, {
        method: 'POST',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars),
      });
    },
  });

  const onCreateIntention = async () => {
    await createIntention({ name: intention });

    queryClient.invalidateQueries({
      queryKey: ['intentions', user?.uid],
    });

    router.back();
  };

  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Write an intention"
          value={intention}
          onChangeText={setIntention}
        />
        <Button
          title="Create"
          disabled={!intention}
          onPress={onCreateIntention}
        />
      </View>
    </PageWrapper>
  );
};

export default CreateIntention;
