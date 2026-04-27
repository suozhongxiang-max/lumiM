import { ViewProps } from 'react-native';

export interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  shadow?: boolean; // 是否显示阴影
}
