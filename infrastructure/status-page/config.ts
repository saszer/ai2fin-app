// Status page configuration for embracingearth.space
export const statusConfig = {
  title: "AI2 Platform Status",
  name: "EmbracingearthSpace",
  description: "Real-time status of AI2 Enterprise Platform services",
  
  // Component definitions
  components: [
    {
      id: "frontend",
      name: "Web Application",
      description: "React frontend application",
      monitors: [
        {
          type: "http",
          url: "https://app.embracingearth.space",
          interval: 60,
          timeout: 10
        }
      ]
    },
    {
      id: "api",
      name: "API Services",
      description: "Core API endpoints",
      monitors: [
        {
          type: "http",
          url: "https://app.embracingearth.space/api/health",
          interval: 30,
          timeout: 5,
          expectedStatus: 200
        }
      ]
    },
    {
      id: "database",
      name: "Database",
      description: "PostgreSQL database",
      monitors: [
        {
          type: "tcp",
          host: "db.embracingearth.space",
          port: 5432,
          interval: 60
        }
      ]
    },
    {
      id: "ai-service",
      name: "AI Services",
      description: "AI categorization and analysis",
      monitors: [
        {
          type: "http",
          url: "https://app.embracingearth.space/api/ai/health",
          interval: 60,
          timeout: 10
        }
      ]
    },
    {
      id: "storage",
      name: "File Storage",
      description: "Google Cloud Storage",
      monitors: [
        {
          type: "http",
          url: "https://storage.googleapis.com/ai2-uploads/health.txt",
          interval: 300
        }
      ]
    }
  ],
  
  // Incident management
  incidents: {
    autoClose: true,
    autoCloseAfter: 3600, // 1 hour
    postMortemTemplate: `
## Incident Summary
- **Duration**: {{duration}}
- **Impact**: {{impact}}
- **Components**: {{components}}

## Root Cause
{{rootCause}}

## Resolution
{{resolution}}

## Action Items
{{actionItems}}
    `
  },
  
  // Notifications
  notifications: [
    {
      type: "webhook",
      url: process.env.SLACK_WEBHOOK,
      events: ["incident.create", "incident.update", "incident.resolve"]
    },
    {
      type: "email",
      to: "ops@embracingearth.space",
      events: ["incident.create"]
    }
  ],
  
  // Branding
  branding: {
    logo: "https://embracingearth.space/logo.png",
    favicon: "https://embracingearth.space/favicon.ico",
    colors: {
      primary: "#0EA5E9",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444"
    }
  }
}; 