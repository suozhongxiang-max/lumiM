/**
 * 打印参数卡片组件
 *
 * 设计原则（基于 UI/UX Pro Max）：
 * - Real-Time Monitoring - 实时参数显示
 * - Table Layout - 表格布局，清晰对比当前值和目标值
 * - Professional Dashboard - 专业的监控仪表板风格
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';

/**
 * 打印参数卡片组件的 Props
 */
export interface PrinterParametersCardProps {
  /** 喷头当前温度（℃） */
  nozzleTemp: number;
  /** 喷头目标温度（℃） */
  nozzleTargetTemp: number;
  /** 热床当前温度（℃） */
  bedTemp: number;
  /** 热床目标温度（℃） */
  bedTargetTemp: number;
  /** 打印速度（mm/s） */
  printSpeed: number;
  /** 风扇速度（0-100%，可选） */
  fanSpeed?: number;
}

/**
 * 打印参数卡片组件
 *
 * 使用表格布局显示温度参数，清晰对比当前值和目标值
 */
export function PrinterParametersCard({
  nozzleTemp,
  nozzleTargetTemp,
  bedTemp,
  bedTargetTemp,
  printSpeed,
  fanSpeed,
}: PrinterParametersCardProps) {
  // 获取主题配置
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 获取主题颜色
  const backgroundColor = isDark ? Colors.dark.cardBackground : Colors.light.cardBackground;
  const borderColor = isDark ? Colors.dark.border : Colors.light.border;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const secondaryTextColor = isDark ? Colors.dark.secondaryText : Colors.light.secondaryText;
  const tertiaryTextColor = isDark ? Colors.dark.tertiaryText : Colors.light.tertiaryText;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          // iOS 风格阴影
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          // Android elevation
          elevation: 3,
        },
      ]}
    >
      {/* 标题 */}
      <View style={styles.header}>
        <Ionicons name="analytics-outline" size={20} color={textColor} />
        <ThemedText style={[styles.title, { color: textColor }]}>
          {t('printer.statusCard.title')}
        </ThemedText>
      </View>

      {/* 温度表格 */}
      <View style={styles.temperatureTable}>
        {/* 表头 */}
        <View
          style={[
            styles.tableHeader,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            },
          ]}
        >
          <View style={styles.tableHeaderCell}>{/* 空白单元格（用于图标和标签列） */}</View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="radio-button-on" size={14} color="#007AFF" />
            <ThemedText style={[styles.tableHeaderText, { color: secondaryTextColor }]}>
              {t('printer.statusCard.current')}
            </ThemedText>
          </View>
          <View style={styles.tableHeaderCell}>
            <Ionicons name="locate-outline" size={14} color="#FF9500" />
            <ThemedText style={[styles.tableHeaderText, { color: secondaryTextColor }]}>
              {t('printer.statusCard.target')}
            </ThemedText>
          </View>
        </View>

        {/* 分隔线已集成到表头底部，这里不需要单独的分隔线 */}

        {/* 喷头温度行 */}
        <View style={styles.tableRow}>
          {/* 标签列 */}
          <View style={styles.tableLabelCell}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Ionicons name="flame-outline" size={18} color="#FF3B30" />
            </View>
            <ThemedText style={[styles.tableLabel, { color: secondaryTextColor }]}>
              {t('printer.statusCard.nozzle')}
            </ThemedText>
          </View>

          {/* 当前值列 */}
          <View style={styles.tableValueCell}>
            <ThemedText style={[styles.tableValue, { color: textColor }]}>
              {nozzleTemp.toFixed(2)}
            </ThemedText>
            <ThemedText style={[styles.tableUnit, { color: tertiaryTextColor }]}>℃</ThemedText>
          </View>

          {/* 目标值列 */}
          <View style={styles.tableValueCell}>
            <ThemedText style={[styles.tableValue, { color: textColor }]}>
              {nozzleTargetTemp.toFixed(2)}
            </ThemedText>
            <ThemedText style={[styles.tableUnit, { color: tertiaryTextColor }]}>℃</ThemedText>
          </View>
        </View>

        {/* 热床温度行 */}
        <View style={styles.tableRow}>
          {/* 标签列 */}
          <View style={styles.tableLabelCell}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Ionicons name="bed-outline" size={18} color="#FF9500" />
            </View>
            <ThemedText style={[styles.tableLabel, { color: secondaryTextColor }]}>
              {t('printer.statusCard.bed')}
            </ThemedText>
          </View>

          {/* 当前值列 */}
          <View style={styles.tableValueCell}>
            <ThemedText style={[styles.tableValue, { color: textColor }]}>
              {bedTemp.toFixed(2)}
            </ThemedText>
            <ThemedText style={[styles.tableUnit, { color: tertiaryTextColor }]}>℃</ThemedText>
          </View>

          {/* 目标值列 */}
          <View style={styles.tableValueCell}>
            <ThemedText style={[styles.tableValue, { color: textColor }]}>
              {bedTargetTemp.toFixed(2)}
            </ThemedText>
            <ThemedText style={[styles.tableUnit, { color: tertiaryTextColor }]}>℃</ThemedText>
          </View>
        </View>
      </View>

      {/* 分隔线 */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* 其他参数（打印速度 + 风扇速度） */}
      <View style={styles.otherParameters}>
        {/* 打印速度 */}
        <View style={styles.parameterItem}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
            <Ionicons name="speedometer-outline" size={18} color="#007AFF" />
          </View>
          <View style={styles.parameterInfo}>
            <ThemedText style={[styles.parameterLabel, { color: tertiaryTextColor }]}>
              {t('printer.statusCard.printSpeed')}
            </ThemedText>
            <View style={styles.parameterValueRow}>
              <ThemedText style={[styles.parameterValue, { color: textColor }]}>
                {printSpeed}
              </ThemedText>
              <ThemedText style={[styles.parameterUnit, { color: tertiaryTextColor }]}>
                mm/s
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 风扇速度（如果提供） */}
        {fanSpeed !== undefined && (
          <View style={styles.parameterItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <Ionicons name="cloudy-outline" size={18} color="#34C759" />
            </View>
            <View style={styles.parameterInfo}>
              <ThemedText style={[styles.parameterLabel, { color: tertiaryTextColor }]}>
                {t('printer.statusCard.fanSpeed')}
              </ThemedText>
              <View style={styles.parameterValueRow}>
                <ThemedText style={[styles.parameterValue, { color: textColor }]}>
                  {fanSpeed}
                </ThemedText>
                <ThemedText style={[styles.parameterUnit, { color: tertiaryTextColor }]}>
                  %
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 卡片容器
  card: {
    borderRadius: BorderRadius.lg, // 圆角
    padding: Spacing.xl, // 内边距
    // 移除 marginHorizontal 和 marginTop，由父容器的 paddingHorizontal 和 gap 统一控制
    borderWidth: StyleSheet.hairlineWidth, // 细边框
  },

  // 头部容器（标题）
  header: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    marginBottom: Spacing.lg, // 底部间距
    gap: Spacing.xs, // 图标和文本间距
  },

  // 标题
  title: {
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.semibold, // 字重 600
  },

  // 温度表格容器
  temperatureTable: {
    marginBottom: Spacing.lg, // 底部间距
  },

  // 表头行
  tableHeader: {
    flexDirection: 'row', // 水平布局
    paddingVertical: Spacing.sm, // 上下内边距
    paddingHorizontal: Spacing.xs, // 左右内边距
    borderRadius: BorderRadius.sm, // 圆角
    marginBottom: Spacing.xs, // 底部外边距（从 md=12 减小到 xs=4）
  },

  // 表头单元格
  tableHeaderCell: {
    flex: 1, // 平分空间
    flexDirection: 'row', // 水平布局（图标 + 文字）
    alignItems: 'center', // 垂直居中
    justifyContent: 'center', // 水平居中
    gap: 4, // 图标和文字间距
  },

  // 表头文字
  tableHeaderText: {
    fontSize: FontSize.sm, // 字号 14（从 12 增加）
    fontWeight: FontWeight.semibold, // 字重 600（从 medium 增加）
  },

  // 表格行
  tableRow: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    marginTop: Spacing.sm, // 顶部间距（从 md 减小到 sm）
  },

  // 标签列单元格
  tableLabelCell: {
    flex: 1, // 占据1份空间
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    gap: Spacing.xs, // 间距
  },

  // 值列单元格
  tableValueCell: {
    flex: 1, // 占据1份空间
    flexDirection: 'row', // 水平布局
    alignItems: 'baseline', // 基线对齐
    justifyContent: 'center', // 水平居中
    gap: 2, // 值和单位间距
  },

  // 图标容器
  iconContainer: {
    width: 32, // 宽度
    height: 32, // 高度
    borderRadius: BorderRadius.sm, // 圆角
    alignItems: 'center', // 水平居中
    justifyContent: 'center', // 垂直居中
  },

  // 表格标签文字
  tableLabel: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.medium, // 字重 500
  },

  // 表格数值
  tableValue: {
    fontSize: FontSize.lg, // 字号 20
    fontWeight: FontWeight.semibold, // 字重 600
  },

  // 表格单位
  tableUnit: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.regular, // 字重 400
  },

  // 分隔线
  divider: {
    height: StyleSheet.hairlineWidth, // 1像素线
    marginBottom: Spacing.lg, // 底部间距
  },

  // 其他参数容器
  otherParameters: {
    flexDirection: 'row', // 水平布局
    gap: Spacing.lg, // 参数项间距
  },

  // 参数项容器
  parameterItem: {
    flex: 1, // 平分空间
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    gap: Spacing.sm, // 图标和信息间距
  },

  // 参数信息容器
  parameterInfo: {
    flex: 1, // 占据剩余空间
  },

  // 参数标签
  parameterLabel: {
    fontSize: FontSize.xs, // 字号 12
    fontWeight: FontWeight.regular, // 字重 400
    marginBottom: 4, // 底部间距
  },

  // 参数值行
  parameterValueRow: {
    flexDirection: 'row', // 水平布局
    alignItems: 'baseline', // 基线对齐
    gap: 4, // 值和单位间距
  },

  // 参数值
  parameterValue: {
    fontSize: FontSize.lg, // 字号 20
    fontWeight: FontWeight.semibold, // 字重 600
  },

  // 参数单位
  parameterUnit: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.regular, // 字重 400
  },
});
