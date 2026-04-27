/**
 * 原生 3D 查看器 (expo-three)
 * 使用 expo-gl 和 Three.js 渲染 OBJ 模型
 */

import { GLView } from 'expo-gl';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
// @ts-ignore - OBJLoader 类型声明可能不完整
import { useModelLoader } from '@/hooks/use-model-loader';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ViewerProps } from '@/types/models/3d-viewer';
import { logger } from '@/utils/logger';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ErrorFallback } from '../components/error-fallback';
import { LoadingPlaceholder } from '../components/loading-placeholder';
import { ProgressBar } from '../components/progress-bar';

/**
 * 原生查看器实例方法接口
 */
export interface ObjViewerInstance {
  /** 重置相机视角 */
  resetCamera: () => void;
}

// 确保 THREE 在全局可用
if (typeof global !== 'undefined') {
  (global as any).THREE = (global as any).THREE || THREE;
}

export const ObjViewer = forwardRef<ObjViewerInstance, ViewerProps>(
  (
    {
      modelUrl,
      mtlUrl,
      modelColor, // 允许为 null（原始贴图）
      showGrid = false,
      showProgress = true,
      showPlaceholder = true,
      onLoad,
      onProgress,
      onError,
      style,
    },
    ref
  ) => {
    logger.info('Initializing ObjViewer component', mtlUrl);
    // 获取颜色主题
    const colorScheme = useColorScheme();
    const isDark = colorScheme.isDark;

    const [isGlReady, setIsGlReady] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false); // 新增：模型是否已加载到场景
    // 初始化 ref，提供 undefined 作为初始值
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const materialRef = useRef<THREE.MeshPhongMaterial | null>(null); // 保存当前单色材质引用
    const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map()); // 保存原始材质映射
    const gridHelpersRef = useRef<THREE.Object3D | null>(null); // 保存立体网格对象组

    // 手势状态
    const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4 }); // 相机的球面坐标角度
    const cameraDistanceRef = useRef(Math.sqrt(3)); // 相机到原点的距离
    const lastGestureRef = useRef({ x: 0, y: 0 });
    const baseScaleRef = useRef(1); // 模型的基础缩放（适配视口）
    const gestureScaleRef = useRef(1); // 手势缩放
    const lastScaleRef = useRef(1);
    const lastDistanceRef = useRef(0);
    const targetCameraPositionRef = useRef(new THREE.Vector3(1, 1, 1)); // 目标相机位置（用于平滑过渡）

    // 存储回调的 ref（避免循环依赖）
    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    const modelLoaderRef = useRef<any>(null);

    /**
     * 重置相机视角到初始状态
     */
    const resetCamera = useCallback(() => {
      logger.info('Resetting camera view', 'ObjViewer');

      // 重置相机角度到初始位置（45度角）
      cameraAngleRef.current = {
        theta: Math.PI / 4,
        phi: Math.PI / 4,
      };

      // 重置缩放
      gestureScaleRef.current = 1;

      // 重置相机位置
      if (cameraRef.current) {
        const distance = cameraDistanceRef.current;
        const x =
          distance * Math.sin(cameraAngleRef.current.phi) * Math.cos(cameraAngleRef.current.theta);
        const y = distance * Math.cos(cameraAngleRef.current.phi);
        const z =
          distance * Math.sin(cameraAngleRef.current.phi) * Math.sin(cameraAngleRef.current.theta);
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(0, 0, 0);
      }

      logger.debug('Camera view reset complete', 'ObjViewer');
    }, []);

    /**
     * 创建自定义网格（模仿 @react-three/drei 的 Grid 组件）
     */
    const createCustomGrid = useCallback((size: number, center: THREE.Vector3): THREE.Object3D => {
      const gridGroup = new THREE.Group();

      // 网格参数（与 web 版本保持一致）
      const cellSize = 0.5;
      const cellColor = 0x6b6b6b; // 灰色
      const sectionSize = 1;
      const sectionColor = 0x9d4b4b; // 红棕色
      const divisions = Math.floor(size / cellSize);

      // 创建基础网格
      const gridHelper = new THREE.GridHelper(size, divisions, sectionColor, cellColor);
      gridHelper.position.copy(center);

      // 设置网格透明度
      if (Array.isArray(gridHelper.material)) {
        gridHelper.material.forEach(mat => {
          mat.transparent = true;
          mat.opacity = 0.6;
        });
      } else if (gridHelper.material) {
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.6;
      }

      gridGroup.add(gridHelper);

      return gridGroup;
    }, []);

    /**
     * 更新场景坐标网格的显示状态
     */
    const updateGrid = useCallback(
      (show: boolean) => {
        if (!sceneRef.current || !modelRef.current) return;

        logger.info(`Updating grid: ${show}`, 'ObjViewer');

        // 移除旧的网格
        if (gridHelpersRef.current) {
          sceneRef.current.remove(gridHelpersRef.current);
          gridHelpersRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          gridHelpersRef.current = null;
        }

        // 如果需要显示网格，创建网格
        if (show) {
          // 获取模型的边界盒
          const box = new THREE.Box3().setFromObject(modelRef.current);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // 计算网格尺寸（与 web 版本一致：10x10）
          const gridSize = 10;

          // 创建网格（模仿 web 版本的样式）
          const grid = createCustomGrid(gridSize, center);
          sceneRef.current.add(grid);
          gridHelpersRef.current = grid;

          logger.debug(
            `Grid added to scene, size: ${gridSize}, center: ${center.x},${center.y},${center.z}`,
            'ObjViewer'
          );
        }
      },
      [createCustomGrid]
    );

    // 监听 showGrid 变化
    useEffect(() => {
      updateGrid(showGrid);
    }, [showGrid, updateGrid]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        resetCamera,
      }),
      [resetCamera]
    );

    // 计算两点之间的距离
    const getDistance = (touches: any[]) => {
      if (touches.length < 2) return 0;
      const [touch1, touch2] = touches;
      const dx = touch1.pageX - touch2.pageX;
      const dy = touch1.pageY - touch2.pageY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // 创建 PanResponder
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          // 记录手势开始时的位置
          lastGestureRef.current = {
            theta: cameraAngleRef.current.theta,
            phi: cameraAngleRef.current.phi,
          };
          // 不要在这里重置任何状态，保持连续性
        },
        onPanResponderRelease: () => {
          // 手势结束时重置距离，为下一次双指缩放做准备
          lastDistanceRef.current = 0;
          // 保存当前的缩放状态，作为下次缩放的起点
          lastScaleRef.current = gestureScaleRef.current;
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          if (touches.length === 2) {
            // 双指缩放
            const currentDistance = getDistance(touches);

            // 第一次检测到双指时，初始化距离
            if (lastDistanceRef.current === 0) {
              lastDistanceRef.current = currentDistance;
              lastScaleRef.current = gestureScaleRef.current;
              return;
            }

            if (currentDistance > 0 && lastDistanceRef.current > 0) {
              // 计算缩放比例
              const scale = currentDistance / lastDistanceRef.current;
              gestureScaleRef.current = Math.max(0.5, Math.min(3, lastScaleRef.current * scale));
            }
          } else if (touches.length === 1) {
            // 单指旋转相机（改变视角）
            // 如果刚从双指变为单指，重置距离
            if (lastDistanceRef.current !== 0) {
              lastDistanceRef.current = 0;
              lastGestureRef.current = {
                theta: cameraAngleRef.current.theta,
                phi: cameraAngleRef.current.phi,
              };
            }

            // 根据手势移动更新相机角度
            // dx 影响 theta（水平旋转）
            // dy 影响 phi（垂直旋转）
            const deltaX = gestureState.dx * 0.01;
            const deltaY = gestureState.dy * 0.01;

            // 修正左右方向：向左拖动（dx < 0）→ theta 减小，向右拖动（dx > 0）→ theta 增加
            cameraAngleRef.current.theta = lastGestureRef.current.theta + deltaX;
            // 限制 phi 在 0.1 到 PI-0.1 之间，防止相机钻到地底下或转到正上方
            cameraAngleRef.current.phi = Math.max(
              0.1,
              Math.min(Math.PI - 0.1, lastGestureRef.current.phi - deltaY)
            );

            // 根据球面坐标计算新的相机位置
            // 注意：不使用 gestureScaleRef，因为模型缩放已经通过 model.scale 实现
            // 如果在这里也应用 gestureScaleRef，会导致双重缩放效果
            const distance = cameraDistanceRef.current;
            const x =
              distance *
              Math.sin(cameraAngleRef.current.phi) *
              Math.cos(cameraAngleRef.current.theta);
            const y = distance * Math.cos(cameraAngleRef.current.phi);
            const z =
              distance *
              Math.sin(cameraAngleRef.current.phi) *
              Math.sin(cameraAngleRef.current.theta);

            // 更新相机位置，相机始终看向原点
            if (cameraRef.current) {
              cameraRef.current.position.set(x, y, z);
              cameraRef.current.lookAt(0, 0, 0);
            }
          }
        },
      })
    ).current;

    useEffect(() => {
      onLoadRef.current = onLoad;
      onErrorRef.current = onError;
    }, [onLoad, onError]);

    // 加载 OBJ 模型到场景中
    const loadObjIntoScene = useCallback(async (objectUrl: string) => {
      if (!sceneRef.current || !cameraRef.current) {
        logger.warn('Scene or camera not ready, skipping model load', 'ObjViewer');
        return;
      }

      try {
        logger.info(`Loading OBJ from: ${objectUrl}`, 'ObjViewer');

        // 加载 OBJ 模型，传入 LoadingManager
        const loader = new OBJLoader(new THREE.LoadingManager());

        const object = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            objectUrl,
            (obj: any) => {
              logger.info('OBJ loaded successfully', 'ObjViewer');
              resolve(obj);
            },
            (progress: any) => {
              logger.debug(
                `OBJ loading progress: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`,
                'ObjViewer'
              );
            },
            (error: any) => {
              logger.error(`OBJ load error: ${error}`, 'ObjViewer');
              reject(error);
            }
          );
        });

        // 移除旧模型
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        // 清空原始材质映射
        originalMaterialsRef.current.clear();

        // 遍历模型，保存原始材质并应用颜色
        object.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // 保存原始材质（使用 uuid 作为唯一标识）
            if (child.material) {
              originalMaterialsRef.current.set(child.uuid, child.material);
              logger.debug(`Saved original material for mesh: ${child.uuid}`, 'ObjViewer');
            } else {
              // 如果 Mesh 没有材质，记录日志（Three.js 会自动提供默认材质）
              logger.debug(`Mesh ${child.uuid} has no material, will use default`, 'ObjViewer');
            }

            // 根据当前选择的颜色应用材质
            if (modelColor !== null) {
              // 如果选择了单色，应用单色材质
              const solidMaterial = new THREE.MeshPhongMaterial({
                color: modelColor,
                side: THREE.DoubleSide,
                flatShading: false,
              });
              child.material = solidMaterial;
              logger.debug(
                `Applied solid color material: ${modelColor?.toString(16)}`,
                'ObjViewer'
              );
            } else {
              // 如果选择了原始贴图，保持原始材质（或默认材质）
              if (!child.material) {
                // 如果没有原始材质，提供默认材质（橙色）
                const defaultMaterial = new THREE.MeshPhongMaterial({
                  color: 0xff8c00, // 橙色
                  side: THREE.DoubleSide,
                  flatShading: false,
                });
                child.material = defaultMaterial;
                originalMaterialsRef.current.set(child.uuid, defaultMaterial);
                logger.debug(
                  `Applied default material for mesh without material: ${child.uuid}`,
                  'ObjViewer'
                );
              } else {
                logger.debug(`Keeping original material for mesh: ${child.uuid}`, 'ObjViewer');
              }
            }
          }
        });

        // 如果当前有单色材质，保存引用
        if (modelColor !== null && object.children.length > 0) {
          const firstMesh = object.children.find((child: any) => child instanceof THREE.Mesh);
          if (firstMesh && firstMesh.material) {
            materialRef.current = firstMesh.material as THREE.MeshPhongMaterial;
          }
        }
        // 计算模型边界盒
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        logger.info(
          `Model bounds - Size: ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}, Center: ${center.x.toFixed(2)},${center.y.toFixed(2)},${center.z.toFixed(2)}`,
          'ObjViewer'
        );

        // 居中模型
        object.position.sub(center);

        // 模型本身就有正确的位置和方向信息，不需要额外旋转

        // 缩放模型以适应视口（更小的比例）
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.8 / maxDim; // 进一步缩小，让模型看起来更小

        // 保存基础缩放值
        baseScaleRef.current = scale;
        object.scale.setScalar(scale);

        logger.info(`Applied scale: ${scale.toFixed(4)}`, 'ObjViewer');

        modelRef.current = object;
        sceneRef.current.add(object);

        // 标记模型已加载完成
        setIsModelLoaded(true);

        logger.info('Model added to scene successfully', 'ObjViewer');
      } catch (error: any) {
        logger.error(`Failed to load OBJ: ${error.message}`, 'ObjViewer');
        // 即使失败也标记为已完成，避免一直显示 loading
        setIsModelLoaded(true);
        onErrorRef.current?.({
          type: 'parse',
          message: '模型解析失败',
          originalError: error,
        });
      }
    }, []);

    // 检查是否是本地文件
    const isLocalFile = useCallback((url: string) => {
      return url.startsWith('file://') || url.startsWith('/');
    }, []);

    // 使用模型加载 Hook
    const modelLoader = useModelLoader({
      onLoad: useCallback(
        (data: any) => {
          logger.info('Model URL ready, loading into scene', 'ObjViewer');
          logger.info('Model URL ready, datadata', data);
          const objectUrl = typeof data === 'string' ? data : data.url;
          loadObjIntoScene(objectUrl);
          onLoadRef.current?.(data);
        },
        [loadObjIntoScene]
      ),
      onProgress,
      onError,
    });

    // 存储 modelLoader 到 ref
    useEffect(() => {
      modelLoaderRef.current = modelLoader;
    }, [modelLoader]);

    // 初始化 Three.js 场景
    const onContextCreate = async (gl: any) => {
      logger.info('GLView context created', 'ObjViewer');

      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      // 创建场景
      const scene = new THREE.Scene();
      // 根据主题设置背景颜色：深色模式使用黑色背景，亮色模式使用浅灰色背景
      const backgroundColor = isDark ? 0x000000 : 0xeeeeee;
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;

      // 创建相机（使用球面坐标计算初始位置）
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

      // 根据球面坐标计算初始相机位置
      // theta: 水平角度，phi: 垂直角度
      const initialDistance = Math.sqrt(3); // sqrt(1^2 + 1^2 + 1^2)
      const x =
        initialDistance *
        Math.sin(cameraAngleRef.current.phi) *
        Math.cos(cameraAngleRef.current.theta);
      const y = initialDistance * Math.cos(cameraAngleRef.current.phi);
      const z =
        initialDistance *
        Math.sin(cameraAngleRef.current.phi) *
        Math.sin(cameraAngleRef.current.theta);

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // 创建渲染器（直接使用 THREE.WebGLRenderer，iOS 兼容性更好）
      const renderer = new THREE.WebGLRenderer({
        canvas: {
          width,
          height,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          clientHeight: height,
          clientWidth: width,
          getContext: () => gl,
        } as any,
        context: gl,
      });
      renderer.setSize(width, height);
      // 根据主题设置清除颜色：深色模式使用黑色背景，亮色模式使用浅灰色背景
      const clearColor = isDark ? 0x000000 : 0xeeeeee;
      renderer.setClearColor(clearColor);
      rendererRef.current = renderer;

      // 添加更强的环境光（参考用户代码）
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // 增加亮度
      scene.add(ambientLight);

      // 添加主定向光
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
      directionalLight1.position.set(10, 10, 5);
      directionalLight1.castShadow = true;
      scene.add(directionalLight1);

      // 添加补光（从另一个方向）
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight2.position.set(-10, 5, -5);
      scene.add(directionalLight2);

      // 添加顶部光源
      const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight3.position.set(0, 10, 0);
      scene.add(directionalLight3);

      // 标记 GL 准备完成
      setIsGlReady(true);

      // 动画循环
      const animate = () => {
        timeoutRef.current = setTimeout(animate, 1000 / 60);

        // 应用手势缩放到模型
        if (modelRef.current) {
          // 应用基础缩放 * 手势缩放
          modelRef.current.scale.setScalar(baseScaleRef.current * gestureScaleRef.current);
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
    };

    // 当 modelUrl 变化时重置加载状态
    useEffect(() => {
      setIsModelLoaded(false);
    }, [modelUrl]);

    // 当 modelColor 变化时更新材质颜色或恢复原始贴图
    useEffect(() => {
      if (!modelRef.current) return;

      logger.info(`Model color changed to: ${modelColor ?? 'original (null)'}`, 'ObjViewer');

      modelRef.current.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          if (modelColor === null) {
            // 恢复原始贴图
            const originalMaterial = originalMaterialsRef.current.get(child.uuid);
            if (originalMaterial) {
              // 释放当前单色材质（如果存在）
              if (child.material && child.material !== originalMaterial) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat: any) => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
              child.material = originalMaterial;
              logger.debug(`Restored original material for mesh: ${child.uuid}`, 'ObjViewer');
            } else {
              logger.warn(`No original material found for mesh: ${child.uuid}`, 'ObjViewer');
            }
          } else {
            // 应用单色材质
            // 如果是首次切换到单色，且该 Mesh 还没有保存过原始材质，则保存
            if (!originalMaterialsRef.current.has(child.uuid) && child.material) {
              originalMaterialsRef.current.set(child.uuid, child.material);
              logger.debug(
                `Saved original material before applying solid color: ${child.uuid}`,
                'ObjViewer'
              );
            }

            // 释放当前材质（如果不是我们刚保存的原始材质）
            const originalMaterial = originalMaterialsRef.current.get(child.uuid);
            if (child.material && child.material !== originalMaterial) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }

            const solidMaterial = new THREE.MeshPhongMaterial({
              color: modelColor,
              side: THREE.DoubleSide,
              flatShading: false,
            });
            child.material = solidMaterial;
            logger.debug(
              `Applied solid color ${modelColor?.toString(16)} to mesh: ${child.uuid}`,
              'ObjViewer'
            );

            // 更新当前单色材质引用
            materialRef.current = solidMaterial;
          }
        }
      });
    }, [modelColor]);

    // GL 上下文准备完成后开始加载模型
    useEffect(() => {
      if (isGlReady && modelUrl) {
        // 如果是本地文件，直接加载到场景
        if (isLocalFile(modelUrl)) {
          logger.info('Loading local model file directly', 'ObjViewer');
          loadObjIntoScene(modelUrl);
          onLoadRef.current?.(modelUrl as any);
        } else {
          // 网络文件需要下载
          logger.info('Starting model download', 'ObjViewer');
          modelLoader.loadModel(modelUrl);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGlReady, modelUrl, isLocalFile]);

    // 清理资源
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 清理立体网格
        if (gridHelpersRef.current && sceneRef.current) {
          sceneRef.current.remove(gridHelpersRef.current);
          gridHelpersRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          gridHelpersRef.current = null;
        }

        // 清理 Three.js 资源
        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        // 清理原始材质映射中的所有材质
        originalMaterialsRef.current.forEach(material => {
          if (Array.isArray(material)) {
            material.forEach((mat: any) => mat.dispose());
          } else {
            material.dispose();
          }
        });
        originalMaterialsRef.current.clear();

        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        if (modelLoaderRef.current) {
          modelLoaderRef.current.cancel();
        }
      };
    }, []);

    return (
      <View style={[styles.container, style]}>
        {/* 加载状态 - 显示到模型真正加载完成 */}
        {!isModelLoaded && (
          <View style={[
            styles.overlayContainer,
            // 深色模式使用深色背景，亮色模式使用浅色背景
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            {showPlaceholder && <LoadingPlaceholder />}
            {showProgress && modelLoader.state === 'loading' && (
              <ProgressBar progress={modelLoader.progress} />
            )}
          </View>
        )}

        {/* 错误状态 */}
        {modelLoader.state === 'error' && modelLoader.error && (
          <View style={styles.overlayContainer}>
            <ErrorFallback error={modelLoader.error} onRetry={modelLoader.retry} />
          </View>
        )}

        {/* 3D 渲染视图 */}
        <View style={styles.glView} {...panResponder.panHandlers}>
          <GLView style={styles.glView} onContextCreate={onContextCreate} />
        </View>
      </View>
    );
  }
);

// 显示名称（用于调试）
ObjViewer.displayName = 'ObjViewer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glView: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
});
