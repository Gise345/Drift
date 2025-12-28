/**
 * DEBUG LOG VIEWER
 * On-screen log viewer for debugging on preview/production builds
 *
 * Usage: Add <DebugLogViewer /> to your root layout
 * Triple-tap anywhere to toggle the log viewer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debugLogger, LogEntry, LogLevel } from '@/src/utils/debug-logger';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LEVEL_COLORS: Record<LogLevel, string> = {
  log: '#4CAF50',
  info: '#2196F3',
  warn: '#FF9800',
  error: '#F44336',
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  log: 'checkmark-circle',
  info: 'information-circle',
  warn: 'warning',
  error: 'close-circle',
};

interface DebugLogViewerProps {
  /** Enable triple-tap to show logs (default: true) */
  enableGesture?: boolean;
  /** Filter to only show logs containing these keywords */
  defaultFilter?: string;
}

export function DebugLogViewer({
  enableGesture = true,
  defaultFilter = '',
}: DebugLogViewerProps) {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState(defaultFilter);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize logger on mount
  useEffect(() => {
    debugLogger.init();
  }, []);

  // Subscribe to log updates
  useEffect(() => {
    const unsubscribe = debugLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Get initial logs
    setLogs(debugLogger.getLogs());

    return unsubscribe;
  }, []);

  // Handle triple tap
  const handleTap = useCallback(() => {
    if (!enableGesture) return;

    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      setVisible(true);
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    }
  }, [enableGesture]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) {
      return false;
    }
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Share logs
  const handleShare = async () => {
    try {
      const logText = debugLogger.exportLogs();
      await Share.share({
        message: logText,
        title: 'Debug Logs',
      });
    } catch (error) {
      console.error('Failed to share logs:', error);
    }
  };

  // Clear logs
  const handleClear = () => {
    debugLogger.clear();
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      {/* Invisible tap area for gesture detection */}
      {enableGesture && !visible && (
        <TouchableOpacity
          style={styles.tapArea}
          onPress={handleTap}
          activeOpacity={1}
        />
      )}

      {/* Log Viewer Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Debug Logs</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleClear}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filters}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter logs..."
              placeholderTextColor="#666"
              value={filter}
              onChangeText={setFilter}
            />
            <View style={styles.levelFilters}>
              {(['all', 'log', 'info', 'warn', 'error'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    levelFilter === level && styles.levelButtonActive,
                    level !== 'all' && { borderColor: LEVEL_COLORS[level] },
                  ]}
                  onPress={() => setLevelFilter(level)}
                >
                  <Text
                    style={[
                      styles.levelButtonText,
                      levelFilter === level && styles.levelButtonTextActive,
                    ]}
                  >
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Log count */}
          <View style={styles.countBar}>
            <Text style={styles.countText}>
              Showing {filteredLogs.length} of {logs.length} logs
            </Text>
            <TouchableOpacity
              style={[styles.autoScrollButton, autoScroll && styles.autoScrollActive]}
              onPress={() => setAutoScroll(!autoScroll)}
            >
              <Text style={styles.autoScrollText}>
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logs */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.logList}
            contentContainerStyle={styles.logListContent}
          >
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No logs to display</Text>
                <Text style={styles.emptySubtext}>
                  Logs will appear here as they are generated
                </Text>
              </View>
            ) : (
              filteredLogs.map((log) => (
                <View key={log.id} style={styles.logEntry}>
                  <View style={styles.logHeader}>
                    <Ionicons
                      name={LEVEL_ICONS[log.level] as any}
                      size={14}
                      color={LEVEL_COLORS[log.level]}
                    />
                    <Text style={[styles.logLevel, { color: LEVEL_COLORS[log.level] }]}>
                      {log.level.toUpperCase()}
                    </Text>
                    <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                  </View>
                  <Text style={styles.logMessage} selectable>
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Quick filter buttons for payment debugging */}
          <View style={styles.quickFilters}>
            <Text style={styles.quickFilterLabel}>Quick:</Text>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setFilter('payment')}
            >
              <Text style={styles.quickFilterText}>Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setFilter('💰')}
            >
              <Text style={styles.quickFilterText}>💰</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setFilter('💳')}
            >
              <Text style={styles.quickFilterText}>💳</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setFilter('trip')}
            >
              <Text style={styles.quickFilterText}>Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickFilterButton}
              onPress={() => setFilter('')}
            >
              <Text style={styles.quickFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// Floating button to open logs (alternative to triple-tap)
export function DebugLogButton() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    debugLogger.init();
    const unsubscribe = debugLogger.subscribe(setLogs);
    setLogs(debugLogger.getLogs());
    return unsubscribe;
  }, []);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="bug" size={24} color="#fff" />
        {(errorCount > 0 || warnCount > 0) && (
          <View
            style={[
              styles.badge,
              errorCount > 0 ? styles.badgeError : styles.badgeWarn,
            ]}
          >
            <Text style={styles.badgeText}>{errorCount || warnCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {visible && (
        <DebugLogViewer enableGesture={false} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tapArea: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -50, // Center the 100px wide area
    width: 100,
    height: 100,
    zIndex: 9998,
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  filters: {
    padding: 12,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  levelFilters: {
    flexDirection: 'row',
    gap: 6,
  },
  levelButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  levelButtonActive: {
    backgroundColor: '#444',
  },
  levelButtonText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  countText: {
    color: '#888',
    fontSize: 12,
  },
  autoScrollButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  autoScrollActive: {
    backgroundColor: '#4CAF50',
  },
  autoScrollText: {
    color: '#fff',
    fontSize: 11,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  logEntry: {
    backgroundColor: '#252525',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#444',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logTime: {
    fontSize: 10,
    color: '#666',
    marginLeft: 'auto',
  },
  logMessage: {
    color: '#ddd',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 6,
  },
  quickFilterLabel: {
    color: '#888',
    fontSize: 12,
  },
  quickFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  quickFilterText: {
    color: '#fff',
    fontSize: 11,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5d1289',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeError: {
    backgroundColor: '#F44336',
  },
  badgeWarn: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
