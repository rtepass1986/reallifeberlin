import axios from 'axios';
import pool from '../db.js';

interface PlanningCenterOIDCConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl?: string;
}

export class PlanningCenterAuth {
  private config: PlanningCenterOIDCConfig;
  private baseUrl: string;
  private discoveryUrl: string;

  constructor() {
    this.config = {
      clientId: process.env.PLANNING_CENTER_CLIENT_ID || '',
      clientSecret: process.env.PLANNING_CENTER_CLIENT_SECRET || '',
      redirectUri: process.env.PLANNING_CENTER_REDIRECT_URI || 'http://localhost:5173/auth/callback',
      baseUrl: process.env.PLANNING_CENTER_BASE_URL || 'https://api.planningcenteronline.com'
    };
    this.baseUrl = this.config.baseUrl;
    this.discoveryUrl = `${this.baseUrl}/.well-known/openid-configuration`;
  }

  async getAuthorizationUrl(state?: string): Promise<string> {
    if (!this.config.clientId) {
      throw new Error('Planning Center CLIENT_ID is not configured');
    }
    if (!this.config.redirectUri) {
      throw new Error('Planning Center REDIRECT_URI is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      ...(state && { state })
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Planning Center OAuth not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/oauth/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw error;
    }
  }

  async findOrCreateUser(planningCenterUser: any) {
    try {
      const email = planningCenterUser.email || planningCenterUser.sub;
      const name = planningCenterUser.name || `${planningCenterUser.given_name || ''} ${planningCenterUser.family_name || ''}`.trim() || email;

      // Check if user exists
      const existingUserResult = await pool.query(
        'SELECT * FROM "User" WHERE email = $1',
        [email]
      );

      let user;
      if (existingUserResult.rows.length === 0) {
        // Create new user from Planning Center
        const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const result = await pool.query(
          `INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
           RETURNING *`,
          [id, email, name, '', 'VIEWER']
        );
        user = result.rows[0];
      } else {
        // Update user info from Planning Center
        const result = await pool.query(
          `UPDATE "User" 
           SET name = $1, "updatedAt" = NOW()
           WHERE id = $2
           RETURNING *`,
          [name, existingUserResult.rows[0].id]
        );
        user = result.rows[0];
      }

      return user;
    } catch (error: any) {
      console.error('Error finding or creating user:', error.message);
      throw error;
    }
  }
}

export const planningCenterAuth = new PlanningCenterAuth();
