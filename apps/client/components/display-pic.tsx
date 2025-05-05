import { useDownloadUrl } from '@/hooks/storage';
import { Image } from 'expo-image';

interface DisplayPicProps {
  user: {
    image?: string;
  };
  size?: number;
}
export const DisplayPic: React.FC<DisplayPicProps> = ({ user, size }) => {
  const { url } = useDownloadUrl(user.image);

  return (
    <Image
      source={url ?? require('../assets/images/profile-placeholder.png')}
      style={{ width: size ?? 24, height: size ?? 24, borderRadius: '100%' }}
    />
  );
};
