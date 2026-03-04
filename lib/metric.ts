import client from 'prom-client';

// 1. Enable default Node.js metrics (CPU, RAM, Event Loop)
// We use a global variable to prevent memory leaks during Next.js hot-reloads
const globalForPrometheus = global as unknown as { _prometheusRegistered: boolean };

if (!globalForPrometheus._prometheusRegistered) {
  client.collectDefaultMetrics();
  globalForPrometheus._prometheusRegistered = true;
}

// 2. Define our custom Business Metrics
export const simulationCounter = new client.Counter({
  name: 'mas_simulator_calculations_total',
  help: 'Total number of queueing simulations run by users',
  labelNames: ['queue_type'], // This lets us track M/M/1 vs M/M/s separately!
});

// You can add more metrics here later, like calculation time histograms!