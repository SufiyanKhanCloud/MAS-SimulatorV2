# Multi-Server Queueing System Simulation Engine

## Project Overview

This repository contains a specialized web-based simulation platform designed for the quantitative analysis of queueing systems. Developed as a **collaborative group effort**, the application implements mathematical models (M/M/1 and M/M/S) to simulate stochastic processes in server environments, focusing on throughput, wait times, and resource utilization.

**Live Deployment:** [mas-simulator-calculator.vercel.app](https://mas-simulator-calculator.vercel.app/)

## Technical Architecture

The system is built using a modern, type-safe stack designed for performance and scalability:

* **Core Framework:** Next.js
* **Logic Layer:** TypeScript (Strictly typed for mathematical precision)
* **Styling:** Tailwind CSS (Optimized for responsive utility-first design)
* **Package Management:** pnpm (Efficient, content-addressable dependency handling)
* **CI/CD:** Automated deployment via GitHub and Vercel

## System Capabilities

The simulator evaluates complex queueing scenarios by processing the following parameters:

* **Stochastic Inputs:** Arrival Rate () and Service Rate ().
* **Infrastructure Scaling:** Support for Multi-Server () configurations.
* **Preemptive Logic:** Implementation of priority-based scheduling where high-priority tasks can interrupt active low-priority service sessions.
* **Performance Metrics:** Real-time generation of System Utilization (), Expected Number in System (), and Expected Wait Time ().

## Group Contributions

This project represents a synchronized group effort. The team worked in parallel to ensure the integration of complex backend probability logic with a high-fidelity frontend user interface.

* **Mathematical Modeling:** Development of the core M/M/S algorithms and preemption logic.
* **Frontend Infrastructure:** Creation of the reactive dashboard and real-time data visualization components.
* **Systems Operations:** Configuration of the Git workflow, repository management, and cloud deployment.

## Installation and Local Development

### Prerequisites

* Node.js (v18.0 or higher)
* pnpm (Recommended) or npm

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/SufiyanKhanCloud/MAS-SimulatorV2.git
cd MAS-SimulatorV2

```


2. Install dependencies:
```bash
pnpm install

```


3. Initialize the development environment:
```bash
pnpm dev

```


4. Access the local instance:
Navigate to `http://localhost:3000` in your web browser.

## Deployment

The project is configured for a Continuous Deployment pipeline. Any modifications pushed to the `main` branch are automatically built and deployed to the Vercel production environment.

---
