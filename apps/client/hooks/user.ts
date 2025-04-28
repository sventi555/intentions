import { auth } from '@/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export const useUser = () => {
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
