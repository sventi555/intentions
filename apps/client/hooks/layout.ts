import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export const useLayout = () => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const layout = e.nativeEvent.layout;

    setWidth(layout.width);
    setHeight(layout.height);
  };

  return { width, height, onLayout };
};
