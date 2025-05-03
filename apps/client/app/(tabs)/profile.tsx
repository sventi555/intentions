import Profile from '@/components/profile';
import { useAuthUser } from '@/hooks/user';

const MyProfile = () => {
  const user = useAuthUser();

  return <Profile userId={user?.uid} />;
};

export default MyProfile;
