import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

// Replace these with your actual Cognito configuration
const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'your_user_pool_id',
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || 'your_client_id'
};

export const userPool = new CognitoUserPool(poolData);

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
}

export const cognitoConfig: CognitoConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-southeast-2',
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || ''
};