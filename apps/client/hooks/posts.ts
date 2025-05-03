import { db } from '@/config/firebase';
import { CreatePostBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useAuthUser } from './user';

const feedPostsQueryKey = (userId: string | undefined) => ['feed', userId];
export const useFeedPosts = () => {
  const user = useAuthUser();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!user,
    queryKey: feedPostsQueryKey(user?.uid),
    queryFn: async () => {
      const feedPostsQuery = query(
        collection(db, `/users/${user?.uid}/feed`),
        orderBy('createdAt', 'desc'),
        limit(10),
      );

      return (await getDocs(feedPostsQuery)).docs;
    },
  });

  return { posts, isLoading, isError };
};

const userPostsQueryKey = (userId: string | undefined) => [
  'user-posts',
  userId,
];
export const useUserPosts = (userId: string | undefined) => {
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: userPostsQueryKey(userId),
    queryFn: async () =>
      (
        await getDocs(
          query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
          ),
        )
      ).docs,
  });

  return { posts, isLoading, isError };
};

export const useCreatePost = ({ onSuccess }: { onSuccess: () => void }) => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: createPost } = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedPostsQueryKey(user?.uid) });
      queryClient.invalidateQueries({ queryKey: userPostsQueryKey(user?.uid) });
      onSuccess();
    },
  });

  return createPost;
};
