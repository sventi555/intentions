import { useIntentionPath, useProfilePath } from '@/hooks/navigation';
import { useDownloadUrl } from '@/hooks/storage';
import { dayjs } from '@/utils/time';
import { Post as _Post } from '@lib';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { DisplayPic } from './display-pic';

export interface PostProps extends _Post {}

export const Post: React.FC<PostProps> = (props) => {
  const profilePath = useProfilePath(props.userId);
  const intentionPath = useIntentionPath(props.intentionId);
  const { url: imageUrl } = useDownloadUrl(props.image);

  return (
    <View style={{ borderRadius: 8, borderWidth: 1, padding: 8, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <DisplayPic user={props.user} />
        {profilePath ? (
          <Link href={profilePath}>{props.user.username}</Link>
        ) : null}
        <Text style={{ color: 'grey' }}>
          {dayjs(props.createdAt).fromNow()}
        </Text>
      </View>
      {intentionPath ? (
        <Link
          style={{
            borderWidth: 1,
            padding: 4,
            alignSelf: 'flex-start',
            borderRadius: 8,
          }}
          href={intentionPath}
        >
          {props.intention.name}
        </Link>
      ) : null}
      {imageUrl ? (
        <Image source={imageUrl} style={{ width: '100%', aspectRatio: 1 }} />
      ) : null}
      {props.description ? <Text>{props.description}</Text> : null}
    </View>
  );
};
