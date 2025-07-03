import express from 'express';
import cors from 'cors';
import { featureFlags } from '@ai2/shared';

const app = express();
const PORT = process.env.CONNECTORS_PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'connectors',
    version: '1.0.0',
    features: {
      bankFeed: featureFlags.isFeatureEnabled('enableBankFeed'),
      emailConnector: featureFlags.isFeatureEnabled('enableEmailConnector'),
      apiConnector: featureFlags.isFeatureEnabled('enableAPIConnector')
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔗 Connectors Service running on port ${PORT}`);
  });
}

export default app; 