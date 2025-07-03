import express from 'express';
import cors from 'cors';
import { featureFlags } from '@ai2/shared';

const app = express();
const PORT = process.env.ANALYTICS_PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics',
    version: '1.0.0',
    features: {
      analytics: featureFlags.isFeatureEnabled('enableAnalytics'),
      advancedReporting: featureFlags.isFeatureEnabled('enableAdvancedReporting'),
      exports: featureFlags.isFeatureEnabled('enableExports')
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on port ${PORT}`);
  });
}

export default app; 