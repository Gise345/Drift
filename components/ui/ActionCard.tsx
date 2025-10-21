import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimations } from '@/src/hooks/useAnimations';

interface ActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Premium action card component with smooth animations and press feedback
 * Follows Uber/Lyft quality standards for polish and UX
 */
export function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  variant = 'primary',
  delay = 0,
  disabled = false,
  className = '',
}: ActionCardProps) {
  const { cardEntry } = useAnimations();

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 shadow-lg';
      case 'secondary':
        return 'bg-white shadow-md';
      case 'accent':
        return 'bg-emerald-500 shadow-lg';
      default:
        return 'bg-white shadow-md';
    }
  };

  const getTitleClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-white';
      case 'secondary':
        return 'text-gray-900';
      case 'accent':
        return 'text-white';
      default:
        return 'text-gray-900';
    }
  };

  const getSubtitleClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-100';
      case 'secondary':
        return 'text-gray-600';
      case 'accent':
        return 'text-emerald-100';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Animated.View entering={cardEntry(delay)}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        className={`
          ${getVariantClasses()}
          rounded-2xl p-6
          ${disabled ? 'opacity-50' : ''}
          ${className}
        `}
        style={{
          transform: [{ scale: 1 }],
        }}
      >
        <View className="flex-row items-center">
          <View className="mr-4">
            <Text className="text-4xl">{icon}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xl font-bold mb-1 ${getTitleClasses()}`}>
              {title}
            </Text>
            <Text className={`text-sm ${getSubtitleClasses()}`}>
              {subtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Compact version of ActionCard for secondary actions
 */
export function CompactActionCard({
  icon,
  title,
  subtitle,
  onPress,
  delay = 0,
  className = '',
}: Omit<ActionCardProps, 'variant' | 'disabled'>) {
  const { cardEntry } = useAnimations();

  return (
    <Animated.View entering={cardEntry(delay)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`
          bg-white rounded-xl p-4 shadow-sm
          flex-row items-center
          ${className}
        `}
      >
        <Text className="text-2xl mr-3">{icon}</Text>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-600 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
        <Text className="text-gray-400 text-xl">›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
