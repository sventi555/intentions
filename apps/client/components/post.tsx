import { useEditPost } from '@/context/edit-post';
import { useAuthUser } from '@/hooks/auth';
import { useIntentionPath, useProfilePath } from '@/hooks/navigation';
import { useDeletePost } from '@/hooks/posts';
import { useDownloadUrl } from '@/hooks/storage';
import { dayjs } from '@/utils/time';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Post as _Post } from '@lib';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { DisplayPic } from './display-pic';

export interface PostProps {
  id: string;
  data: _Post;
}

export const Post: React.FC<PostProps> = (props) => {
  const {
    userId,
    intentionId,
    image,
    user,
    createdAt,
    intention,
    description,
  } = props.data;

  const profilePath = useProfilePath(userId);
  const intentionPath = useIntentionPath(intentionId);
  const { url: imageUrl } = useDownloadUrl(image);
  const authUser = useAuthUser();

  const editPost = useEditPost();
  const deletePost = useDeletePost();

  return (
    <View style={{ borderRadius: 8, borderWidth: 1, padding: 8, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <DisplayPic user={user} />
          {profilePath ? <Link href={profilePath}>{user.username}</Link> : null}
          <Text style={{ color: 'grey' }}>{dayjs(createdAt).fromNow()}</Text>
        </View>
        {/* hide whole thing for now until non owner actions added */}
        {authUser?.uid === userId ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger style={{ borderWidth: 0, outlineWidth: 0 }}>
              <FontAwesome name="ellipsis-v" size={16} color="black" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              style={{
                backgroundColor: '#DDDDDDDD',
                padding: 4,
                borderRadius: 4,
              }}
              align="end"
            >
              <DropdownMenu.Item
                onSelect={() => editPost.startEdit(props.id)}
                key="edit"
                style={{ outlineWidth: 0 }}
              >
                <Text selectable={false}>Edit</Text>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => deletePost({ postId: props.id })}
                key="delete"
                style={{ outlineWidth: 0 }}
              >
                <Text selectable={false}>Delete</Text>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : null}
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
          {intention.name}
        </Link>
      ) : null}
      {imageUrl ? (
        <Image source={imageUrl} style={{ width: '100%', aspectRatio: 1 }} />
      ) : null}
      {description ? <Text>{description}</Text> : null}
    </View>
  );
};
