import type { NextApiRequest, NextApiResponse } from 'next';

// Simplified auth API for testing purposes
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // Simple mock authentication
    const { email, password } = req.body;
    
    if (email && password) {
      return res.status(200).json({ 
        success: true, 
        user: { email, id: '1' },
        token: 'mock-jwt-token'
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}