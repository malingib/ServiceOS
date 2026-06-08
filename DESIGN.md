# Design System

## Overview

ServiceOS uses a bright cleaning-service brand layer and a restrained product UI layer. The public site can use committed green and aqua color, photography, and large action-led composition. Dashboards and booking screens use the same color language with denser spacing, clear status chips, and table-like rows.

## Color

- `--bg`: OKLCH near-white, clean neutral page background.
- `--surface`: pure white for content panels.
- `--ink`: deep blue-green text for high contrast.
- `--muted`: readable slate-teal body copy.
- `--brand`: saturated clean green for primary actions.
- `--aqua`: bright aqua for service and hygiene accents.
- `--mint`: pale mint surface for calm panels.
- `--lemon`: warm yellow accent for attention and payment highlights.
- `--danger`: red for urgent exception states.

## Typography

Use a single sans family with strong weight contrast. Product screens keep type sizes fixed and practical. Public page headings can use larger display sizes, capped below 6rem, with balanced wrapping.

## Components

- Primary buttons are solid brand green with dark text when contrast is stronger, or ink when used on pale surfaces.
- Secondary buttons use an ink border or pale mint background.
- Cards use 12-16px radius, no nested-card treatment, and avoid pairing wide shadows with borders.
- Status chips include text and color. High priority items use lemon or red surfaces with readable text.
- Forms use visible labels, generous hit targets, and focus rings.

## Layout

Public pages use a layered hero, photo panel, action strip, service rows, and a concise portal section. Product pages use a shared header, content max width, functional rows, and side panels for summaries or next actions.

## Motion

Use small state transitions only: hover lift, focus outline, and chip state changes. Reduced motion disables transitions.
