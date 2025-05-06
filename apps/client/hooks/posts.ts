import { collections } from '@/db';
import { CreatePostBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useAuthUser } from './user';

export const useFeedPosts = () => {
  const user = useAuthUser();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!user,
    queryKey: ['feed', user?.uid],
    queryFn: async () => {
      const feedPostsQuery = query(
        collections.feed(user!.uid),
        orderBy('createdAt', 'desc'),
        limit(10),
      );

      return (await getDocs(feedPostsQuery)).docs;
    },
  });

  return { posts, isLoading, isError };
};

export const useUserPosts = (userId: string | undefined) => {
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: ['posts', userId],
    queryFn: async () =>
      (
        await getDocs(
          query(
            collections.posts(),
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
      queryClient.invalidateQueries({ queryKey: ['feed', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['posts', user?.uid] });
      onSuccess();
    },
  });

  return createPost;
};
