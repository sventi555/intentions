import { Input } from '@/components/text-input';
import { useCreateIntention } from '@/hooks/intentions';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, View } from 'react-native';

const CreateIntention: React.FC = () => {
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
    <View
      style={{
        gap: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <View style={{ width: 256 }}>
        <Input
          placeholder="Write an intention"
          centered={true}
          value={intention}
          onChange={setIntention}
        />
      </View>
      <View style={{ width: 200 }}>
        <Button title="Create" disabled={!intention} onPress={onSubmit} />
      </View>
    </View>
  );
};

export default CreateIntention;
