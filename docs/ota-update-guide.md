# OTA 更新使用指南

本项目使用 **Expo EAS Update** 实现 Android 应用的热更新（OTA），无需通过应用商店即可推送更新。

## 功能特性

- ✅ 自动检查更新（应用启动时）
- ✅ 手动检查更新（设置页面）
- ✅ 静默下载更新
- ✅ 支持更新通道（dev/staging/production）
- ✅ 详细日志记录

## 发布更新流程

### 1. 登录 Expo 账号

```bash
npx expo login
```

### 2. 发布更新

```bash
# 发布到默认分支（production）
eas update --auto

# 发布到指定分支
eas update --branch production --auto

# 发布到指定分支并附带自定义消息
eas update --branch production --message "修复了登录问题"

# 发布到开发分支
eas update --branch dev --auto
```

### 3. 查看更新历史

```bash
# 查看所有更新分支
eas update:branch:list

# 查看指定分支的更新历史
eas update:list --branch production
```

## 更新分支策略

| 分支 | 用途 | 使用场景 |
|------|------|----------|
| `production` | 生产环境 | 正式发布给用户的更新 |
| `dev` | 开发环境 | 内部测试版本 |
| `staging` | 预发布环境 | 发布前的最后测试 |

## 更新类型

### 支持的更新

- ✅ JavaScript 代码变更
- ✅ UI 样式调整
- ✅ 业务逻辑修改
- ✅ 资源文件更新（图片、字体等）
- ✅ 配置文件修改

### 不支持的更新

- ❌ 原生代码变更（需要重新构建）
- ❌ `app.json` 配置修改
- ❌ 新增原生模块依赖
- ❌ 权限修改

## 使用示例

### 在设置页面添加"检查更新"按钮

```tsx
import { OtaUpdateButton } from '@/components/ota-update';

function SettingsScreen() {
  return (
    <View>
      <OtaUpdateButton onCheckComplete={(hasUpdate) => {
        console.log('检查完成，有更新:', hasUpdate);
      }} />
    </View>
  );
}
```

### 手动检查更新

```tsx
import { otaUpdateManager } from '@/utils/ota-update';

async function handleCheckUpdate() {
  // 带用户交互的检查
  await otaUpdateManager.checkAndPromptUpdate();
}
```

### 静默检查更新

```tsx
import { otaUpdateManager } from '@/utils/ota-update';

async function handleSilentUpdate() {
  const hasUpdate = await otaUpdateManager.silentUpdate();
  if (hasUpdate) {
    console.log('更新已下载');
  }
}
```

### 获取更新信息（调试用）

```tsx
import { otaUpdateManager } from '@/utils/ota-update';

async function getUpdateInfo() {
  const info = await otaUpdateManager.getUpdateInfo();
  console.log('更新信息:', info);
}
```

## 常见问题

### Q1: 更新发布后，用户端没有收到？

**A:** 检查以下几点：
1. 确认 `app.json` 中的 `projectId` 与 EAS 项目一致
2. 检查更新分支是否正确
3. 确认应用版本（`runtimeVersion`）是否匹配
4. 等待几分钟后重试检查

### Q2: 如何强制用户更新？

**A:** 目前 Expo Updates 不支持强制更新，但可以通过以下方式引导：
1. 在应用启动时检查版本，提示用户更新
2. 设置一个"必需版本"标记，旧版本限制功能使用

### Q3: 更新下载失败怎么办？

**A:** 更新下载失败不影响应用使用，下次启动会重试。常见原因：
- 网络连接问题
- 服务器返回错误
- 磁盘空间不足

### Q4: 如何回滚更新？

**A:** EAS Update 支持发布旧版本覆盖：
```bash
# 回滚到上一个版本
eas update --branch production --message "回滚更新"
```

### Q5: Android 和 iOS 可以使用同一个更新吗？

**A:** 可以，只要 `runtimeVersion` 相同，Android 和 iOS 可以共用同一个更新包。

## 配置说明

### app.json 配置

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/{projectId}"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

- `url`: EAS Update 服务器地址（自动生成）
- `runtimeVersion.policy`: 版本策略
  - `appVersion`: 使用 `app.json` 中的 `version` 字段
  - `sdkVersion`: 使用 Expo SDK 版本

### 环境变量配置

创建 `.env` 文件（可选）：

```bash
# 更新检查间隔（毫秒）
EXPO_PUBLIC_UPDATE_CHECK_INTERVAL=300000

# 是否启用自动更新
EXPO_PUBLIC_AUTO_UPDATE_ENABLED=true
```

## 调试技巧

### 查看当前更新信息

```bash
# 查看本地更新配置
eas update:configure

# 查看当前分支
eas update:branch:list
```

### 模拟更新流程

开发模式下 OTA 更新默认禁用，可以通过以下方式测试：

1. 使用 `--dev-client` 参数运行开发构建
2. 发布一个测试更新到 `dev` 分支
3. 在应用中手动检查更新

### 查看日志

应用会记录详细的更新日志，可通过以下方式查看：

```tsx
import { logger } from '@/utils/logger';

// 启用调试日志
logger.enableDebug();
```

## 安全建议

1. **使用 HTTPS**：确保更新服务器使用 HTTPS
2. **验证更新**：生产环境建议启用更新签名验证
3. **分阶段发布**：先发布给小部分用户，确认无问题后全量发布
4. **保留回滚方案**：始终保留可回滚的版本

## 参考链接

- [Expo Updates 官方文档](https://docs.expo.dev/eas-update/overview/)
- [EAS Update CLI 参考](https://docs.expo.dev/eas-update/command-reference/)
- [更新策略最佳实践](https://docs.expo.dev/eas-update/best-practices/)
