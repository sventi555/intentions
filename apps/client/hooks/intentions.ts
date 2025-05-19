import { API_HOST } from '@/config';
import { collections, docs } from '@/db';
import { CreateIntentionBody, Intention } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDoc,
  getDocs,
  orderBy,
  OrderByDirection,
  query,
  where,
} from 'firebase/firestore';
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

export const INTENTION_ORDER_FIELDS = [
  'updatedAt',
  'name',
  'postCount',
] as const satisfies (keyof Intention)[];
export type IntentionOrderField = (typeof INTENTION_ORDER_FIELDS)[number];

export interface UserIntentionsOrder {
  by: IntentionOrderField;
  dir: OrderByDirection;
}

export const useUserIntentions = (
  userId: string | undefined,
  order: UserIntentionsOrder = { by: 'name', dir: 'desc' },
) => {
  const {
    data: intentions,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: userIntentionsQueryKey({ ownerId: userId, order }),
    queryFn: async () => {
      return (
        await getDocs(
          query(
            collections.intentions(),
            where('userId', '==', userId),
            orderBy(order.by, order.dir),
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

const userIntentionsQueryKey = (subKeys: {
  ownerId: string | undefined;
  order?: UserIntentionsOrder;
}) => ['intentions', ...Object.entries(subKeys)];
