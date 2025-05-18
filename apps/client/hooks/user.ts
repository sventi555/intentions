import { API_HOST } from '@/config';
import { docs } from '@/db';
import { blobToBase64 } from '@/utils/blob';
import { UpdateUserBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc } from 'firebase/firestore';
import { useAuthUser } from './auth';
import { feedQueryKey, postsQueryKey } from './posts';

export const useUser = (userId: string | undefined) => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: userQueryKey(userId),
    queryFn: async () => {
      return (await getDoc(docs.user(userId!))).data() ?? null;
    },
  });

  return { user, isLoading, isError };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  const { mutateAsync: updateUser } = useMutation({
    mutationFn: async (vars: UpdateUserBody) => {
      let image: string | undefined = undefined;
      if (vars.image) {
        image = await fetch(vars.image)
          .then((res) => res.blob())
          .then(blobToBase64);
      }

      const idToken = await authUser?.getIdToken();
      await fetch(`${API_HOST}/users`, {
        method: 'PATCH',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...vars, image }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey(authUser?.uid) });
      queryClient.invalidateQueries({
        queryKey: postsQueryKey({ ownerId: authUser?.uid }),
      });
      queryClient.invalidateQueries({ queryKey: feedQueryKey() });
    },
  });

  return updateUser;
};

const userQueryKey = (userId: string | undefined) => ['user', userId];
