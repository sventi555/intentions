import { useAuthUser } from '@/hooks/auth';
import { useUserIntentions } from '@/hooks/intentions';
import { useCreatePost } from '@/hooks/posts';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

const CreatePost = () => {
  const router = useRouter();
  const user = useAuthUser();

  const [intentionId, setIntentionId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const { intentions } = useUserIntentions(user?.uid);
  const selectedIntentionId = intentionId || intentions?.[0]?.id;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const resetState = () => {
    setDescription('');
    setImage(null);
    setIntentionId('');
  };

  const createPost = useCreatePost({
    onSuccess: () => {
      resetState();
      router.back();
    },
  });

  const onSubmit = async () => {
    if (!valid) {
      return;
    }

    await createPost({
      intentionId: selectedIntentionId,
      description,
      ...(image ? { image } : {}),
    });
  };

  const valid = selectedIntentionId && (image || description);

  return (
    <View style={{ gap: 8 }}>
      <Picker
        onValueChange={(val) => setIntentionId(val)}
        selectedValue={intentionId}
      >
        {intentions?.map((intention) => (
          <Picker.Item
            key={intention.id}
            label={intention.data().name}
            value={intention.id}
          />
        ))}
      </Picker>
      <Link href="/(tabs)/(create)/intention">+ Create intention</Link>
      <Button title="upload image" onPress={pickImage} />
      {image && (
        <Image source={image} style={{ width: '100%', aspectRatio: 1 }} />
      )}
      <TextInput
        placeholder="Add a description"
        multiline
        style={{ borderWidth: 1, height: 60 }}
        onChangeText={setDescription}
        value={description}
      />
      <Button title="post" disabled={!valid} onPress={onSubmit} />
    </View>
  );
};

export default CreatePost;
