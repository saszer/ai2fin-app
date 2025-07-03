import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.NOTIFICATIONS_PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notifications',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
      pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true'
    }
  });
});

// Notification endpoints
app.get('/api/notifications/status', (req, res) => {
  res.json({
    service: 'Notifications',
    status: 'active',
    capabilities: [
      'email',
      'sms',
      'push',
      'webhooks'
    ],
    version: '1.0.0'
  });
});

app.post('/api/notifications/send', async (req, res) => {
  try {
    const { type, recipient, subject, message, priority = 'normal' } = req.body;
    
    // Mock notification sending
    const notification = {
      id: `notif_${Date.now()}`,
      type,
      recipient,
      subject,
      message,
      priority,
      status: 'sent',
      sentAt: new Date().toISOString(),
      deliveryConfirmation: {
        email: type === 'email' ? 'delivered' : 'n/a',
        sms: type === 'sms' ? 'delivered' : 'n/a',
        push: type === 'push' ? 'delivered' : 'n/a'
      }
    };

    res.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Notification sending failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/notifications/batch', async (req, res) => {
  try {
    const { notifications } = req.body;
    
    const results = notifications.map((notif: any) => ({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalId: notif.id,
      type: notif.type,
      recipient: notif.recipient,
      status: 'sent',
      sentAt: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: { results, processed: notifications.length },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch notification failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/notifications/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Mock notification history
    const history = Array.from({ length: Math.min(Number(limit), 50) }, (_, i) => ({
      id: `notif_${Date.now() - i * 1000}`,
      type: ['email', 'sms', 'push'][i % 3],
      recipient: `user${i + 1}@example.com`,
      subject: `Notification ${i + 1}`,
      status: 'sent',
      sentAt: new Date(Date.now() - i * 1000).toISOString()
    }));

    res.json({
      success: true,
      data: {
        notifications: history,
        total: 1250,
        limit: Number(limit),
        offset: Number(offset)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification history',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/notifications/templates', async (req, res) => {
  try {
    const { name, type, subject, body, variables } = req.body;
    
    // Mock template creation
    const template = {
      id: `template_${Date.now()}`,
      name,
      type,
      subject,
      body,
      variables,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Template creation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔔 Notifications Service running on port ${PORT}`);
    console.log(`📧 Email Notifications: ${process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📱 SMS Notifications: ${process.env.ENABLE_SMS_NOTIFICATIONS === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`📲 Push Notifications: ${process.env.ENABLE_PUSH_NOTIFICATIONS === 'true' ? 'Enabled' : 'Disabled'}`);
  });
}

export default app; 