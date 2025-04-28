import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export const PageWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          paddingVertical: 8,
          width: '100%',
          maxWidth: 600,
        }}
      >
        {children}
      </View>
    </View>
  );
};
