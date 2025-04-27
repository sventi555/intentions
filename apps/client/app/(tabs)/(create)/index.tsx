import { PageWrapper } from '@/components/page-wrapper';
import { db } from '@/config/firebase';
import { useUser } from '@/hooks/user';
import { CreatePostBody } from '@lib';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';

const CreatePost = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUser();

  const [intentionId, setIntentionId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const { data: intentions } = useQuery({
    queryKey: ['intentions', user?.uid],
    queryFn: async () => {
      return (
        await getDocs(
          query(collection(db, 'intentions'), where('userId', '==', user?.uid)),
        )
      ).docs;
    },
  });
  const selectedIntentionId = intentionId || intentions?.[0]?.id;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
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

  const { mutateAsync: addPost } = useMutation({
    mutationFn: async (vars: CreatePostBody) => {
      const idToken = await user?.getIdToken();
      await fetch(`${process.env.EXPO_PUBLIC_API_HOST}/posts`, {
        method: 'POST',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars),
      });
    },
  });

  const onSubmit = async () => {
    if (!valid) {
      return;
    }

    await addPost({
      intentionId: selectedIntentionId,
      description,
      ...(image ? { image } : {}),
    });

    await queryClient.invalidateQueries({ queryKey: ['feed', user?.uid] });
    resetState();

    router.back();
  };

  const valid = selectedIntentionId && (image || description);

  return (
    <PageWrapper>
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
    </PageWrapper>
  );
};

export default CreatePost;
