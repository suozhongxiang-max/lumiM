# Safe Area 最佳实践

## 📚 背景知识

### 什么是 Safe Area？

Safe Area（安全区域）是指屏幕上不会被系统UI遮挡的区域，包括：

- **顶部**：刘海屏、状态栏、动态岛
- **底部**：Home Indicator（iOS）
- **左右**：折叠屏、圆角屏幕

### 为什么需要 Safe Area？

```
┌─────────────────────────┐
│   ⚫ 刘海屏 / 状态栏      │ ← 系统UI会遮挡内容
├─────────────────────────┤
│                         │
│   Safe Area（安全区域）   │ ← 这里的内容不会被遮挡
│                         │
├─────────────────────────┤
│   ━━━━━━━━━━━━━━━━━     │ ← Home Indicator
└─────────────────────────┘
```

---

## 🎯 React Native 中的处理方式

### 1️⃣ 传统方式（React Navigation）

```typescript
// ✅ 可以在顶层统一包裹
import { SafeAreaView } from 'react-native-safe-area-context';

<NavigationContainer>
  <SafeAreaView style={{ flex: 1 }}>
    <Stack.Navigator>
      {/* 所有页面自动有安全区域 */}
    </Stack.Navigator>
  </SafeAreaView>
</NavigationContainer>
```

### 2️⃣ Expo Router 方式（本项目）

```typescript
// ❌ 无法在顶层统一包裹
// Expo Router 是文件路由系统，每个页面是独立文件

// ✅ 需要每个页面自己处理
export default function MyScreen() {
  const { top } = useSafeAreaInsets();
  return <View style={{ paddingTop: top }}>...</View>
}
```

---

## 🛠️ 本项目的解决方案

### 创建 `ScreenWrapper` 组件

我们创建了一个可复用的包裹组件，封装了 Safe Area 的处理逻辑：

```typescript
// components/screen-wrapper/index.tsx
export function ScreenWrapper({
  children,
  edges = ['top']
}) {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
```

### 使用方式

#### ✅ 基础使用（推荐）

```typescript
export default function CreateScreen() {
  return (
    <ScreenWrapper>
      {/* 自动处理顶部安全区域 */}
      <View>内容</View>
    </ScreenWrapper>
  );
}
```

#### 🎨 全屏页面（不需要安全区域）

```typescript
export default function FullScreenImage() {
  return (
    <ScreenWrapper edges={[]}>
      {/* 内容延伸到屏幕边缘 */}
      <Image source={...} />
    </ScreenWrapper>
  );
}
```

#### 🔧 自定义安全区域边缘

```typescript
export default function ModalScreen() {
  return (
    <ScreenWrapper edges={['top', 'bottom', 'left', 'right']}>
      {/* 四个边都有安全区域 */}
      <View>内容</View>
    </ScreenWrapper>
  );
}
```

---

## 📋 `edges` 参数说明

`edges` 控制哪些边需要安全区域：

```typescript
edges?: Edge[] = ['top', 'bottom', 'left', 'right']
```

### 常见配置：

| 配置                | 说明         | 使用场景                            |
| ------------------- | ------------ | ----------------------------------- |
| `['top']`           | 只处理顶部   | **Tab 页面**（底部由 Tab Bar 处理） |
| `['top', 'bottom']` | 顶部和底部   | 全屏页面、模态框                    |
| `[]`                | 不处理任何边 | 全屏图片、视频                      |
| `['left', 'right']` | 左右边缘     | 横屏内容                            |

---

## 🎯 本项目的使用规范

### Tab 页面

```typescript
// ✅ 使用 ScreenWrapper，只处理顶部
<ScreenWrapper edges={['top']}>
  {/* Tab Bar 会自动处理底部安全区域 */}
</ScreenWrapper>
```

### 有导航栏的页面

```typescript
// ✅ 不需要 ScreenWrapper
// Stack.Screen 会自动处理
export default function TaskDetailScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '任务详情' }} />
      <View>{/* 内容 */}</View>
    </>
  );
}
```

### 全屏页面

```typescript
// ✅ 使用 edges={[]} 让内容延伸到边缘
<ScreenWrapper edges={[]}>
  <Image style={{ width: '100%', height: '100%' }} />
</ScreenWrapper>
```

---

## 💡 优势对比

### 之前（手动处理）

```typescript
// ❌ 每个页面都要写这些代码
const { topInset } = useSafeAreaInsets();
return (
  <View style={{ flex: 1, paddingTop: topInset }}>
    ...
  </View>
);
```

### 现在（使用 ScreenWrapper）

```typescript
// ✅ 一行搞定
return (
  <ScreenWrapper>
    ...
  </ScreenWrapper>
);
```

---

## 🔄 迁移指南

如果现有页面使用了手动处理，可以这样迁移：

### 迁移前

```typescript
export default function MyScreen() {
  const { topInset } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: topInset, backgroundColor: '#fff' }}>
      <View>内容</View>
    </View>
  );
}
```

### 迁移后

```typescript
export default function MyScreen() {
  return (
    <ScreenWrapper backgroundColor="#fff">
      <View>内容</View>
    </ScreenWrapper>
  );
}
```

---

## 📌 注意事项

1. **Tab 页面默认只需要 `edges={['top']}`**
   - 底部由 Tab Bar 自动处理

2. **有 Stack.Screen 导航栏的页面不需要 ScreenWrapper**
   - 系统会自动处理安全区域

3. **全屏内容使用 `edges={[]}`**
   - 图片、视频等需要延伸到边缘的内容

4. **ScreenWrapper 自动适配主题**
   - 默认背景色跟随系统主题（亮/暗模式）

---

## 🎓 总结

**Expo Router 的设计理念：**

- ❌ 不是在顶层统一处理
- ✅ 每个页面独立控制，更灵活

**我们的解决方案：**

- ✅ 创建 `ScreenWrapper` 组件
- ✅ 统一接口，简化使用
- ✅ 灵活配置，满足各种场景

这样既保持了灵活性，又避免了重复代码！🎉
