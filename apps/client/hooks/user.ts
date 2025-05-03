import { auth, db } from '@/config/firebase';
import { useQuery } from '@tanstack/react-query';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
      return (await getDoc(doc(db, `users/${userId}`))).data();
    },
  });

  return { user, isLoading, isError };
};
