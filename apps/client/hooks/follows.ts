import { API_HOST } from '@/config';
import { collections, docs } from '@/db';
import { RemoveFollowBody, RespondToFollowBody } from '@lib';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useAuthUser } from './user';

export const useFollowsToUser = (userId: string | undefined) => {
  const {
    data: follows,
    isLoading,
    isError,
  } = useQuery({
    enabled: !!userId,
    queryKey: followsQueryKey({ to: userId }),
    queryFn: async () => {
      return (
        await getDocs(
          query(collections.follows(userId!), orderBy('createdAt', 'desc')),
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
    queryKey: followsQueryKey({ from, to }),
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
      await fetch(`${API_HOST}/follows/${userId}`, {
        method: 'POST',
        headers: { Authorization: idToken ?? '' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: followsQueryKey({ from: authUser?.uid }),
      });
      queryClient.invalidateQueries({
        queryKey: followsQueryKey({ to: userId }),
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
      await fetch(`${API_HOST}/follows/respond/${vars.userId}`, {
        method: 'POST',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars.data),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: followsQueryKey({ from: vars.userId }),
      });
      queryClient.invalidateQueries({
        queryKey: followsQueryKey({ to: authUser?.uid }),
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
      await fetch(`${API_HOST}/follows/${vars.userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: idToken ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars.data),
      });
    },
    onSuccess: (_, vars) => {
      const from = vars.data.direction === 'from' ? vars.userId : authUser?.uid;
      const to = vars.data.direction === 'to' ? vars.userId : authUser?.uid;

      queryClient.invalidateQueries({ queryKey: followsQueryKey({ from }) });
      queryClient.invalidateQueries({ queryKey: followsQueryKey({ to }) });
    },
  });

  return respondToFollow;
};

const followsQueryKey = (subKeys: {
  from?: string | undefined;
  to?: string | undefined;
}) => ['posts', ...Object.entries(subKeys)];
