import { collections, docs } from '@/db';
import { RemoveFollowBody, RespondToFollowBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useAuthUser } from './user';

export const useFollowsToUser = (userId: string | undefined) => {
  const {
    data: follows,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: ['follows', { to: userId }],
    queryFn: async () => {
      return (
        await getDocs(
          query(
            collections.follows(userId!),
            orderBy('createdAt', 'desc'),
            limit(10),
          ),
        )
      ).docs;
    },
  });

  return { follows, isLoading, isError };
};

export const useFollow = ({
  from,
  to,
}: {
  from: string | undefined;
  to: string;
}) => {
  const {
    data: follow,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!from,
    queryKey: ['follows', { from }, { to }],
    queryFn: async () => {
      const follow = await getDoc(docs.follow(to, from!));
      return follow.data() ?? null;
    },
  });

  return { follow, isLoading, isError };
};

export const useFollowUser = (userId: string) => {
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: followUser } = useMutation({
    mutationFn: async () => {
      const idToken = await authUser?.getIdToken();
      await fetch(`${process.env.EXPO_PUBLIC_API_HOST}/follows/${userId}`, {
        method: 'POST',
        headers: { Authorization: idToken ?? '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follows', { from: authUser?.uid }],
      });
      queryClient.invalidateQueries({
        queryKey: ['follows', { to: userId }],
      });
    },
  });

  return followUser;
};

export const useRespondToFollow = () => {
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: respondToFollow } = useMutation({
    mutationFn: async (vars: { userId: string; data: RespondToFollowBody }) => {
      const idToken = await authUser?.getIdToken();
      await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/follows/respond/${vars.userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: idToken ?? '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vars.data),
        },
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['follows', { from: vars.userId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['follows', { to: authUser?.uid }],
      });
    },
  });

  return respondToFollow;
};

export const useRemoveFollow = () => {
  const authUser = useAuthUser();
  const queryClient = useQueryClient();

  const { mutateAsync: respondToFollow } = useMutation({
    mutationFn: async (vars: { userId: string; data: RemoveFollowBody }) => {
      const idToken = await authUser?.getIdToken();
      await fetch(
        `${process.env.EXPO_PUBLIC_API_HOST}/follows/${vars.userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: idToken ?? '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vars.data),
        },
      );
    },
    onSuccess: (_, vars) => {
      const from = vars.data.direction === 'from' ? vars.userId : authUser?.uid;
      const to = vars.data.direction === 'to' ? vars.userId : authUser?.uid;

      queryClient.invalidateQueries({ queryKey: ['follows', { from }] });
      queryClient.invalidateQueries({ queryKey: ['follows', { to }] });
    },
  });

  return respondToFollow;
};
