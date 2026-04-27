/**
 * 3D 查看器配置
 * 定义渲染、灯光、相机等参数
 */

export const ViewerConfig = {
  /**
   * 相机配置
   */
  camera: {
    fov: 75, // 视野角度
    near: 0.1, // 近裁剪面
    far: 1000, // 远裁剪面
    defaultPosition: { x: 0, y: 0, z: 5 }, // 默认位置
  },

  /**
   * 灯光配置
   */
  lighting: {
    // 环境光
    ambient: {
      color: 0xffffff,
      intensity: 0.6,
    },
    // 定向光
    directional: {
      color: 0xffffff,
      intensity: 0.8,
      position: { x: 10, y: 10, z: 5 },
    },
  },

  /**
   * 场景配置
   */
  scene: {
    backgroundColor: 0xf0f0f0, // 浅灰色背景
  },

  /**
   * 渲染配置
   */
  renderer: {
    targetFPS: 60, // 目标帧率
    antialias: true, // 抗锯齿
  },

  /**
   * 手势配置
   */
  gestures: {
    rotation: {
      enabled: true,
      sensitivity: 0.005, // 旋转灵敏度
    },
    zoom: {
      enabled: true,
      min: 0.5, // 最小缩放
      max: 5.0, // 最大缩放
      sensitivity: 0.01, // 缩放灵敏度
    },
  },

  /**
   * 性能配置
   */
  performance: {
    // 模型大小限制（字节）
    maxModelSize: {
      ios: 50 * 1024 * 1024, // 50MB
      android: 30 * 1024 * 1024, // 30MB
      default: 40 * 1024 * 1024, // 40MB
    },
    // 最大多边形数量
    maxPolygons: 100000,
  },

  /**
   * 加载配置
   */
  loading: {
    timeout: 240000, // 超时
    showProgress: true,
    showPlaceholder: true,
  },
} as const;

export type ViewerConfigType = typeof ViewerConfig;
