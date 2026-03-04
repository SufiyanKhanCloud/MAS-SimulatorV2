import { NextResponse } from 'next/server';
import client from 'prom-client';

// We import this just to ensure the file runs and registers the metrics
import '@/lib/metrics'; 

export async function GET() {
  // This tells the prom-client to gather all the data and format it as plain text
  const metrics = await client.register.metrics();
  
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': client.register.contentType,
      // Prevent caching so Prometheus always gets the freshest data
      'Cache-Control': 'no-store, max-age=0', 
    },
  });
}