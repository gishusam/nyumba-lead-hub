# Communications Bulk Mail and Newsletter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the approved Overview, Bulk Mail, and Newsletter design into the existing TanStack Start application.

**Architecture:** Preserve the current application sidebar and authenticated Communications parent route. Add two child routes, shared pure product helpers, interactive development previews, and a redesigned Overview that continues to use the live Overview, readiness, and provider-event APIs.

**Tech Stack:** React 19, TanStack Start/Router, TanStack Query, TypeScript, Tailwind CSS, Lucide React, Vitest.

## Tasks

1. Add pure recipient, sender, attachment, scheduling, personalisation, and validation helpers with Vitest coverage.
2. Replace the seven placeholder sections with Overview, Bulk Mail, and Newsletter.
3. Redesign the Overview around six performance metrics, quick actions, live rates, readiness, and provider events.
4. Add the three-step Bulk Mail workspace: recipients, compose, and review/send.
5. Add the template-driven Newsletter editor with live preview, audience selection, and scheduling.
6. Regenerate routes and run `npm test`, `npm run build`, `npm run typecheck`, and `git diff --check`.
7. Commit and push only `feature/communications-frontend`; do not merge or deploy.
