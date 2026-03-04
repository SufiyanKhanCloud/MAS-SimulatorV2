import { NextResponse } from 'next/server';
import { simulationCounter } from '@/lib/metrics'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const queueType = body.queueType || 'unknown';

    // This increases the Grafana metric by 1!
    simulationCounter.labels(queueType).inc();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track metric' }, { status: 500 });
  }
}