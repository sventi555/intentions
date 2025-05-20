export interface User {
  email: string;
  username: string;
  private: boolean;
  image?: string;
}

export type FollowStatus = 'pending' | 'accepted';

export interface Follow {
  status: FollowStatus;
  fromUser: Pick<User, 'username' | 'image'>;
  createdAt: number;
}

export interface Intention {
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  postCount: number;
}

export interface Post {
  userId: string;
  user: Pick<User, 'username' | 'image'>;
  intentionId: string;
  intention: Pick<Intention, 'name'>;
  createdAt: number;
  description?: string;
  image?: string;
}
