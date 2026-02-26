import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface RegisterScreenProps {
  onRegister: () => void;
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onBackToLogin }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentText, setCurrentText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const welcomeText = 'Join Neurotype';

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start typing sequence
    const startTyping = () => {
      setIsTyping(true);
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index < welcomeText.length) {
          setCurrentText(welcomeText.substring(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
          setIsTypingComplete(true);
          setIsTyping(false);

          // Hide cursor after typing
          setTimeout(() => {
            setShowCursor(false);
          }, 800);
        }
      }, 80);
    };

    // Start typing after a short delay
    setTimeout(startTyping, 300);

  }, []);

  const handleRegister = () => {
    // Simple validation
    if (name.trim() && email.trim() && password.trim() && confirmPassword.trim()) {
      if (password === confirmPassword) {
        onRegister();
      }
    }
  };

  const handleSocialRegister = (provider: 'google' | 'facebook' | 'apple') => {
    // Handle social registration
    console.log(`Registering with ${provider}`);
    onRegister();
  };

  return (
    <>
      <StatusBar hidden={true} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Welcome Text Animation */}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, { color: theme.colors.text.primary }]}>
              {currentText}
              {showCursor && !isTyping && (
                <Animated.Text style={[styles.cursor, { color: theme.colors.text.primary }]}>
                  |
                </Animated.Text>
              )}
              {showCursor && isTyping && (
                <Text style={[styles.cursor, { color: theme.colors.text.primary }]}>
                  |
                </Text>
              )}
            </Text>
          </View>

          {/* Register Form */}
          <View style={[
            styles.formContainer,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
            }
          ]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.shadow,
                }
              ]}
              onPress={handleRegister}
              testID="register-button"
            >
              <Text style={[styles.registerButtonText, { color: theme.colors.text.onPrimary }]}>Create Account</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.text.secondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Social Register Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.googleButton,
                  {
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                  }
                ]}
                onPress={() => handleSocialRegister('google')}
                testID="google-register-button"
              >
                <View style={styles.iconContainer}>
                  <Text style={[styles.iconText, styles.googleIcon]}>G</Text>
                </View>
                <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>Sign up with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  styles.facebookButton,
                  {
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.shadow,
                  }
                ]}
                onPress={() => handleSocialRegister('facebook')}
                testID="facebook-register-button"
              >
                <View style={styles.iconContainer}>
                  <Text style={[styles.iconText, styles.facebookIcon]}>f</Text>
                </View>
                <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>Sign up with Facebook</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    styles.appleButton,
                    {
                      backgroundColor: theme.colors.surface,
                      shadowColor: theme.colors.shadow,
                    }
                  ]}
                  onPress={() => handleSocialRegister('apple')}
                  testID="apple-register-button"
                >
                  <View style={styles.iconContainer}>
                    <Text style={[styles.iconText, styles.appleIcon]}>⌘</Text>
                  </View>
                  <Text style={[styles.socialButtonText, { color: theme.colors.text.primary }]}>Sign up with Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.colors.text.secondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  welcomeContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  cursor: {
    fontSize: 32,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 2,
    fontFamily: 'System',
  },
  registerButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  socialButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  googleIcon: {
    color: '#DB4437',
  },
  facebookIcon: {
    color: '#4267B2',
  },
  appleIcon: {
    color: '#000000',
  },
  googleButton: {
    borderColor: '#DB4437',
  },
  facebookButton: {
    borderColor: '#4267B2',
  },
  appleButton: {
    borderColor: '#000000',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
});
