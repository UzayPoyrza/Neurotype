import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
  initialHour?: number;
  initialMinute?: number;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialHour = 9,
  initialMinute = 0,
}) => {
  const theme = useTheme();

  // Convert 24-hour to 12-hour format for display
  const get12Hour = (hour24: number) => {
    if (hour24 === 0) return 12;
    if (hour24 <= 12) return hour24;
    return hour24 - 12;
  };

  const [selectedHour12, setSelectedHour12] = useState(get12Hour(initialHour));
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
    initialHour >= 12 ? 'PM' : 'AM'
  );

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Update state when initial values change
  useEffect(() => {
    if (visible) {
      const hour12 = get12Hour(initialHour);
      const period = initialHour >= 12 ? 'PM' : 'AM';
      setSelectedHour12(hour12);
      setSelectedMinute(initialMinute);
      setSelectedPeriod(period);
    }
  }, [visible, initialHour, initialMinute]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scroll to initial values after a short delay
      setTimeout(() => {
        const hour12 = get12Hour(initialHour);
        const hourIndex = hour12 - 1; // 1-12 becomes 0-11
        scrollToValue(hourScrollRef, hourIndex, ITEM_HEIGHT);
        scrollToValue(minuteScrollRef, initialMinute, ITEM_HEIGHT);
        const period = initialHour >= 12 ? 'PM' : 'AM';
        scrollToValue(periodScrollRef, period === 'AM' ? 0 : 1, ITEM_HEIGHT);
      }, 150);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialHour, initialMinute]);

  const scrollToValue = (scrollRef: React.RefObject<ScrollView>, index: number, itemHeight: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        y: index * itemHeight,
        animated: true,
      });
    }
  };

  const handleHourScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const hour12 = index + 1; // 0-11 becomes 1-12
    setSelectedHour12(hour12);
  };

  const handleMinuteScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    setSelectedMinute(index);
  };

  const handlePeriodScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const period = index === 0 ? 'AM' : 'PM';
    setSelectedPeriod(period);
  };

  const handleConfirm = () => {
    // Convert 12-hour to 24-hour format
    let hour24: number;
    if (selectedPeriod === 'AM') {
      hour24 = selectedHour12 === 12 ? 0 : selectedHour12;
    } else {
      hour24 = selectedHour12 === 12 ? 12 : selectedHour12 + 12;
    }

    onConfirm(hour24, selectedMinute);
    onClose();
  };

  // Generate arrays for picker values
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
            },
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Customise Reminder Time</Text>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.colors.surfaceElevated }]}
              >
                <Text style={[styles.closeText, { color: theme.colors.text.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Prompt Text */}
            <Text style={[styles.promptText, { color: theme.colors.text.secondary }]}>
              What time would you like to be notified? (You won't receive a notification if you completed any meditation that day.)
            </Text>

            {/* Time Picker */}
            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerWrapper}>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleHourScroll}
                  onScrollEndDrag={handleHourScroll}
                >
                  {hours.map((hour) => (
                    <View key={hour} style={styles.pickerItem}>
                      <Text style={[styles.pickerItemText, { color: theme.colors.text.primary }]}>{hour}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View
                  style={[
                    styles.pickerOverlay,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.isDark
                        ? 'rgba(44, 44, 46, 0.5)'
                        : 'rgba(255, 255, 255, 0.5)',
                    },
                  ]}
                  pointerEvents="none"
                />
              </View>

              {/* Colon */}
              <Text style={[styles.colon, { color: theme.colors.text.primary }]}>:</Text>

              {/* Minute Picker */}
              <View style={styles.pickerWrapper}>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinuteScroll}
                  onScrollEndDrag={handleMinuteScroll}
                >
                  {minutes.map((minute) => (
                    <View key={minute} style={styles.pickerItem}>
                      <Text style={[styles.pickerItemText, { color: theme.colors.text.primary }]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <View
                  style={[
                    styles.pickerOverlay,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.isDark
                        ? 'rgba(44, 44, 46, 0.5)'
                        : 'rgba(255, 255, 255, 0.5)',
                    },
                  ]}
                  pointerEvents="none"
                />
              </View>

              {/* Period Picker */}
              <View style={styles.pickerWrapper}>
                <ScrollView
                  ref={periodScrollRef}
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handlePeriodScroll}
                  onScrollEndDrag={handlePeriodScroll}
                >
                  {periods.map((period) => (
                    <View key={period} style={styles.pickerItem}>
                      <Text style={[styles.pickerItemText, { color: theme.colors.text.primary }]}>{period}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View
                  style={[
                    styles.pickerOverlay,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.isDark
                        ? 'rgba(44, 44, 46, 0.5)'
                        : 'rgba(255, 255, 255, 0.5)',
                    },
                  ]}
                  pointerEvents="none"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  promptText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    height: PICKER_HEIGHT,
  },
  pickerWrapper: {
    height: PICKER_HEIGHT,
    position: 'relative',
    flex: 1,
    maxWidth: 80,
  },
  picker: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 24,
    fontWeight: '500',
  },
  pickerOverlay: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  colon: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
