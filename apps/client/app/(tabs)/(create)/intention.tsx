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
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <View style={{ width: 256, gap: 8 }}>
        <Input
          placeholder="Write an intention"
          centered={true}
          value={intention}
          onChange={setIntention}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="Cancel" color="gray" onPress={() => router.back()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Create" disabled={!intention} onPress={onSubmit} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CreateIntention;
