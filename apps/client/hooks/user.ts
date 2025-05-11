import { API_HOST, auth } from '@/config';
import { docs } from '@/db';
import { blobToBase64 } from '@/utils/blob';
import { UpdateUserBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
    });
  }, []);

  return user;
};

export const useUser = (userId: string | undefined) => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: ['user', userId],
    queryFn: async () => {
      return (await getDoc(docs.user(userId!))).data();
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
      queryClient.invalidateQueries({ queryKey: ['user', authUser?.uid] });
      queryClient.invalidateQueries({
        queryKey: ['posts', { user: authUser?.uid }],
      });
      queryClient.invalidateQueries({ queryKey: ['feed', authUser?.uid] });
    },
  });

  return updateUser;
};
