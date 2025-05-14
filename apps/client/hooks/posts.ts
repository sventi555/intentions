import { API_HOST } from '@/config';
import { collections, docs } from '@/db';
import { blobToBase64 } from '@/utils/blob';
import { CreatePostBody, UpdatePostBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuthUser } from './auth';

export const usePost = (postId: string) => {
  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!postId,
    queryKey: postQueryKey({ id: postId! }),
    queryFn: async () => (await getDoc(docs.post(postId!))).data(),
  });

  return { post, isLoading, isError };
};

export const useFeedPosts = () => {
  const user = useAuthUser();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!user,
    queryKey: feedQueryKey(),
    queryFn: async () => {
      const feedPostsQuery = query(
        collections.feed(user!.uid),
        orderBy('createdAt', 'desc'),
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
    queryKey: postsQueryKey({ ownerId: userId }),
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

export const useIntentionPosts = (
  ownerId: string | undefined,
  intentionId: string,
) => {
  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!ownerId,
    queryKey: postsQueryKey({ ownerId: ownerId, intentionId: intentionId }),
    queryFn: async () =>
      (
        await getDocs(
          query(
            collections.posts(),
            where('userId', '==', ownerId), // needed to get past security rules
            where('intentionId', '==', intentionId),
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
      let image: string | undefined = undefined;
      if (vars.image) {
        image = await fetch(vars.image)
          .then((res) => res.blob())
          .then(blobToBase64);
      }

      const idToken = await user?.getIdToken();
      await fetch(`${API_HOST}/posts`, {
        method: 'POST',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...vars, image }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey() });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey({ ownerId: user?.uid }),
      });

      onSuccess();
    },
    onError: () => {},
  });

  return createPost;
};

export const useUpdatePost = ({ onSettled }: { onSettled: () => void }) => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: updatePost } = useMutation({
    mutationFn: async (vars: { postId: string; data: UpdatePostBody }) => {
      const idToken = await user?.getIdToken();

      await fetch(`${API_HOST}/posts/${vars.postId}`, {
        method: 'PATCH',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars.data),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey() });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey({ ownerId: user?.uid }),
      });
      queryClient.invalidateQueries({
        queryKey: postQueryKey({ id: vars.postId }),
      });
    },
    onSettled: () => {
      onSettled();
    },
  });

  return updatePost;
};

export const useDeletePost = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: deletePost } = useMutation({
    mutationFn: async (vars: { postId: string }) => {
      const idToken = await user?.getIdToken();

      await fetch(`${API_HOST}/posts/${vars.postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: idToken ?? '',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedQueryKey() });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey({ ownerId: user?.uid }),
      });
    },
  });

  return deletePost;
};

const postQueryKey = (subKeys: {
  id: string;
  // ownerId: string
}) => ['post', ...Object.entries(subKeys)];

export const feedQueryKey = () => ['feed'];

export const postsQueryKey = (subKeys: {
  ownerId: string | undefined;
  intentionId?: string;
}) => ['posts', ...Object.entries(subKeys)];
