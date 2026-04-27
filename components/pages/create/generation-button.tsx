import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

interface GenerationButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  generationProgress?: number;
}

export function GenerationButton({
  onPress,
  disabled = false,
  isGenerating = false,
  generationProgress = 0,
}: GenerationButtonProps) {
  const buttonText = isGenerating
    ? `Generating... ${Math.round(generationProgress)}%`
    : 'Generate 3D Model';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          isGenerating && styles.buttonGenerating,
        ]}
        onPress={onPress}
        disabled={disabled || isGenerating}
      >
        {isGenerating ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.buttonTextLoading]}>{buttonText}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGenerating: {
    backgroundColor: '#999999',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  buttonTextLoading: {
    marginLeft: 8,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
