import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

interface SkeletonBarProps {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBar({
  height = 20,
  width = '100%',
  borderRadius = 16,
  style,
}: SkeletonBarProps) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 950,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height,
          width,
          borderRadius,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export default function WavingSkeleton({ lines = 5 }: { lines?: number }) {
  const items = Array.from({ length: lines }, (_, i) => i + 1);
  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <SkeletonBar height={24} width={160} borderRadius={999} />
        <SkeletonBar height={42} width={220} borderRadius={14} />
        <SkeletonBar height={18} width={140} borderRadius={10} />
      </View>

      {items.map((i) => (
        <View key={i} style={styles.verseCard}>
          <SkeletonBar height={28} width={34} borderRadius={10} />
          <View style={styles.verseLines}>
            <SkeletonBar height={20} width="100%" borderRadius={10} />
            <SkeletonBar height={20} width="82%" borderRadius={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 16,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  bar: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  verseCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
  },
  verseLines: {
    flex: 1,
    gap: 8,
  },
});
