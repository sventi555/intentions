import { PageWrapper } from '@/components/page-wrapper';
import { useCreateIntention } from '@/hooks/intentions';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

const CreateIntention = () => {
  const router = useRouter();

  const [intention, setIntention] = useState('');
  const createIntention = useCreateIntention({
    onSuccess: () => {
      router.back();
    },
  });

  const onSubmit = async () => {
    await createIntention({ name: intention });
  };

  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Write an intention"
          value={intention}
          onChangeText={setIntention}
        />
        <Button title="Create" disabled={!intention} onPress={onSubmit} />
      </View>
    </PageWrapper>
  );
};

export default CreateIntention;
