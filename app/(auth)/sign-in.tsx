import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { DriftInput, PasswordInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import { signInWithEmail } from '@/src/services/firebase-auth-service';
import { signInWithGoogle } from '@/src/services/google-auth';

export default function SignInScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleLogin = async () => {
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      const user = await signInWithEmail(email.trim().toLowerCase(), password);
      
      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before signing in. Check your inbox for the verification link.',
          [
            {
              text: 'Resend Email',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/email-verification',
                  params: { email: user.email },
                }),
            },
            { text: 'OK' },
          ]
        );
        return;
      }

      setUser(user);

      if (user.roles.includes('DRIVER')) {
        router.replace('/(driver)/tabs');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.success && result.user) {
        setUser({
          ...result.user,
          photoURL: result.user.photoURL || undefined,
        });

        if (result.user.roles.includes('DRIVER')) {
          router.replace('/(driver)/tabs');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Google Sign-In Failed', result.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const isValid = validateEmail(email) && password.length >= 6;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('@/assets/images/NeonPalms.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <Image
          source={require('@/assets/cayman-flag-faded.png')}
          style={styles.flag}
        />
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            {/* Logo / Header */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/drift-logo-purple.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue drifting around Cayman.
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <DriftInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                showValidation
                isValid={validateEmail(email)}
              />

              <PasswordInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <DriftButton
                title="Sign In"
                onPress={handleLogin}
                variant="black"
                size="large"
                icon={<ArrowRight />}
                loading={loading}
                disabled={!isValid || googleLoading}
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color={Colors.gray[100]} />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legalNotice}>
              <Text style={styles.legalText}>
                By continuing, you agree to Drift&apos;s peer-to-peer carpooling terms. 
                Drift is not a taxi or rideshare service.
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Need help? <Text style={styles.helpLink}>Contact Support</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  flag: {
    position: 'absolute',
    right: -40,
    top: 40,
    width: 220,
    height: 220,
    opacity: 0.15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 26,
    color: Colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 320,
    height: 110,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(10,10,20,0.9)',
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.gray[500],
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[200],
  },
  forgotText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.purple[500] || Colors.purple,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
  },
  googleButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[50],
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signUpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[200],
  },
  signUpLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.purple[400] || Colors.purple,
    fontWeight: '700',
  },
  legalNotice: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  legalText: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 18,
  },
  helpSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  helpLink: {
    color: Colors.purple[400] || Colors.purple,
    fontWeight: '600',
  },
});
