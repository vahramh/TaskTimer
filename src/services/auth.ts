import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, fetchUserAttributes, resetPassword, confirmResetPassword, confirmSignIn } from '@aws-amplify/auth';
import awsconfig from '../aws-exports';

Amplify.configure(awsconfig);

export interface User {
  username: string;
  email: string;
  attributes: {
    email: string;
    sub: string;
    [key: string]: any;
  };
}

export class AuthService {
  /**
   * Check if user is currently authenticated with valid tokens
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have a valid auth session
      const session = await fetchAuthSession();
      
      // Verify tokens exist and are valid
      if (!session.tokens || !session.tokens.accessToken) {
        console.log('🔍 No access token found');
        return false;
      }

      // Additional check: verify we can get current user
      try {
        await getCurrentUser();
        console.log('✅ Authentication valid');
        return true;
      } catch (userError) {
        console.log('❌ Cannot get current user:', userError);
        return false;
      }
      
    } catch (error) {
      console.log('❌ Authentication check failed:', error);
      return false;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      // First, try to sign out any existing user
      try {
        await signOut();
        console.log('🔄 Signed out existing user');
      } catch (e) {
        console.log('ℹ️ No existing user to sign out');
      }

      const signInResult = await signIn({ username: email, password });
      
      console.log('🔍 Sign-in result details:', signInResult);
      
      // Check if user is actually signed in
      if (signInResult.isSignedIn) {
        return { success: true, user: signInResult };
      }
      
      // Check for various next steps
      if (signInResult.nextStep) {
        const step = signInResult.nextStep.signInStep;
        
        if (step === 'RESET_PASSWORD') {
          return { 
            success: false, 
            requiresPasswordReset: true, 
            username: email,
            error: 'Password reset required' 
          };
        }
        
        if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          return { 
            success: false, 
            requiresNewPassword: true, 
            signInResult,
            error: 'New password required' 
          };
        }
      }
      
      return { success: false, error: 'Sign-in incomplete' };
    } catch (error: any) {
      console.error('🚨 Sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  static async setNewPassword(newPassword: string) {
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      return { success: true, user: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async resetPassword(username: string) {
    try {
      await resetPassword({ username });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async confirmResetPassword(username: string, confirmationCode: string, newPassword: string) {
    try {
      await confirmResetPassword({ username, confirmationCode, newPassword });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async signOut() {
    try {
      await signOut({ global: true }); // Global sign out clears all sessions
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const authUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      return {
        username: authUser.username,
        email: userAttributes.email || '',
        attributes: {
          email: userAttributes.email || '',
          sub: userAttributes.sub || '',
          ...userAttributes
        }
      };
    } catch {
      return null;
    }
  }

  static async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }

  static async checkAuthState(): Promise<User | null> {
    try {
      return await this.getCurrentUser();
    } catch {
      return null;
    }
  }
}