export interface User {
  email: string;
  username: string;
  image?: string;
}

export type FollowStatus = 'pending' | 'accepted';

export interface Follow {
  status: FollowStatus;
}

export interface Intention {
  userId: string;
  user: Pick<User, 'username'>;
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

export interface FollowNotification {
  kind: 'follow';
  data: {
    fromUserId: string;
    fromUser: Pick<User, 'username' | 'image'>;
    toUserId: string;
    toUser: Pick<User, 'username' | 'image'>;
    status: FollowStatus;
  };
  createdAt: number;
}

export type Notification = FollowNotification;
