export interface User {
  email: string;
  username: string;
  private: boolean;
}

export type FollowStatus = 'pending' | 'accepted';

export interface Follow {
  status: FollowStatus;
  fromUser: Pick<User, 'username'>;
  createdAt: number;
}

export interface Intention {
  userId: string;
  name: string;
  createdAt: number;
}

export interface Post {
  userId: string;
  user: Pick<User, 'username'>;
  intentionId: string;
  intention: Pick<Intention, 'name'>;
  createdAt: number;
  description?: string;
  image?: string;
}
