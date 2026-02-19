// Queuing Theory Calculations Library
// Supports: M/M/1, M/M/S, M/G/1, M/G/S, GG/1, GG/S

export type QueuingModel = "MM1" | "MMS" | "MG1" | "MGS" | "GG1" | "GGS";

export interface QueuingInput {
  lambda: number; // Arrival rate
  mu: number; // Service rate
  s?: number; // Number of servers (for M/M/S, M/G/S, GG/S)
  sigma?: number; // Service time standard deviation (for M/G/1, M/G/S, GG/1, GG/S)
  ca?: number; // Coefficient of arrival (for GG/1, GG/S)
  cs?: number; // Coefficient of service (for GG/1, GG/S)
}

export interface QueuingResults {
  rho: number; // Utilization
  stable: boolean; // System is stable (rho < 1)
  Lq: number; // Average queue length
  Wq: number; // Average wait time in queue
  W: number; // Average total time in system
  L: number; // Average number in system
  error?: string;
}

/**
 * Calculate Erlang C formula for M/M/S
 * This is the probability that a customer has to wait
 */
function erlangC(lambda: number, mu: number, s: number): number {
  const rho = lambda / (s * mu);
  if (rho >= 1) return 1;

  const a = lambda / mu; // Traffic intensity
  let numerator = Math.pow(a, s) / factorial(s);
  numerator = numerator / (1 - rho);

  let denominator = 0;
  for (let k = 0; k < s; k++) {
    denominator += Math.pow(a, k) / factorial(k);
  }
  denominator += numerator;

  return numerator / denominator;
}

/**
 * Calculate factorial
 */
function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * M/M/1 Queue
 * Single server, exponential arrivals and service
 */
export function calculateMM1(input: QueuingInput): QueuingResults {
  const { lambda, mu } = input;

  if (mu <= 0 || lambda < 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid lambda or mu values",
    };
  }

  const rho = lambda / mu;

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  const Lq = (rho * rho) / (1 - rho);
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * M/M/S Queue
 * Multiple servers, exponential arrivals and service
 */
export function calculateMMS(input: QueuingInput): QueuingResults {
  const { lambda, mu, s = 1 } = input;

  if (mu <= 0 || lambda < 0 || s <= 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid input values",
    };
  }

  const rho = lambda / (s * mu);

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  const Pw = erlangC(lambda, mu, s);
  const Wq = (Pw / (s * mu - lambda));
  const Lq = lambda * Wq;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * M/G/1 Queue
 * Single server, exponential arrivals, general service distribution
 */
export function calculateMG1(input: QueuingInput): QueuingResults {
  const { lambda, mu, sigma = 1 / mu } = input;

  if (mu <= 0 || lambda < 0 || sigma < 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid input values",
    };
  }

  const rho = lambda / mu;

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  // Pollaczek-Khinchin formula
  const lambda2 = lambda * lambda;
  const Lq = (lambda2 * sigma * sigma + rho * rho) / (2 * (1 - rho));
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * M/G/S Queue
 * Multiple servers, exponential arrivals, general service distribution
 */
export function calculateMGS(input: QueuingInput): QueuingResults {
  const { lambda, mu, s = 1, sigma = 1 / mu } = input;

  if (mu <= 0 || lambda < 0 || s <= 0 || sigma < 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid input values",
    };
  }

  const rho = lambda / (s * mu);

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  // First calculate M/M/S Wq
  const mmsResult = calculateMMS({ lambda, mu, s });
  if (!mmsResult.stable) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  const Cs2 = sigma * sigma * mu * mu; // Square of coefficient of variation for service
  const WqMMS = mmsResult.Wq;

  // M/G/S: Wq(MGS) = Wq(MMS) × (1 + Cs²)/2
  const Wq = WqMMS * (1 + Cs2) / 2;
  const Lq = lambda * Wq;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * GG/1 Queue
 * General arrivals, general service, single server
 */
export function calculateGG1(input: QueuingInput): QueuingResults {
  const { lambda, mu, sigma = 1 / mu, ca = 1, cs = sigma * mu } = input;

  if (mu <= 0 || lambda < 0 || sigma < 0 || ca < 0 || cs < 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid input values",
    };
  }

  const rho = lambda / mu;

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  // Kingman's approximation for GG/1
  // Ca² = coefficient of arrival variation
  // Cs² = coefficient of service variation
  const Ca2 = ca * ca;
  const Cs2 = cs * cs;

  const numerator = rho * rho * (1 + Ca2) * (Cs2 + rho * rho * Ca2);
  const denominator = 2 * (1 - rho) * (1 + rho * rho * Cs2);

  const Lq = numerator / denominator;
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * GG/S Queue
 * General arrivals, general service, multiple servers
 */
export function calculateGGS(input: QueuingInput): QueuingResults {
  const { lambda, mu, s = 1, sigma = 1 / mu, ca = 1, cs = sigma * mu } = input;

  if (mu <= 0 || lambda < 0 || s <= 0 || sigma < 0 || ca < 0 || cs < 0) {
    return {
      rho: 0,
      stable: false,
      Lq: 0,
      Wq: 0,
      W: 0,
      L: 0,
      error: "Invalid input values",
    };
  }

  const rho = lambda / (s * mu);

  if (rho >= 1) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  // First calculate M/M/S Wq
  const mmsResult = calculateMMS({ lambda, mu, s });
  if (!mmsResult.stable) {
    return {
      rho,
      stable: false,
      Lq: Infinity,
      Wq: Infinity,
      W: Infinity,
      L: Infinity,
    };
  }

  const Ca2 = ca * ca;
  const Cs2 = cs * cs;
  const WqMMS = mmsResult.Wq;

  // GG/S: Wq(GGS) = Wq(MMS) × (Ca² + Cs²)/2
  const Wq = WqMMS * (Ca2 + Cs2) / 2;
  const Lq = lambda * Wq;
  const W = Wq + 1 / mu;
  const L = lambda * W;

  return {
    rho,
    stable: true,
    Lq,
    Wq,
    W,
    L,
  };
}

/**
 * Main calculation dispatcher
 */
export function calculateQueuingMetrics(model: QueuingModel, input: QueuingInput): QueuingResults {
  switch (model) {
    case "MM1":
      return calculateMM1(input);
    case "MMS":
      return calculateMMS(input);
    case "MG1":
      return calculateMG1(input);
    case "MGS":
      return calculateMGS(input);
    case "GG1":
      return calculateGG1(input);
    case "GGS":
      return calculateGGS(input);
    default:
      return {
        rho: 0,
        stable: false,
        Lq: 0,
        Wq: 0,
        W: 0,
        L: 0,
        error: "Unknown model",
      };
  }
}

/**
 * Get input fields required for a specific model
 */
export function getRequiredInputs(model: QueuingModel): string[] {
  switch (model) {
    case "MM1":
      return ["lambda", "mu"];
    case "MMS":
      return ["lambda", "mu", "s"];
    case "MG1":
      return ["lambda", "mu", "sigma"];
    case "MGS":
      return ["lambda", "mu", "s", "sigma"];
    case "GG1":
      return ["lambda", "mu", "ca", "cs"];
    case "GGS":
      return ["lambda", "mu", "s", "ca", "cs"];
    default:
      return [];
  }
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: QueuingModel): string {
  const names: Record<QueuingModel, string> = {
    MM1: "M/M/1",
    MMS: "M/M/S",
    MG1: "M/G/1",
    MGS: "M/G/S",
    GG1: "G/G/1",
    GGS: "G/G/S",
  };
  return names[model];
}
