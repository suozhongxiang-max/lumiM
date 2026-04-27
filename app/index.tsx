/**
 * 应用入口页面
 * 直接重定向到发现页
 */

import { Redirect } from 'expo-router';

/**
 * 入口页面组件
 * 重定向到 Tabs 导航的发现页
 */
export default function Index() {
  // 直接重定向到发现页
  // 发现页是应用的主入口，未登录用户也可以浏览模型
  return <Redirect href="/(tabs)/discover" />;
}
