# Queue Scaling & Load Shedding Strategy

This document outlines the architecture for handling massive concurrent ad generation requests (100-1000+ users) while respecting external API limits.

## 1. Concurrency Target

- **Goal**: Support 100 concurrent generations.
- **Provider Limit**: 2 tasks per API key.
- **Requirement**: A pool of **50 API keys** (or an Enterprise account with increased limits).

## 2. Intelligent Key Manager (Least Busy Logic)

To optimize usage across multiple keys:

- **Redis Tracking**: Maintain atomic counters per key (e.g., `key_usage:ABC`).
- **Selection**:
  1. Fetch usage counts for all keys in the pool.
  2. Map-reduce to find keys where `Usage < 2`.
  3. Sort by usage ascending and pick the "freeest" key.
  4. Increment counter on job start; decrement on job success/failure.

## 3. Load Shedding (Fail-Fast)

To prevent "black hole" queues where users wait hours:

- **Threshold**: If all keys are at max capacity (e.g., 50 keys x 2 = 100 jobs), the 101st request is **instantly rejected**.
- **Response**: `429 Too Many Requests` or `503 Service Unavailable`.
- **Payload**: Provide a `retryAfter` value (e.g., 60 seconds) so the frontend can display a countdown.

## 4. Real-time UX Feedback

- **Queue Position**: Return the job's position in the queue (`waitingCount`) so users see "You are #5 in line".
- **Progressive Disclosure**: Only show the spinner once the job moves from "Waiting" to "Active".

## 5. Implementation Roadmap

1. [ ] Implement `AIKeyManagerService` for Redis-based key rotation.
2. [ ] Update `AdsController` with the queue depth check (Load Shedding).
3. [ ] Configure `BullMQ` limiter for global throughput control.
4. [ ] Refactor `AdProcessorService` to fetch keys dynamically from the manager.
