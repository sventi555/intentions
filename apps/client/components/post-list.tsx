import { Post as _Post } from '@lib';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import { Post } from './post';

interface PostListProps {
  posts: QueryDocumentSnapshot<_Post, _Post>[] | undefined;
  Header?: ReactElement;
}

export const PostList: React.FC<PostListProps> = ({ Header, posts }) => {
  return (
    <FlatList
      ListHeaderComponent={Header}
      data={posts}
      renderItem={({ item }) => <Post id={item.id} data={item.data()} />}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => (
        <View
          style={{ height: 1, backgroundColor: 'lightgray', marginVertical: 8 }}
        />
      )}
    />
  );
};
