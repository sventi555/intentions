import { TextArea } from '@/components/text-area';
import { useAuthUser } from '@/hooks/auth';
import { useUserIntentions } from '@/hooks/intentions';
import { useCreatePost } from '@/hooks/posts';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, Text, View } from 'react-native';

const CreatePost: React.FC = () => {
  const router = useRouter();
  const user = useAuthUser();

  const [intentionId, setIntentionId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const { intentions } = useUserIntentions(user?.uid, {
    by: 'createdAt',
    dir: 'desc',
  });
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
      router.navigate('/(tabs)/(feed)');
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
    <View style={{ padding: 8, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text>Intention:</Text>
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
        </View>
        <Link href="/(tabs)/(create)/intention">
          <FontAwesome name="plus-square-o" size={16} />
        </Link>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
        {image ? (
          <Image source={image} style={{ width: '100%', aspectRatio: 1 }} />
        ) : (
          <>
            <Pressable onPress={pickImage}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="image" size={28} />
              </View>
            </Pressable>
            <Text>Add image</Text>
          </>
        )}
      </View>

      <TextArea
        numberOfLines={4}
        placeholder="Add a description"
        onChange={setDescription}
        value={description}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button title="discard" onPress={resetState} color="gray" />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="post" disabled={!valid} onPress={onSubmit} />
        </View>
      </View>
    </View>
  );
};

export default CreatePost;
