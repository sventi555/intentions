import { useDownloadUrl } from '@/hooks/storage';
import { Image } from 'expo-image';

interface DisplayPicProps {
  user: {
    image?: string;
  };
  size?: number;
}

export const DisplayPic: React.FC<DisplayPicProps> = ({ user, size = 24 }) => {
  const { url } = useDownloadUrl(user.image);

  return (
    <Image
      source={url ?? require('../assets/images/profile-placeholder.png')}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
};
