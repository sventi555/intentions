import { storage } from '@/config/firebase';
import { dayjs } from '@/utils/time';
import { Image } from 'expo-image';
import { getDownloadURL, ref } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface PostProps {
  userId: string;
  user: {
    username: string;
  };
  createdAt: number;
  intentionId: string;
  intention: {
    name: string;
  };
  image?: string;
  description?: string;
}

export const Post: React.FC<PostProps> = (props) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (props.image) {
      getDownloadURL(ref(storage, props.image))
        .then((url) => setImageUrl(url))
        .catch(() => {});
    }
  }, [props.image]);

  return (
    <View style={{ borderRadius: 8, borderWidth: 1, padding: 8, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text>DP</Text>
        <Text>{props.user.username}</Text>
        <Text style={{ color: 'grey' }}>
          {dayjs(props.createdAt).fromNow()}
        </Text>
      </View>
      <Text
        style={{
          borderWidth: 1,
          padding: 4,
          alignSelf: 'flex-start',
          borderRadius: 8,
        }}
      >
        {props.intention.name}
      </Text>
      {imageUrl ? (
        <Image source={imageUrl} style={{ width: '100%', aspectRatio: 1 }} />
      ) : null}
      {props.description ? <Text>{props.description}</Text> : null}
    </View>
  );
};
