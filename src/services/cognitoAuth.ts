import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails, 
  CognitoUserSession,
  CognitoUserAttribute,
  CognitoRefreshToken
} from 'amazon-cognito-identity-js';
import { userPool } from '../config/cognito';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

class CognitoAuthService {
  private currentUser: CognitoUser | null = null;
  private currentSession: CognitoUserSession | null = null;

  /**
   * Sign in user with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<{ user: AuthUser; session: CognitoUserSession }> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: credentials.email,
        Password: credentials.password,
      });

      const cognitoUser = new CognitoUser({
        Username: credentials.email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (session: CognitoUserSession) => {
          this.currentUser = cognitoUser;
          this.currentSession = session;
          
          // Store tokens
          this.storeTokens(session);
          
          try {
            // Get user attributes
            const user = await this.getCurrentUserInfo();
            resolve({ user, session });
          } catch (error) {
            reject(error);
          }
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Authentication failed'));
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          // Handle new password required (first-time login)
          reject(new Error('New password required. Please contact administrator.'));
        },
        mfaRequired: (challengeName, challengeParameters) => {
          // Handle MFA if enabled
          reject(new Error('MFA not supported in this implementation'));
        }
      });
    });
  }

  /**
   * Sign up new user (if you want to allow self-registration)
   */
  async signUp(credentials: SignUpCredentials): Promise<{ userSub: string }> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: credentials.email,
        }),
        new CognitoUserAttribute({
          Name: 'given_name',
          Value: credentials.firstName,
        }),
        new CognitoUserAttribute({
          Name: 'family_name',
          Value: credentials.lastName,
        }),
      ];

      userPool.signUp(
        credentials.email,
        credentials.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            reject(new Error(err.message || 'Sign up failed'));
            return;
          }
          
          if (result?.userSub) {
            resolve({ userSub: result.userSub });
          } else {
            reject(new Error('Sign up failed'));
          }
        }
      );
    });
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentUser) {
        this.currentUser.signOut(() => {
          this.currentUser = null;
          this.currentSession = null;
          this.clearTokens();
          resolve();
        });
      } else {
        this.clearTokens();
        resolve();
      }
    });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      return null;
    }

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          resolve(null);
          return;
        }

        if (!session.isValid()) {
          resolve(null);
          return;
        }

        this.currentUser = cognitoUser;
        this.currentSession = session;
        
        // Update stored tokens
        this.storeTokens(session);

        // Get user info
        this.getCurrentUserInfo()
          .then(resolve)
          .catch(() => resolve(null));
      });
    });
  }

  /**
   * Get current user info from attributes
   */
  private async getCurrentUserInfo(): Promise<AuthUser> {
    if (!this.currentUser) {
      throw new Error('No current user');
    }

    return new Promise((resolve, reject) => {
      this.currentUser!.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        const attrMap = attributes?.reduce((acc, attr) => {
          acc[attr.getName()] = attr.getValue();
          return acc;
        }, {} as { [key: string]: string }) || {};

        // Extract user info from token and attributes
        const idToken = this.currentSession?.getIdToken();
        const payload = idToken?.decodePayload();

        resolve({
          id: payload?.sub || '',
          email: attrMap['email'] || '',
          firstName: attrMap['given_name'] || '',
          lastName: attrMap['family_name'] || '',
          role: (attrMap['custom:role'] as 'admin' | 'user') || 'user',
          isActive: true
        });
      });
    });
  }

  /**
   * Get current ID token
   */
  getIdToken(): string | null {
    return this.currentSession?.getIdToken().getJwtToken() || localStorage.getItem('cognitoIdToken');
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.currentSession?.getAccessToken().getJwtToken() || localStorage.getItem('cognitoAccessToken');
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<CognitoUserSession> {
    if (!this.currentUser || !this.currentSession) {
      throw new Error('No current user or session');
    }

    const refreshToken = this.currentSession.getRefreshToken();

    return new Promise((resolve, reject) => {
      this.currentUser!.refreshSession(refreshToken, (err, session) => {
        if (err) {
          reject(err);
          return;
        }

        this.currentSession = session;
        this.storeTokens(session);
        resolve(session);
      });
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getIdToken();
    if (!token) return false;

    try {
      // Basic token expiry check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(session: CognitoUserSession): void {
    localStorage.setItem('cognitoIdToken', session.getIdToken().getJwtToken());
    localStorage.setItem('cognitoAccessToken', session.getAccessToken().getJwtToken());
    localStorage.setItem('cognitoRefreshToken', session.getRefreshToken().getToken());
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem('cognitoIdToken');
    localStorage.removeItem('cognitoAccessToken');
    localStorage.removeItem('cognitoRefreshToken');
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Forgot password failed'));
        },
      });
    });
  }

  /**
   * Confirm forgot password with code
   */
  async confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Password confirmation failed'));
        },
      });
    });
  }
}

export const cognitoAuthService = new CognitoAuthService();