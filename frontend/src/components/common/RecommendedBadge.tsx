import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecommendedBadgeProps {
  style?: any;
}

export const RecommendedBadge: React.FC<RecommendedBadgeProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>おすすめ✨</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e40af',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
