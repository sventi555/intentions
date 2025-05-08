import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const AuthLayout: React.FC = () => {
  return (
    <SafeAreaView>
      <Slot />
    </SafeAreaView>
  );
};

export default AuthLayout;
