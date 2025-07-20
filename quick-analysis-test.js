/**
 * 🧪 QUICK ANALYSIS TEST
 * Check exact response structure
 */

async function quickTest() {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch('http://localhost:3001/api/intelligent-categorization/analyze-for-categorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWQ3cHIyNGgwMDAwcDk5Z2xtYW4ydDU5IiwiZW1haWwiOiJzei5zYWhhakBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJTYWhhaiIsImxhc3ROYW1lIjoiR2FyZyIsImJ1c2luZXNzVHlwZSI6IiIsImNvdW50cnlDb2RlIjoiQVUiLCJpYXQiOjE3NTI5NDE3NjEsImV4cCI6MTc1MzAyODE2MX0.74XOvunbK2NXNiApJDVWmhM_Sa0ScHJ_dkzt7ou9vcQ'
      },
      body: JSON.stringify({ includeAlreadyCategorized: true })
    });

    const data = await response.json();
    console.log('📊 FULL RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickTest(); 