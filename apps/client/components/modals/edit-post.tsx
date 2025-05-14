import { useEditPost } from '@/context/edit-post';
import { usePost } from '@/hooks/posts';
import { Post } from '@lib';
import { useState } from 'react';
import { Button, Modal, Text, TextInput, View } from 'react-native';

export const EditPostModal: React.FC<{ postId: string }> = ({ postId }) => {
  const { post } = usePost(postId);

  return (
    <Modal visible={true} transparent={true}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          padding: 8,
          backgroundColor: '#00000060',
        }}
      >
        <View
          style={{
            width: '100%',
            backgroundColor: 'white',
            padding: 8,
            borderRadius: 4,
          }}
        >
          {post ? <EditPostModalContent post={post} /> : null}
        </View>
      </View>
    </Modal>
  );
};

const EditPostModalContent: React.FC<{ post: Post }> = ({ post }) => {
  const editPost = useEditPost();
  const [description, setDescription] = useState(post.description);

  return (
    <View>
      <Text style={{ textDecorationLine: 'underline' }}>Edit post</Text>
      <Text>Description:</Text>
      <TextInput
        value={description}
        onChangeText={(val) => setDescription(val)}
      />
      <View style={{ flexDirection: 'row' }}>
        <Button title="Cancel" color="gray" onPress={editPost.cancelEdit} />
        <Button
          title="Save"
          onPress={() => editPost.saveEdit({ description })}
        />
      </View>
    </View>
  );
};
