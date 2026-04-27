const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加 3D 模型文件支持
config.resolver.assetExts.push(
  // 3D 模型文件格式
  'obj', // Wavefront OBJ 模型文件
  'mtl', // Material Library 材质文件
  'glb', // GL Transmission Format Binary
  'gltf' // GL Transmission Format
);

module.exports = config;
