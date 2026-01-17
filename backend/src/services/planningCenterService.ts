import axios from 'axios';
import pool from '../db.js';

interface PlanningCenterConfig {
  apiKey: string;
  appId: string;
  baseUrl?: string;
}

export class PlanningCenterService {
  private config: PlanningCenterConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      apiKey: process.env.PLANNING_CENTER_API_KEY || '',
      appId: process.env.PLANNING_CENTER_APP_ID || '',
      baseUrl: process.env.PLANNING_CENTER_BASE_URL || 'https://api.planningcenteronline.com'
    };
    this.baseUrl = this.config.baseUrl;
  }

  private getAuthHeader(): string {
    // Planning Center uses Basic Auth with app_id:api_key
    const credentials = Buffer.from(`${this.config.appId}:${this.config.apiKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async createWorkflow(workflowData: any) {
    try {
      if (!this.config.apiKey || !this.config.appId) {
        console.log('Planning Center API not configured, skipping workflow creation');
        return null;
      }

      const response = await axios.post(
        `${this.baseUrl}/workflows/v2/workflows`,
        workflowData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating Planning Center workflow:', error.message);
      return null;
    }
  }

  async createPerson(personData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }) {
    try {
      if (!this.config.apiKey || !this.config.appId) {
        console.log('Planning Center API not configured, skipping person creation');
        return null;
      }

      const response = await axios.post(
        `${this.baseUrl}/people/v2/people`,
        personData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating Planning Center person:', error.message);
      return null;
    }
  }

  async syncContactToPlanningCenter(contactId: string) {
    try {
      const contactResult = await pool.query(
        'SELECT * FROM "Contact" WHERE id = $1',
        [contactId]
      );

      if (contactResult.rows.length === 0) {
        throw new Error('Contact not found');
      }

      const contact = contactResult.rows[0];

      // Create person in Planning Center
      const nameParts = contact.name.split(' ');
      const personData = {
        first_name: nameParts[0] || contact.name,
        last_name: nameParts.slice(1).join(' ') || '',
        email: contact.email || undefined,
        phone: contact.phone || undefined
      };

      const planningCenterPerson = await this.createPerson(personData);

      if (planningCenterPerson) {
        // Store Planning Center ID if needed
        // await prisma.contact.update({
        //   where: { id: contactId },
        //   data: { planningCenterId: planningCenterPerson.data.id }
        // });
      }

      return planningCenterPerson;
    } catch (error: any) {
      console.error('Error syncing contact to Planning Center:', error.message);
      return null;
    }
  }

  async findPersonByEmail(email: string) {
    try {
      if (!this.config.apiKey || !this.config.appId) {
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}/people/v2/people`,
        {
          params: {
            where: { email_address: email }
          },
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.data && response.data.data.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error: any) {
      console.error('Error finding person by email:', error.message);
      return null;
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
      console.error('Error getting user info:', error.message);
      return null;
    }
  }
}

export const planningCenterService = new PlanningCenterService();
