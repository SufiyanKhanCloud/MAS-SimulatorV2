# Advanced Stochastic Queueing Engine (Kendall's Notation)
[![CI/CD Pipeline](https://github.com/SufiyanKhanCloud/MAS-SimulatorV2/actions/workflows/ci.yml/badge.svg)](https://github.com/SufiyanKhanCloud/MAS-SimulatorV2/actions/workflows/ci.yml)

## Project Overview

This platform is a high-performance simulation suite designed to model and analyze complex queueing architectures. It provides a computational interface for evaluating performance metrics across various stochastic processes, ranging from simple Poisson arrivals to generalized distribution models.

The project was developed as a **unified group effort** to provide students and researchers with a tool to visualize system bottlenecks and stability conditions in real-time.

**Live Deployment:** [mas-simulator-calculator.vercel.app](https://mas-simulator-calculator.vercel.app/)

## Supported Queueing Models

The engine implements the following models based on Kendall's Notation:

* **M/M/1 & M/M/s:** Markovian arrivals and service times with single or multiple servers.
* **M/G/1 & M/G/s:** Poisson arrivals with General service time distributions (requires mean and variance).
* **G/G/1 & G/G/s:** General arrival and General service distributions, utilizing Kingman’s formula for approximations in complex multi-server environments.

## Technical Core

* **Framework:** Next.js (React)
* **Language:** TypeScript (Ensuring type safety for all mathematical operations)
* **Styling:** Tailwind CSS (Cyber-industrial UI design)
* **State Management:** React Hooks for real-time parameter synchronization
* **Hosting:** Vercel (Production Frontend)
* **Containerization:** Docker & Docker Hub
* **CI/CD Pipeline:** GitHub Actions
* **Infrastructure as Code (IaC):** Terraform (AWS EC2 & Security Groups)
* **Configuration Management:** Ansible
<img width="1127" height="538" alt="Architecture" src="https://github.com/user-attachments/assets/5bd2eb0d-cef6-4f3d-97ac-9857ef2b84fc" />

## Automated DevOps Pipeline

This project features a complete, zero-touch deployment pipeline designed for highly scalable environments:

* **Containerization:** The application is packaged using an optimized, multi-stage `Dockerfile` based on `node:20-alpine`. It utilizes standalone Next.js builds and runs as a non-root user for enhanced security.
* **Continuous Integration:** GitHub Actions automatically triggers on pushes to the `main` branch. It tests the build, compiles the image, and securely pushes the artifact to Docker Hub tagged with the specific Git commit hash.
* **Infrastructure Provisioning:** HashiCorp Terraform is used to programmatically provision AWS EC2 instances and configure VPC Security Groups (opening ports 22, 80, and 3000).
* **Configuration Management:** An Ansible playbook automates the cloud server setup. It connects via SSH, installs the Docker daemon, pulls the latest image from Docker Hub, and manages the container lifecycle.
* **FinOps Strategy:** To optimize cloud costs, the AWS EC2 environment is fully ephemeral and can be spun up or torn down in seconds using Terraform, while the persistent, public-facing application is hosted via Vercel.

## Mathematical Indicators

The system calculates and visualizes the following key performance indicators (KPIs):

* **Utilization Factor ($\rho$):** The fraction of time the server(s) are busy.
* **Condition for stability:** $\rho < 1$
* **Little’s Law Implementation:** Calculation of $L = \lambda W$ to determine the average number of customers in the system.
* **Waiting Time ($W_q$):** Expected time a customer spends in the queue before service begins.
* **System Length ($L$):** Expected number of customers currently in the system (Queue + Service).
* **Probability of Idleness ($P_0$):** The probability that the system is empty.

## Advanced Features

* **Preemptive Priority Scheduling:** The engine supports scenarios where high-priority arrivals can interrupt low-priority service sessions.
* **Step-by-Step Simulation Logs:** A detailed breakdown of every event (Arrival, Service Start, Completion) to verify the mathematical accuracy of the simulation.
* **Interactive Visualizations:** Live Gantt charts and performance tables reflecting the stochastic nature of the system.

## Group Contribution Statement

This project is the result of a coordinated group effort. The team collaborated on the following domains:

* **Algorithm Development:** Translation of complex Queueing Theory formulas into executable TypeScript functions.
* **Architectural Design:** Structuring the Next.js application for modularity and performance.
* **DevOps & Quality Assurance:** Implementing the Git workflow, building the Docker/AWS deployment pipeline, managing the Vercel deployment, and verifying results against theoretical benchmarks.

## Installation and Local Setup

### Option A: Standard Node.js Environment

1. **Clone the Repository:**
```bash
git clone [https://github.com/SufiyanKhanCloud/MAS-SimulatorV2.git](https://github.com/SufiyanKhanCloud/MAS-SimulatorV2.git)
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

### Option B: Docker Environment

1. **Build the Image:**

```bash
docker build -t mas-simulator .

```

2. **Run the Container:**

```bash
docker run -p 3000:3000 mas-simulator
