import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { theme } from '../styles/theme';
import { mentalHealthModules } from '../data/modules';
import { useStore } from '../store/useStore';
import { ModuleGridModal } from './ModuleGridModal';
import { ChangeButtonDemoPage, HowToUsePage, CongratulationsOverlay } from '../screens/OnboardingScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HowToUseModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isVisible, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.95)).current;
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [demoModuleId, setDemoModuleId] = useState<string | null>(null);
  const previousDemoModuleId = useRef<string | null>(null);
  const [hasClickedChangeButton, setHasClickedChangeButton] = useState(false);
  const [hasScrolledOnHowToUse, setHasScrolledOnHowToUse] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsModule, setCongratulationsModule] = useState<{ title: string; color: string } | null>(null);
  const onCongratulationsCompleteRef = useRef<(() => void) | null>(null);

  const todayModuleId = useStore(state => state.todayModuleId);
  const initialModule = demoModuleId || selectedModule || todayModuleId || 'anxiety';

  useEffect(() => {
    if (isVisible) {
      setCurrentPage(0);
      setSelectedModule(todayModuleId || 'anxiety');
      setDemoModuleId(null);
      setHasClickedChangeButton(false);
      setHasScrolledOnHowToUse(false);
      setShowCongratulations(false);
      setCongratulationsModule(null);
      previousDemoModuleId.current = null;
    }
  }, [isVisible, todayModuleId]);

  useEffect(() => {
    if (currentPage === 0) {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          delay: 2000,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    if (currentPage !== 0) {
      setHasClickedChangeButton(false);
    }
    if (currentPage !== 1) {
      setHasScrolledOnHowToUse(false);
    }
  }, [currentPage]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < 1) {
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentPage + 1), animated: true });
    } else {
      onClose();
    }
  };

  const handleSelectModule = (moduleId: string) => {
    setSelectedModule(moduleId);
  };

  const handleDemoModuleChange = (moduleId: string) => {
    previousDemoModuleId.current = demoModuleId || selectedModule || 'anxiety';
    setDemoModuleId(moduleId);
    setSelectedModule(moduleId);
  };

  const getButtonText = () => {
    if (currentPage === 0) return hasClickedChangeButton ? 'Continue' : 'Click the change button';
    if (currentPage === 1) return hasScrolledOnHowToUse ? 'Got it!' : 'Scroll down';
    return 'Got it!';
  };

  const canProceed = () => {
    if (currentPage === 0 && !hasClickedChangeButton) return false;
    if (currentPage === 1 && !hasScrolledOnHowToUse) return false;
    return true;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          scrollEnabled={false}
        >
          <ChangeButtonDemoPage 
            selectedModule={initialModule}
            isActive={currentPage === 0}
            onModuleChange={handleDemoModuleChange}
            onShowModal={() => {
              setShowModuleModal(true);
              setTimeout(() => {
                setHasClickedChangeButton(true);
              }, 100);
            }}
            previousModuleId={previousDemoModuleId.current}
            onShowCongratulations={(show) => {
              setShowCongratulations(show);
              if (show) {
                const module = mentalHealthModules.find(m => m.id === (demoModuleId || selectedModule || 'anxiety'));
                if (module) {
                  setCongratulationsModule({ title: module.title, color: module.color });
                }
              }
            }}
            onCongratulationsComplete={(handler) => {
              onCongratulationsCompleteRef.current = handler;
            }}
          />
          <HowToUsePage 
            isActive={currentPage === 1}
            onScrollStateChange={(hasScrolled) => {
              if (currentPage === 1) {
                setHasScrolledOnHowToUse(hasScrolled);
              }
            }}
          />
        </ScrollView>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity 
            style={[styles.button, !canProceed() && styles.buttonDisabled]} 
            onPress={handleNext} 
            activeOpacity={0.7}
            disabled={!canProceed()}
          >
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showCongratulations && congratulationsModule && (
        <CongratulationsOverlay
          visible={showCongratulations}
          moduleTitle={congratulationsModule.title}
          moduleColor={congratulationsModule.color}
          onComplete={() => {
            setShowCongratulations(false);
            setCongratulationsModule(null);
            if (onCongratulationsCompleteRef.current) {
              onCongratulationsCompleteRef.current();
            }
          }}
        />
      )}

      {currentPage === 0 && (
        <ModuleGridModal
          modules={mentalHealthModules}
          selectedModuleId={demoModuleId || selectedModule || 'anxiety'}
          isVisible={showModuleModal}
          onModuleSelect={handleDemoModuleChange}
          onClose={() => setShowModuleModal(false)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
