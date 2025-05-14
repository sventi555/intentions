import { API_HOST } from '@/config';
import { collections, docs } from '@/db';
import { CreateIntentionBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuthUser } from './auth';

export const useIntention = (intentionId: string) => {
  const {
    data: intention,
    isLoading,
    isError,
  } = useQuery({
    queryKey: intentionQueryKey({ id: intentionId }),
    queryFn: async () => {
      return (await getDoc(docs.intention(intentionId))).data();
    },
  });

  return { intention, isLoading, isError };
};

export const useUserIntentions = (userId: string | undefined) => {
  const {
    data: intentions,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: userIntentionsQueryKey({ ownerId: userId }),
    queryFn: async () => {
      return (
        await getDocs(
          query(
            collections.intentions(),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
          ),
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
      await fetch(`${API_HOST}/intentions`, {
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
        queryKey: userIntentionsQueryKey({ ownerId: user?.uid }),
      });
      onSuccess();
    },
  });

  return createIntention;
};

const intentionQueryKey = (subKeys: {
  id: string;
  // ownerId: string | undefined;
}) => ['intention', ...Object.entries(subKeys)];

const userIntentionsQueryKey = (subKeys: { ownerId: string | undefined }) => [
  'intentions',
  ...Object.entries(subKeys),
];
