import { storage } from '@/config';
import { useQuery } from '@tanstack/react-query';
import { getDownloadURL, ref } from 'firebase/storage';

export const useDownloadUrl = (path: string | undefined) => {
  const {
    data: url,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!path,
    queryKey: ['storage-url', path],
    queryFn: async () => {
      return getDownloadURL(ref(storage, path));
    },
  });

  return { url, isLoading, isError };
};
