import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationData {
  [key: string]: any;
}

export async function sendNotification(
  type: 'connector' | 'small_group_leader',
  data: NotificationData
) {
  try {
    if (type === 'connector') {
      // Send via Peoples App API
      if (process.env.PEOPLES_APP_API_KEY && process.env.PEOPLES_APP_API_URL) {
        await axios.post(
          `${process.env.PEOPLES_APP_API_URL}/notifications`,
          {
            type: 'task_assigned',
            data
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.PEOPLES_APP_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Fallback: Log for now (can be replaced with WhatsApp or email)
        console.log('Notification to connector:', data);
      }
    } else if (type === 'small_group_leader') {
      // Send WhatsApp message to small group leader
      const contact = data.contact;
      const task = data.task;

      // Find small group leader for this contact
      // In a real implementation, you'd link contacts to small groups
      // For now, we'll try to find a small group leader
      const smallGroupLeader = await prisma.smallGroupLeader.findFirst({
        include: {
          user: true
        }
      });

      const whatsappNumber = smallGroupLeader?.whatsapp || contact.phone;

      if (process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_API_URL && whatsappNumber) {
        const message = `Neue Person in Kleingruppe:\n\n` +
          `Name: ${contact.name}\n` +
          `Telefon: ${contact.phone || 'N/A'}\n` +
          `Email: ${contact.email || 'N/A'}\n\n` +
          `Bitte bestätigen Sie die Anmeldung und folgen Sie bei Bedarf nach.`;

        await axios.post(
          `${process.env.WHATSAPP_API_URL}/messages`,
          {
            to: whatsappNumber,
            message
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Fallback: Log for now
        console.log('WhatsApp notification to small group leader:', {
          contact: contact.name,
          message: `New person joined: ${contact.name}`,
          whatsappNumber: whatsappNumber || 'Not configured'
        });
      }
    }
  } catch (error: any) {
    console.error('Error sending notification:', error.message);
    // Don't throw - notifications are not critical
  }
}
