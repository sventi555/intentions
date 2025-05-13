import Profile from '@/components/profile';
import { useAuthUser } from '@/hooks/auth';

const MyProfile = () => {
  const user = useAuthUser();

  if (!user) {
    return null;
  }

  return <Profile userId={user.uid} />;
};

export default MyProfile;
