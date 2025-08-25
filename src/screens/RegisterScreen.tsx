import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { theme } from '../styles/theme';

interface RegisterScreenProps {
  onRegister: () => void;
  onBackToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onBackToLogin }) => {
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
        style={styles.container} 
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
            <Text style={styles.welcomeText}>
              {currentText}
              {showCursor && !isTyping && (
                <Animated.Text style={styles.cursor}>
                  |
                </Animated.Text>
              )}
              {showCursor && isTyping && (
                <Text style={styles.cursor}>
                  |
                </Text>
              )}
            </Text>
          </View>

          {/* Register Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
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
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
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
              style={styles.registerButton}
              onPress={handleRegister}
              testID="register-button"
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Register Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialRegister('google')}
                testID="google-register-button"
              >
                <View style={styles.iconContainer}>
                  <Text style={[styles.iconText, styles.googleIcon]}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialRegister('facebook')}
                testID="facebook-register-button"
              >
                <View style={styles.iconContainer}>
                  <Text style={[styles.iconText, styles.facebookIcon]}>f</Text>
                </View>
                <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={() => handleSocialRegister('apple')}
                  testID="apple-register-button"
                >
                  <View style={styles.iconContainer}>
                    <Text style={[styles.iconText, styles.appleIcon]}>⌘</Text>
                  </View>
                  <Text style={styles.socialButtonText}>Sign up with Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.loginLink}>Sign in</Text>
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
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  welcomeContainer: {
    marginBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: 'System',
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0.5,
  },
  cursor: {
    fontSize: 32,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    fontFamily: 'System',
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.onPrimary,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  socialButtonsContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
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
    marginRight: theme.spacing.md,
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
    color: theme.colors.text.primary,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loginText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  loginLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'System',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
}); 