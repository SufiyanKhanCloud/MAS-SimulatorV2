# Advanced Stochastic Queueing Engine (Kendall's Notation)
[![CI/CD Pipeline](https://github.com/SufiyanKhanCloud/MAS-SimulatorV2/actions/workflows/ci.yml/badge.svg)](https://github.com/SufiyanKhanCloud/MAS-SimulatorV2/actions/workflows/ci.yml)

## Project Overview

This platform is a high-performance simulation suite designed to model and analyze complex queueing architectures. It provides a computational interface for evaluating performance metrics across various stochastic processes, ranging from simple Poisson arrivals to generalized distribution models.

The project was developed as a **unified group effort** to provide students and researchers with a tool to visualize system bottlenecks and stability conditions in real-time.

**Live Deployment:** [mas-simulator-calculator.vercel.app](https://mas-simulator-calculator.vercel.app/)

<img width="1366" height="685" alt="Screenshot from 2026-03-03 10-12-30" src="https://github.com/user-attachments/assets/fd6fbf2d-8bdf-4200-9a33-94adecf03285" />
<img width="955" height="646" alt="Screenshot from 2026-03-03 10-35-00" src="https://github.com/user-attachments/assets/14c24697-c763-4f6b-9efc-b3ad7c701bae" />
<img width="955" height="646" alt="Screenshot from 2026-03-03 10-35-21" src="https://github.com/user-attachments/assets/27ceed24-8276-4f90-8420-acbbb2a2e329" />
<p align="center">
  <img width="538" height="603" alt="Screenshot from 2026-03-03 10-35-53" src="https://github.com/user-attachments/assets/cc39093f-64d4-44ff-b8fa-fb705ecb1870" />
</p>
<img width="1355" height="621" alt="Screenshot from 2026-03-03 10-36-14" src="https://github.com/user-attachments/assets/5ebcb2ba-c60d-452c-867a-31460ca43d27" />
<img width="1355" height="648" alt="Screenshot from 2026-03-03 10-36-34" src="https://github.com/user-attachments/assets/62bbad4b-948b-4020-bf47-56e176e28372" />
<img width="1355" height="648" alt="Screenshot from 2026-03-03 10-36-42" src="https://github.com/user-attachments/assets/4de1aeb9-6603-4daf-a706-e4a7ad3ba3be" />
<img width="1360" height="507" alt="Screenshot from 2026-03-03 10-36-57" src="https://github.com/user-attachments/assets/2f6b716a-4bd0-41f4-a4b1-4a11be6ed3c5" />
<img width="1353" height="540" alt="Screenshot from 2026-03-03 10-37-12" src="https://github.com/user-attachments/assets/8e583188-f71d-4505-bb66-e388fc8281f5" />
<img width="1353" height="540" alt="Screenshot from 2026-03-03 10-37-20" src="https://github.com/user-attachments/assets/cc9addfa-c5d0-4374-bbac-0012c1b15a8f" />
<p align="center">
 <img width="628" height="602" alt="Screenshot from 2026-03-03 10-38-00" src="https://github.com/user-attachments/assets/830a37de-73de-4bb1-8907-5c2641887066" />
</p>
<p align="center">
  <img width="638" height="636" alt="Screenshot from 2026-03-03 10-38-15" src="https://github.com/user-attachments/assets/44e77822-4385-4769-ae7c-d8366e5a1213" />
</p>

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
