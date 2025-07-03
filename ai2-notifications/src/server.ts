import express from 'express';
import cors from 'cors';
import { featureFlags } from '@ai2/shared';

const app = express();
const PORT = process.env.NOTIFICATIONS_PORT || 3006;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notifications',
    version: '1.0.0',
    features: {
      notifications: featureFlags.isFeatureEnabled('enableNotifications'),
      email: featureFlags.isFeatureEnabled('enableEmailNotifications'),
      sms: featureFlags.isFeatureEnabled('enableSMSNotifications'),
      push: featureFlags.isFeatureEnabled('enablePushNotifications')
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔔 Notifications Service running on port ${PORT}`);
  });
}

export default app; 