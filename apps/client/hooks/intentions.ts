import { collections } from '@/db';
import { CreateIntentionBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, query, where } from 'firebase/firestore';
import { useAuthUser } from './user';

const userIntentionsQueryKey = (userId: string | undefined) => [
  'intentions',
  userId,
];
export const useUserIntentions = (userId: string | undefined) => {
  const {
    data: intentions,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: userIntentionsQueryKey(userId),
    queryFn: async () => {
      return (
        await getDocs(
          query(collections.intentions(), where('userId', '==', userId)),
        )
      ).docs;
    },
  });

  return { intentions, isLoading, isError };
};

export const useCreateIntention = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: createIntention } = useMutation({
    mutationFn: async (vars: CreateIntentionBody) => {
      const idToken = await user?.getIdToken();
      await fetch(`${process.env.EXPO_PUBLIC_API_HOST}/intentions`, {
        method: 'POST',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['intentions', user?.uid],
      });
      onSuccess();
    },
  });

  return createIntention;
};
