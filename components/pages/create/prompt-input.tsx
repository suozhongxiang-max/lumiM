import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface PromptInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  cardBackground: string;
  borderColor: string;
  textColor: string;
  secondaryTextColor: string;
}

export function PromptInput({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  cardBackground,
  borderColor,
  textColor,
  secondaryTextColor,
}: PromptInputProps) {
  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }]}>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        placeholderTextColor={secondaryTextColor}
        value={value}
        onChangeText={onChangeText}
        multiline
      />
      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <IconSymbol name="sparkles" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingRight: 12,
    maxHeight: 120,
  },
  submitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
