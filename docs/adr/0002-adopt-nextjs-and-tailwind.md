# ADR 0002: Adopt Next.js and Tailwind CSS for Responsive Web Drill Platform

## Status
Accepted

## Context
The user requires a technical command and configuration learning repository accessible from any device (desktop, tablet, mobile), without software installation friction, and deployable at zero cost to a cloud hosting provider.

## Decision
Adopt **Next.js 14+** (React, TypeScript, App Router) paired with **Tailwind CSS** and **shadcn/ui** primitives.

## Consequences
- **Positive:** Server-side rendering, instant page transitions, native TypeScript support, and zero-cost automated deployment on Vercel Hobby tier.
- **Negative:** Requires Node.js build pipeline and mobile keyboard optimizations to prevent virtual keyboard autocorrect interference.
