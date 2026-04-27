import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';

interface ExamplePrompt {
  icon: IconSymbolName; // 图标
  textKey: string; // 翻译键
  promptKey: string; // 完整提示词翻译键
  gradient: readonly [string, string];
}

// 示例提示词配置（textKey 和 promptKey 将作为 i18n 翻译键使用）
const EXAMPLE_PROMPTS: Omit<ExamplePrompt, 'text' | 'fullPrompt'>[] = [
  {
    icon: 'pawprint.fill', // 图标名称
    textKey: 'examples.fox.name', // 名称翻译键
    promptKey: 'examples.fox.prompt', // 提示词翻译键
    gradient: ['#FF6B6B', '#FF8E53'] as const, // 渐变色
  },
  {
    icon: 'building.2.fill', // 图标名称
    textKey: 'examples.city.name', // 名称翻译键
    promptKey: 'examples.city.prompt', // 提示词翻译键
    gradient: ['#4FACFE', '#00F2FE'] as const, // 渐变色
  },
  {
    icon: 'cpu.fill', // 图标名称
    textKey: 'examples.robot.name', // 名称翻译键
    promptKey: 'examples.robot.prompt', // 提示词翻译键
    gradient: ['#43E97B', '#38F9D7'] as const, // 渐变色
  },
];

interface ExamplePromptsProps {
  onPromptSelect: (prompt: string) => void; // 提示词选择回调
  cardBackground: string; // 卡片背景色
  borderColor: string; // 边框颜色
  textColor: string; // 文字颜色
}

/**
 * 示例提示词组件
 * 显示预设的创作提示词供用户快速选择
 */
export function ExamplePrompts({
  onPromptSelect,
  cardBackground,
  borderColor,
  textColor,
}: ExamplePromptsProps) {
  const { t } = useI18n();

  // 动态生成带翻译的示例提示词
  const examplePrompts: ExamplePrompt[] = EXAMPLE_PROMPTS.map(prompt => ({
    ...prompt,
    text: t(prompt.textKey as any),
    fullPrompt: t(prompt.promptKey as any),
  }));

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('examples.title')}</Text>

      {/* 示例卡片列表（水平滚动） */}
      <FlatList
        data={examplePrompts}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.text}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => onPromptSelect(item.fullPrompt)}
            activeOpacity={0.8}
          >
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.iconBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconSymbol name={item.icon} size={18} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.cardText, { color: textColor }]} numberOfLines={1}>
                {item.text}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 主容器样式
  container: {
    marginBottom: 0, // 由父容器控制间距
  },

  // 标题样式
  sectionTitle: {
    fontSize: FontSize.sm, // 使用主题字号
    fontWeight: FontWeight.semibold, // 使用主题字重
    marginBottom: Spacing.md, // 使用主题间距
    opacity: 0.7, // 透明度
  },

  listContent: {
    gap: Spacing.sm,
  },

  cardWrapper: {
    width: 110,
  },

  // 卡片样式
  card: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 图标背景样式
  iconContainer: {
    alignItems: 'center', // 水平居中
    marginBottom: Spacing.sm, // 使用主题间距
  },
  iconBackground: {
    width: 40, // 宽度
    height: 40, // 高度
    borderRadius: 20, // 圆角（圆形）
    alignItems: 'center', // 水平居中
    justifyContent: 'center', // 垂直居中
  },

  // 卡片文字样式
  cardText: {
    fontSize: FontSize.xs, // 使用主题字号
    fontWeight: FontWeight.medium, // 使用主题字重
    lineHeight: 16, // 行高
    textAlign: 'center', // 居中对齐
  },
});
