# Advanced Stochastic Queueing Engine (Kendall's Notation)

## Project Overview

This platform is a high-performance simulation suite designed to model and analyze complex queueing architectures. It provides a computational interface for evaluating performance metrics across various stochastic processes, ranging from simple Poisson arrivals to generalized distribution models ().

The project was developed as a **unified group effort** to provide students and researchers with a tool to visualize system bottlenecks and stability conditions in real-time.

**Live Deployment:** [mas-simulator-calculator.vercel.app](https://mas-simulator-calculator.vercel.app/)

## Supported Queueing Models

The engine implements the following models based on Kendall's Notation:

* **M/M/1 & M/M/s:** Markovian arrivals and service times with single or multiple servers.
* **M/G/1 & M/G/s:** Poisson arrivals with General service time distributions (requires mean and variance).
* **G/G/1 & G/G/s:** General arrival and General service distributions, utilizing the Kingman’s formula for approximations in complex multi-server environments.

## Technical Core

* **Framework:** Next.js (React)
* **Language:** TypeScript (Ensuring type safety for all mathematical operations)
* **Styling:** Tailwind CSS (Cyber-industrial UI design)
* **State Management:** React Hooks for real-time parameter synchronization
* **Deployment:** Vercel (CI/CD Integrated)

## Mathematical Indicators

The system calculates and visualizes the following key performance indicators (KPIs):

* **Utilization Factor ():** The fraction of time the server(s) are busy.
* Condition for stability: 


* **Little’s Law Implementation:** Calculation of  to determine the average number of customers in the system.
* **Waiting Time ():** Expected time a customer spends in the queue before service begins.
* **System Length ():** Expected number of customers currently in the system (Queue + Service).
* **Probability of Idleness ():** The probability that the system is empty.

## Advanced Features

* **Preemptive Priority Scheduling:** The engine supports scenarios where high-priority arrivals can interrupt low-priority service sessions.
* **Step-by-Step Simulation Logs:** A detailed breakdown of every event (Arrival, Service Start, Completion) to verify the mathematical accuracy of the simulation.
* **Interactive Visualizations:** Live Gantt charts and performance tables reflecting the stochastic nature of the system.

## Group Contribution Statement

This project is the result of a coordinated group effort. The team collaborated on the following domains:

* **Algorithm Development:** Translation of complex Queueing Theory formulas into executable TypeScript functions.
* **Architectural Design:** Structuring the Next.js application for modularity and performance.
* **DevOps & Quality Assurance:** Implementing the Git workflow, managing the Vercel deployment pipeline, and verifying results against theoretical benchmarks.

## Installation and Local Setup

1. **Clone the Repository:**
```bash
git clone https://github.com/SufiyanKhanCloud/MAS-SimulatorV2.git
cd MAS-SimulatorV2

```


2. **Install Dependencies:**
```bash
pnpm install

```


3. **Execute Local Server:**
```bash
pnpm dev

```


4. **Access Instance:** Open `http://localhost:3000`

---
