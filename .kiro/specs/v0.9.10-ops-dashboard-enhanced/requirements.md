# v0.9.10 Enhanced Operations Dashboard

## Overview
Enhanced dashboard for Operations Manager (Reza) showing job execution status, delivery tracking, and cost management WITHOUT revealing revenue or profit information.

## Security Requirement
**CRITICAL**: Ops role must NOT see revenue, profit, or margin data - only budget/cost information.

## Requirements

### REQ-1: Enhanced Summary Cards
- **REQ-1.1**: Display total active jobs count
- **REQ-1.2**: Display today's deliveries count
- **REQ-1.3**: Display pending handover (Berita Acara) count
- **REQ-1.4**: Display total budget amount (sum of all active job budgets)
- **REQ-1.5**: Display total spent amount (sum of all confirmed costs)

### REQ-2: Active Jobs Table
- **REQ-2.1**: Show JO number, customer name, project name
- **REQ-2.2**: Show budget vs actual spent (NOT revenue)
- **REQ-2.3**: Show delivery progress (completed/total deliveries)
- **REQ-2.4**: Show budget status indicator (under/on/over budget)
- **REQ-2.5**: Link to JO detail page

### REQ-3: Delivery Schedule Card
- **REQ-3.1**: Show today's scheduled deliveries
- **REQ-3.2**: Display origin, destination, driver info
- **REQ-3.3**: Show delivery status (pending/in_transit/delivered)

### REQ-4: Cost Tracking Card
- **REQ-4.1**: Show total budget across all active jobs
- **REQ-4.2**: Show total spent amount
- **REQ-4.3**: Show remaining budget
- **REQ-4.4**: Show pending BKK count and amount
- **REQ-4.5**: Visual progress bar for budget usage

### REQ-5: Pending Actions Card
- **REQ-5.1**: List pending Berita Acara to create
- **REQ-5.2**: List pending Surat Jalan to create
- **REQ-5.3**: List pending BKK to settle
- **REQ-5.4**: Each item links to relevant action

### REQ-6: Quick Actions Bar
- **REQ-6.1**: Button to create new Surat Jalan
- **REQ-6.2**: Button to create new Berita Acara
- **REQ-6.3**: Button to request new BKK

## Data Security
- All queries must exclude revenue, profit, and margin fields
- Use database views with SECURITY INVOKER
- Only expose: budget, estimated_amount, actual_amount, spent amounts
