import { auth } from '@/config/firebase';
import { docs } from '@/db';
import { useQuery } from '@tanstack/react-query';
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
