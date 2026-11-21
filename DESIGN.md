---
version: alpha
name: zeroDex
description: A Sepolia workspace for inspecting liquidity, quoting swaps and managing LP positions.
colors:
  canvas: "#f1f5f5"
  ink: "#152e36"
  primary: "#006c63"
  muted: "#536a71"
  divider: "#cfdddd"
  surface: "#ffffff"
typography:
  body:
    fontFamily: "Instrument Sans, Segoe UI, system-ui, sans-serif"
  display:
    fontFamily: "Instrument Sans, Geist, Segoe UI, system-ui, sans-serif"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
omitted:
  - section: rounded
    reason: Control and surface radii follow their CSS recipes.
  - section: spacing
    reason: Spacing follows the responsive layout in CSS.
  - section: components
    reason: Component ownership is recorded in UX-CONTRACT.md.
---

# zeroDex

## Overview

A trader looking at a Sepolia pool needs to identify the pair, inspect tradable liquidity and decide whether to swap or provide liquidity. A liquidity provider returning to the app needs their owned positions and the latest transaction result. Give each task a named workspace, keep wallet and network context within reach, and put the relevant action beside the data that enables it.

The page header uses a layered liquidity illustration as the visual signature. It represents the product, independently of live pool values. Reserve quantitative marks, balances and success messages for data the app actually has.

## Colors

The global stylesheet owns the palette. Page and component styles consume its CSS custom properties. Update these six design roles alongside their runtime definitions in `src/styles.css`.

| Role | CSS property | Use |
| --- | --- | --- |
| Canvas | `--canvas` | Workspace background |
| Surface | `--surface` | Filters, forms and data panels |
| Ink | `--ink` | Headings and primary values |
| Muted | `--muted` | Explanatory text and secondary labels |
| Divider | `--line` | Panel boundaries and row separators |
| Primary | `--accent` | Main actions, selection and interactive emphasis |

Status treatments pair a short label with a change in color or icon. A connected wallet, a tradable pool and a confirmed transaction each have a different meaning. State the specific condition.

## Typography

The stylesheet maps the three type roles to `--font-display`, `--font-body` and `--font-mono`. Page titles use the display stack. Controls and prose use the body stack. Give amounts enough space for a decimal fraction and a token symbol. Monospaced values or tabular figures help users compare pool indices, balances and hashes. The interface language is English. Keep token symbols, hashes and chain identifiers in their original form.

## Layout

Top navigation provides access to all four workspaces. Place the page title first, followed by the controls and data for that task. In Pools the filter and list lead into the selected pool detail. In Swap the editable amount and the quote stay together. Balances, the selected pool and transaction context sit below the workspace. On narrow screens keep the same reading order and group actions with their object.

## Elevation & Depth

Separate data surfaces with borders and changes in tone. Reserve the strongest depth treatment for overlays. A wallet prompt or transaction review must read as the active surface even when the page beneath contains another primary action.

## Shapes

Rounded panels contain related values. Use compact status pills for discrete states and linear dividers to separate comparable records. Token iconography supplements the symbol so a pair remains identifiable in monochrome.

## Components

Use the shared timeline for wallet signature, submission and confirmation. Keep validation, balance and allowance feedback near the action it affects. Show focus around the active control, including icon buttons. Preserve the readable state label with reduced motion enabled.

## Do's and Don'ts

- Put the token and unit beside every editable amount and quoted limit.
- Distinguish an empty result, a pending read and an unavailable wallet in the copy.
- Avoid showing a zero balance or a synthetic transaction when the underlying value is unknown.
