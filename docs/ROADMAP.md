# Roadmap

This document is intentionally concise. It is shared memory for future Architect, Developer and Reviewer sessions.

## Current priorities
1. Fix reported functional bugs with minimal, regression-tested changes.
2. Preserve compatibility with existing Lovelace configurations and BMS_BLE-HA entity patterns.
3. Keep automatic discovery reliable across supported BMS setups.
4. Maintain responsive/mobile-friendly rendering.
5. Expand regression tests when a bug exposes a missing test case.

## Process
- New work starts from a concrete issue/request.
- ARCHITECT investigates and writes the smallest viable plan.
- DEVELOPER implements only that plan and commits tested changes.
- REVIEWER checks the resulting diff and returns PASS/FAIL.
- Completed work should be reflected here only when it changes a meaningful project priority.