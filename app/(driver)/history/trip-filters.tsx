import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * TRIP FILTERS SCREEN
 * 
 * Advanced filtering options for trip history:
 * - Date range selection
 * - Status filters (completed, cancelled, issues)
 * - Earnings range
 * - Rider rating
 * - Sort options
 */

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  status: ('completed' | 'cancelled' | 'issue')[];
  minEarnings?: number;
  maxEarnings?: number;
  minRating: number;
  sortBy: 'date' | 'earnings' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export default function TripFiltersScreen() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'week',
    status: ['completed'],
    minRating: 1,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Update filter state
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Toggle status filter
  const toggleStatus = (status: 'completed' | 'cancelled' | 'issue') => {
    setFilters(prev => {
      const statuses = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      return { ...prev, status: statuses };
    });
  };

  // Apply filters and navigate back
  const applyFilters = () => {
    // TODO: Pass filters to trips screen via params or state management
    router.back();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      dateRange: 'week',
      status: ['completed'],
      minRating: 1,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter Trips</Text>
        <TouchableOpacity onPress={resetFilters}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.optionGrid}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'custom', label: 'Custom' },
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionButton,
                  filters.dateRange === option.key && styles.optionButtonActive,
                ]}
                onPress={() => updateFilter('dateRange', option.key as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    filters.dateRange === option.key && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Status</Text>
          <View style={styles.checkboxGroup}>
            {[
              { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
              { key: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
              { key: 'issue', label: 'Issues', icon: 'alert-circle' },
            ].map(status => (
              <TouchableOpacity
                key={status.key}
                style={styles.checkbox}
                onPress={() => toggleStatus(status.key as any)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    filters.status.includes(status.key as any) &&
                      styles.checkboxBoxChecked,
                  ]}
                >
                  {filters.status.includes(status.key as any) && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </View>
                <Ionicons
                  name={status.icon as any}
                  size={20}
                  color={Colors.gray[500]}
                  style={styles.checkboxIcon}
                />
                <Text style={styles.checkboxLabel}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Earnings Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Range</Text>
          <View style={styles.rangeInputs}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Min (CI$)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>CI$</Text>
                <Text style={styles.rangeValue}>
                  {filters.minEarnings || '0'}
                </Text>
              </View>
            </View>
            <Text style={styles.rangeSeparator}>-</Text>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeLabel}>Max (CI$)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>CI$</Text>
                <Text style={styles.rangeValue}>
                  {filters.maxEarnings || '∞'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rider Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Rider Rating</Text>
          <View style={styles.ratingOptions}>
            {[1, 2, 3, 4, 5].map(rating => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  filters.minRating === rating && styles.ratingButtonActive,
                ]}
                onPress={() => updateFilter('minRating', rating)}
              >
                <Ionicons
                  name={filters.minRating <= rating ? 'star' : 'star-outline'}
                  size={24}
                  color={
                    filters.minRating === rating
                      ? Colors.warning[500]
                      : Colors.gray[400]
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            Show trips with riders rated {filters.minRating}+ stars
          </Text>
        </View>

        {/* Sort Options Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            {[
              { key: 'date', label: 'Date', icon: 'calendar-outline' },
              { key: 'earnings', label: 'Earnings', icon: 'cash-outline' },
              { key: 'rating', label: 'Rating', icon: 'star-outline' },
            ].map(sort => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.sortButton,
                  filters.sortBy === sort.key && styles.sortButtonActive,
                ]}
                onPress={() => updateFilter('sortBy', sort.key as any)}
              >
                <Ionicons
                  name={sort.icon as any}
                  size={20}
                  color={
                    filters.sortBy === sort.key
                      ? Colors.primary[500]
                      : Colors.gray[500]
                  }
                />
                <Text
                  style={[
                    styles.sortText,
                    filters.sortBy === sort.key && styles.sortTextActive,
                  ]}
                >
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Order */}
          <View style={styles.sortOrderContainer}>
            <TouchableOpacity
              style={[
                styles.sortOrderButton,
                filters.sortOrder === 'desc' && styles.sortOrderButtonActive,
              ]}
              onPress={() => updateFilter('sortOrder', 'desc')}
            >
              <Ionicons
                name="arrow-down"
                size={20}
                color={
                  filters.sortOrder === 'desc'
                    ? Colors.primary[500]
                    : Colors.gray[500]
                }
              />
              <Text
                style={[
                  styles.sortOrderText,
                  filters.sortOrder === 'desc' && styles.sortOrderTextActive,
                ]}
              >
                Descending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOrderButton,
                filters.sortOrder === 'asc' && styles.sortOrderButtonActive,
              ]}
              onPress={() => updateFilter('sortOrder', 'asc')}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  filters.sortOrder === 'asc'
                    ? Colors.primary[500]
                    : Colors.gray[500]
                }
              />
              <Text
                style={[
                  styles.sortOrderText,
                  filters.sortOrder === 'asc' && styles.sortOrderTextActive,
                ]}
              >
                Ascending
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Active Filters</Text>
          <View style={styles.summaryTags}>
            {filters.status.map(status => (
              <View key={status} style={styles.summaryTag}>
                <Text style={styles.summaryTagText}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            ))}
            <View style={styles.summaryTag}>
              <Text style={styles.summaryTagText}>
                {filters.dateRange === 'today'
                  ? 'Today'
                  : filters.dateRange === 'week'
                  ? 'This Week'
                  : filters.dateRange === 'month'
                  ? 'This Month'
                  : 'Custom Range'}
              </Text>
            </View>
            {filters.minRating > 1 && (
              <View style={styles.summaryTag}>
                <Text style={styles.summaryTagText}>
                  {filters.minRating}+ Stars
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  resetText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[500],
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  optionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  optionTextActive: {
    color: Colors.primary[500],
    fontFamily: Typography.fontFamily.bold,
  },
  checkboxGroup: {
    gap: Spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  checkboxIcon: {
    marginRight: Spacing.xs,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    marginRight: Spacing.xs,
  },
  rangeValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  rangeSeparator: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[400],
    paddingTop: Spacing.lg,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: Colors.warning[50],
    borderColor: Colors.warning[500],
  },
  ratingHint: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  sortButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  sortTextActive: {
    color: Colors.primary[500],
    fontFamily: Typography.fontFamily.bold,
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  sortOrderButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  sortOrderText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  sortOrderTextActive: {
    color: Colors.primary[500],
    fontFamily: Typography.fontFamily.bold,
  },
  summarySection: {
    backgroundColor: Colors.gray[100],
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  summaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  summaryTag: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
  },
  summaryTagText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  applyButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});