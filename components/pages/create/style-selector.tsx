import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { IconSymbolName } from '@/components/ui/icon-symbol';
import { useI18n } from '@/hooks/use-i18n';

// 获取风格对应的颜色
function getStyleColor(category: string): string {
  const colors: Record<string, string> = {
    realistic: '#004E89',
    cartoon: '#1AA7EC',
    lowpoly: '#FF6B35',
    cyberpunk: '#A23B72',
    pixel: '#8B4513',
    handdrawn: '#228B22',
  };
  return colors[category] || '#666666';
}

interface StyleOption {
  id: string;
  name: string; // 将使用 i18n 翻译键
  category: string;
  icon: IconSymbolName;
}

// 风格选项配置（name 字段将作为 i18n 翻译键使用）
const STYLE_OPTIONS: Omit<StyleOption, 'name'>[] = [
  { id: 'realistic', category: 'realistic', icon: 'cube' },
  { id: 'cartoon', category: 'cartoon', icon: 'sparkles' },
  { id: 'lowpoly', category: 'lowpoly', icon: 'cube.fill' },
  { id: 'cyberpunk', category: 'cyberpunk', icon: 'triangle.fill' },
];

interface StyleSelectorProps {
  selectedStyle: StyleOption | null;
  onStyleSelect: (style: StyleOption) => void;
  textColor: string;
}

export function StyleSelector({ selectedStyle, onStyleSelect, textColor }: StyleSelectorProps) {
  const { t } = useI18n();

  // 动态生成带翻译的风格选项
  const styleOptions: StyleOption[] = STYLE_OPTIONS.map(option => ({
    ...option,
    name: t(`style.${option.id}`),
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>{t('style.title')}</Text>
      <View style={styles.grid}>
        {styleOptions.map(style => (
          <TouchableOpacity
            key={style.id}
            style={[styles.styleCard, selectedStyle?.id === style.id && styles.styleCardSelected]}
            onPress={() => onStyleSelect(style)}
          >
            <View
              style={[
                styles.styleImagePlaceholder,
                { backgroundColor: getStyleColor(style.category) },
              ]}
            >
              <Text style={styles.styleText}>{style.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  styleCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    borderColor: '#007AFF',
  },
  styleImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
