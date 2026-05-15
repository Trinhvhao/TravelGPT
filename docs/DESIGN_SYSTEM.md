# Design System Inspired by Vietravel

## 1. Visual Theme & Atmosphere

Vietravel's design system embodies a modern, travel-focused aesthetic that balances professionalism with approachability. The visual language emphasizes clarity and trust through a sophisticated dark navy foundation paired with vibrant accent blues that evoke exploration and discovery. Clean typography, minimal ornamentation, and strategic use of whitespace create an uncluttered, premium experience. The palette conveys reliability and adventure simultaneously—essential for a travel brand guiding users through complex booking journeys. The overall mood is confident yet welcoming, with bright accent colors drawing attention to calls-to-action while maintaining a cohesive, corporate-grade appearance.

**Key Characteristics**
- Deep navy (`#000E1A`) as the dominant structural color, establishing trust and sophistication
- Vibrant primary blues (`#0046C1`, `#0391FF`) for interactive elements and focal points
- Clean sans-serif typography in Mulish for readability and modern appeal
- Minimal use of color—relying on navy, white, and strategic accent deployment
- Zero border-radius on most components, emphasizing geometric precision
- Semantic reds and warnings for error states and critical feedback
- Light neutral grays for secondary information and disabled states

## 2. Color Palette & Roles

### Primary

- **Deep Navy** (`#000E1A`): Primary text and structural framework; dominates body copy, headings, and primary navigation
- **Cobalt Blue** (`#0046C1`): Secondary primary accent; used for highlighted tags, badges, and complementary interactive states

### Accent Colors

- **Bright Azure** (`#0391FF`): Call-to-action borders and accent text; creates visual vibrancy for tertiary buttons and secondary links
- **Sky Blue** (`#0000EE`): Hyperlink default state; signals interactive elements
- **Light Blue Background** (`#D9EEFF`): Soft background for card highlights and badge containers
- **Pale Sky** (`#F1F9FF`): Ultra-light background tint for subtle surface differentiation

### Interactive

- **Bright Cyan** (`#0391FF`): Borders on secondary action buttons; interactive hover and focus states
- **Deep Teal** (`#002540`): Reserved for hover overlays and deep interaction states
- **Lime Green** (`#77DD77`): Success/positive action confirmation (minimal use)
- **Warm Orange** (`#E67E22`): Highlight accent for feature callouts (minimal use)

### Neutral Scale

- **Charcoal Gray** (`#4D4D4D`): Secondary text, muted copy, form labels
- **Dark Gray** (`#636363`): Tertiary text and subdued information
- **Medium Gray** (`#999999`): Disabled text, placeholder copy
- **Light Gray** (`#DDDDDD`): Subtle dividers and borders
- **Off-White** (`#F7F7F7`): Neutral background tint for subtlety
- **Pure White** (`#FFFFFF`): Primary background, card surfaces, text on dark

### Surface & Borders

- **Off-White Surface** (`#F7F7F7`): Input backgrounds and light container fills
- **Light Gray Border** (`#DDDDDD`): Subtle dividers and form field borders

### Semantic / Status

- **Error Red** (`#ED1D24`): Error messages and validation failures (primary error state)
- **Deep Error** (`#DB0F00`): Critical error states requiring immediate attention
- **Alert Red** (`#DC3545`): Alternative error messaging
- **Warning Gold** (`#F8C700`): Warning and cautionary notices

## 3. Typography Rules

### Font Family

**Primary**: Mulish (sans-serif)
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`

**Icon Font**: icomoon (icon ligatures)
- Fallback: `monospace` for degraded rendering

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H1 | Mulish | 28px | 700 | 36px | 0px | Hero headlines; brand-level prominence |
| Heading / H2 | Mulish | 12px | 700 | 14px | 0px | Small section headers and badge labels |
| Heading / H3 | Mulish | 18px | 700 | 26px | 0px | Subsection titles and card headers |
| Body Primary | Mulish | 16px | 700 | 24px | 0px | Emphasized body text, strong statements |
| Body Regular | Mulish | 16px | 500 | 24px | 0px | Standard paragraph and description text |
| Button | Mulish | 13px | 400 | 13px | 0px | Action labels and button text |
| Input | Mulish | 16px | 400 | 20px | 0px | Form field text entry and placeholder |
| List Item | Mulish | 14px | 600 | 20px | 0px | Bulleted and numbered list items |
| Caption / Meta | Mulish | 12px | 400 | 16px | 0px | Supporting information and timestamps |

### Principles

- **Hierarchy through weight, not size**: Mulish's font-weight carries most semantic load; size changes reserved for major sectional breaks
- **Generous line height**: 1.5x ratio across body text (24px line height for 16px font) ensures scannability and accessibility
- **Consistent baseline**: All text aligns to a visual grid using line-height multiples of 4px
- **Icon integration**: icomoon font seamlessly substitutes for icon graphics at button and navigation scale
- **Button terseness**: Action text kept under 20 characters; size reduced to 13px to signal secondary importance relative to body

## 4. Component Stylings

### Buttons

#### Primary Button (CTA)
- **Background**: `#0046C1`
- **Text Color**: `#FFFFFF`
- **Font Size**: `13px`
- **Font Weight**: `400`
- **Font Family**: Mulish
- **Padding**: `12px 20px`
- **Border Radius**: `0px`
- **Border**: `1px solid #0046C1`
- **Box Shadow**: `none`
- **Line Height**: `13px`
- **Hover State**: Background `#002540`, border `#002540`
- **Active State**: Background `#000E1A`, border `#000E1A`
- **Disabled State**: Background `#DDDDDD`, text color `#999999`, border `#DDDDDD`

#### Secondary Button (Outlined)
- **Background**: `#FFFFFF`
- **Text Color**: `#0391FF`
- **Font Size**: `13px`
- **Font Weight**: `400`
- **Font Family**: Mulish
- **Padding**: `12px 20px`
- **Border Radius**: `40px`
- **Border**: `1px solid #0391FF`
- **Box Shadow**: `none`
- **Line Height**: `13px`
- **Hover State**: Background `#F1F9FF`, text color `#0046C1`, border `#0046C1`
- **Active State**: Background `#D9EEFF`, text color `#002540`

#### Ghost Button (Minimal)
- **Background**: `rgba(0, 0, 0, 0)`
- **Text Color**: `#4D4D4D`
- **Font Size**: `13px`
- **Font Weight**: `400`
- **Font Family**: Mulish
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: `none`
- **Box Shadow**: `none`
- **Line Height**: `13px`
- **Hover State**: Text color `#000E1A`, text-decoration underline
- **Active State**: Text color `#000E1A`, text-decoration underline

#### Icon Button
- **Background**: `rgba(0, 0, 0, 0)`
- **Text Color**: `#000E1A`
- **Font Size**: `13px`
- **Font Weight**: `400`
- **Font Family**: icomoon
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: `none`
- **Box Shadow**: `none`
- **Line Height**: `13px`
- **Hover State**: Text color `#0391FF`

### Cards & Containers

#### Card Default
- **Background**: `#FFFFFF`
- **Border**: `1px solid #DDDDDD`
- **Border Radius**: `0px`
- **Padding**: `20px`
- **Box Shadow**: `none`
- **Hover State**: Border `#0391FF`, shadow `0px 2px 8px rgba(3, 145, 255, 0.1)`

#### Card Highlighted
- **Background**: `#D9EEFF`
- **Border**: `1px solid #0046C1`
- **Border Radius**: `40px`
- **Padding**: `12px`
- **Box Shadow**: `none`
- **Text Color**: `#0046C1`
- **Font Weight**: `600`
- **Font Size**: `14px`

#### Container / Section
- **Background**: `#FFFFFF` or `#F7F7F7` for alternating sections
- **Padding**: `40px` (top/bottom), `32px` (sides)
- **Border Radius**: `0px`
- **Border**: `none`

### Inputs & Forms

#### Text Input Default
- **Background**: `#F7F7F7`
- **Text Color**: `#000E1A`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Font Family**: Mulish
- **Padding**: `1px 2px`
- **Border Radius**: `0px`
- **Border**: `1px solid #DDDDDD`
- **Line Height**: `20px`
- **Placeholder Color**: `#999999`
- **Focus State**: Border `#0391FF`, background `#FFFFFF`, outline `none`
- **Error State**: Border `#ED1D24`, background `#FFFFFF`

#### Input Label
- **Font Size**: `14px`
- **Font Weight**: `600`
- **Color**: `#000E1A`
- **Line Height**: `20px`
- **Margin Bottom**: `8px`

#### Input Helper Text
- **Font Size**: `12px`
- **Font Weight**: `400`
- **Color**: `#4D4D4D`
- **Margin Top**: `4px`

#### Input Error Message
- **Font Size**: `12px`
- **Font Weight**: `400`
- **Color**: `#ED1D24`
- **Margin Top**: `4px`

### Navigation

#### Navigation Link
- **Background**: `rgba(0, 0, 0, 0)`
- **Text Color**: `#000E1A`
- **Font Size**: `16px`
- **Font Weight**: `500`
- **Font Family**: Mulish
- **Padding**: `0px 24px 0px 0px`
- **Border Radius**: `0px`
- **Border**: `none`
- **Line Height**: `24px`
- **Hover State**: Text color `#0391FF`
- **Active State**: Text color `#0046C1`, border-bottom `2px solid #0046C1`

### Links

#### Text Link Standard
- **Background**: `rgba(0, 0, 0, 0)`
- **Text Color**: `#0000EE`
- **Font Size**: `16px`
- **Font Weight**: `500`
- **Font Family**: Mulish
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: `none`
- **Line Height**: `24px`
- **Text Decoration**: `underline`
- **Hover State**: Color `#0046C1`

#### Badge / Tag Link
- **Background**: `#D9EEFF`
- **Text Color**: `#0046C1`
- **Font Size**: `14px`
- **Font Weight**: `600`
- **Font Family**: Mulish
- **Padding**: `12px`
- **Border Radius**: `40px`
- **Border**: `1px solid rgba(0, 0, 0, 0)`
- **Line Height**: `20px`
- **Hover State**: Background `#B3DCFF`, text color `#002540`

### Badges

#### Badge Primary
- **Background**: `#0046C1`
- **Text Color**: `#FFFFFF`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 8px`
- **Border Radius**: `0px`
- **Border**: `none`

#### Badge Secondary
- **Background**: `#D9EEFF`
- **Text Color**: `#0046C1`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 8px`
- **Border Radius**: `0px`
- **Border**: `1px solid #0046C1`

#### Badge Success
- **Background**: `#77DD77`
- **Text Color**: `#FFFFFF`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 8px`
- **Border Radius**: `0px`

#### Badge Error
- **Background**: `#ED1D24`
- **Text Color**: `#FFFFFF`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 8px`
- **Border Radius**: `0px`

#### Badge Warning
- **Background**: `#F8C700`
- **Text Color**: `#000E1A`
- **Font Size**: `12px`
- **Font Weight**: `700`
- **Padding**: `4px 8px`
- **Border Radius**: `0px`

## 5. Layout Principles

### Spacing System

**Base Unit**: `4px`

**Scale**:
- `4px`: Tight micro-spacing between inline elements
- `8px`: Minimal padding around icons and compact components
- `12px`: Standard padding within cards and badges
- `16px`: Default padding for form controls
- `20px`: Comfortable padding around card bodies
- `24px`: Navigation and section breaks
- `32px`: Container side padding
- `36px`: Vertical rhythm spacer
- `40px`: Major section padding (top/bottom)
- `60px`: Large vertical sections and hero spacing
- `72px`: Maximum breathing room between major content blocks

**Usage Context**:
- Form inputs and buttons use `12px` to `20px` padding
- Cards use `20px` internal padding with `12px` gap between items
- Sections use `40px` vertical padding with `32px` horizontal padding
- Gap between grid items: `16px` to `24px` depending on layout density

### Grid & Container

**Max Width**: `1200px` (desktop container, centered with fluid margins)

**Column Strategy**: 
- Desktop (>1024px): 12-column grid with `24px` column gap
- Tablet (768px–1024px): 8-column grid with `16px` gap
- Mobile (<768px): 4-column grid with `12px` gap

**Section Patterns**:
- Full-width hero sections with `60px` top/bottom padding
- Container sections at `1200px` max-width, centered
- Alternating white (`#FFFFFF`) and light gray (`#F7F7F7`) backgrounds for visual rhythm
- Gutters maintain `32px` minimum on all sides

### Whitespace Philosophy

Generous whitespace is employed throughout the design to reduce cognitive load and elevate visual hierarchy. Spacing around major content blocks (40px–72px) signals importance and grouping, while tighter micro-spacing (4px–12px) keeps related elements cohesive. The design avoids cluttering by using whitespace to separate concerns—navigation sits in its own padded zone, card decks have breathing room, and form groups are clearly demarcated. This breathing room conveys premium quality and trustworthiness, essential for travel booking contexts.

### Border Radius Scale

- `0px`: All standard components (buttons, inputs, cards, navigation)
- `40px`: Pill-style buttons and highlighted badges; signals secondary/accent importance
- Consistency: Geometric precision across the system reinforces modernity and corporate reliability

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow; `box-shadow: none` | Default cards, buttons, inputs, navigation |
| Subtle (1) | `0px 2px 8px rgba(3, 145, 255, 0.1)` | Card hover states, light interactions |
| Elevated (2) | `0px 4px 16px rgba(0, 14, 26, 0.12)` | Dropdown menus, modal overlays |
| High (3) | `0px 8px 24px rgba(0, 14, 26, 0.15)` | Floating action buttons, modal dialogs |

**Shadow Philosophy**

The design system adopts a minimal shadow approach, preferring flat, geometric clarity over dimensional depth. Shadows appear only on interactive hover states or modals to signal elevation and interaction opportunity. This choice reinforces the brand's modern, corporate aesthetic while maintaining accessibility through clear visual hierarchy. Shadows use semi-transparent navy (`rgba(0, 14, 26, ...)`) or blue (`rgba(3, 145, 255, ...)`) to remain harmonious with the color palette. The overall principle: let color, spacing, and typography carry hierarchy; shadows are reserved for genuine interactivity signals.

## 7. Do's and Don'ts

### Do

- **Use navy (`#000E1A`) as the primary text color** for all body copy, headings, and primary navigation; it ensures legibility and cohesion
- **Reserve bright blues (`#0391FF`, `#0046C1`) for interactive elements** such as links, button borders, and focus states; this creates clear affordance
- **Apply 40px–72px vertical spacing between major content sections** to establish visual rhythm and reduce cognitive load
- **Stick to 0px border radius for standard components** (buttons, inputs, cards); use 40px only for pill-style secondary buttons and highlighted badges
- **Maintain consistent 16px font size for body text** with 24px line height; this ensures optimal readability and baseline rhythm
- **Use the neutral gray scale (`#4D4D4D` → `#999999` → `#DDDDDD`)** for secondary text, disabled states, and borders; never mix semantic reds into neutral contexts
- **Implement focus states on all interactive elements** using a bright blue border or text color change; ensure keyboard navigation is visible
- **Test all color combinations for WCAG AA contrast** at minimum; navy-on-white and white-on-blue exceed 4.5:1 requirements

### Don't

- **Don't use rounded corners on primary buttons or form fields**; the 0px radius is foundational to the brand's geometric precision
- **Don't introduce new colors outside the defined palette**; every UI element must map to an existing semantic role
- **Don't reduce line height below 20px for body text**; tight leading damages readability on small screens
- **Don't nest shadows beyond the three defined levels**; excessive depth contradicts the flat, modern aesthetic
- **Don't scale button padding below 12px or above 20px**; consistency maintains component recognition
- **Don't use the error red (`#ED1D24`) for non-error states**; semantic colors must retain their meaning across the interface
- **Don't place text smaller than 12px in body copy**; captions must remain readable without magnification
- **Don't apply hover states to non-interactive elements** (like static text or disabled buttons); reserve state changes for actionable components

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 768px | 4-column grid; 12px gap; 24px container padding; single-column layouts; nav collapses to hamburger |
| Tablet | 768px–1024px | 8-column grid; 16px gap; 32px container padding; 2-column card decks; nav remains visible |
| Desktop | > 1024px | 12-column grid; 24px gap; 32px horizontal / 40px vertical section padding; full-width hero sections |
| Wide | > 1440px | Container max-width increases to 1400px; column gap remains 24px |

### Touch Targets

- **Minimum touch target size**: `48px × 48px` (buttons, icon buttons, navigation links on mobile)
- **Button padding on mobile**: `16px` horizontal, `12px` vertical (min 44px height)
- **Input field height**: minimum `44px` on touch devices
- **Link spacing**: minimum `8px` margin between adjacent links to prevent accidental taps
- **Icon size in touch contexts**: `24px` or larger; never smaller than `20px` on mobile

### Collapsing Strategy

- **Desktop navigation**: Horizontal navbar with 24px padding between links
- **Tablet navigation**: Horizontal navbar with 16px padding; reduce font size to 14px if space constrained
- **Mobile navigation**: Hamburger menu icon (`icomoon` icon); dropdown reveals navigation items in vertical stack with 12px padding
- **Card decks**: 2 columns on tablet (grid-template-columns: repeat(2, 1fr)); 1 column on mobile
- **Form layouts**: Multi-column on desktop; single-column stack on mobile
- **Section padding**: 40px on desktop → 32px on tablet → 20px on mobile
- **Typography scaling**: Headings reduce by 2px–4px on mobile; body text remains 16px for accessibility
- **Hero sections**: Full viewport height on desktop; auto-height on mobile with content reflow

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA**: Cobalt Blue (`#0046C1`) — solid fill for primary actions
- **Secondary CTA**: Bright Azure (`#0391FF`) — outlined or border-only for secondary actions
- **Hyperlink**: Bright Sky (`#0000EE`) — text links and underlines
- **Body Text**: Deep Navy (`#000E1A`) — all primary copy
- **Secondary Text**: Charcoal Gray (`#4D4D4D`) — muted labels and meta information
- **Background**: Pure White (`#FFFFFF`) — card and section surfaces
- **Surface Tint**: Off-White (`#F7F7F7`) — alternating section backgrounds
- **Border**: Light Gray (`#DDDDDD`) — subtle dividers and input edges
- **Error**: Error Red (`#ED1D24`) — validation failures and error states
- **Success**: Lime Green (`#77DD77`) — positive confirmation
- **Warning**: Warning Gold (`#F8C700`) — cautionary notices

### Iteration Guide

1. **Color Foundation**: All text defaults to `#000E1A`; reserve accent blues for interactive states and links only. Never use navy for backgrounds unless intentional dark mode.

2. **Typography Baseline**: Body text is always `16px` / `400` weight with `24px` line height. Headings scale up to `18px` or `28px` using `700` weight. Buttons stay at `13px` / `400`.

3. **Spacing Rhythm**: Use 4px as base unit; all spacing derives from multiples (8px, 12px, 16px, 20px, 24px, 32px, 40px, 60px, 72px). Section padding is `40px` top/bottom, `32px` sides on desktop.

4. **Component Borders**: Set all border-radius to `0px` by default. Only pill-style components (secondary buttons, badge highlights) use `40px` radius. No other radius values exist.

5. **Interactive States**: Buttons have clear hover (darker color), active (darkest), and disabled (gray, `#999999`) states. Links underline on hover. Inputs show `#0391FF` border on focus.

6. **Shadows & Depth**: Avoid shadows except on hover/focus states. When needed, use `0px 2px 8px rgba(3, 145, 255, 0.1)` for subtle lift or `0px 4px 16px rgba(0, 14, 26, 0.12)` for emphasis.

7. **Responsive Priority**: Mobile-first: assume 4-column grid and 12px gaps; scale up to tablet (8-col, 16px gap) and desktop (12-col, 24px gap). Navigation collapses to hamburger on mobile.

8. **Semantic Colors**: Error is always `#ED1D24`, warning is `#F8C700`, success is `#77DD77`. Do not repurpose these. Status badges use solid fills with white text, never outlines.

9. **Accessibility Baseline**: All text must meet 4.5:1 contrast (navy on white: 15:1 ✓, white on blue: 8:1 ✓). Touch targets minimum `48px`. Focus states always visible (color change or border highlight, never outline: none without replacement).

10. **Brand Voice Through Form**: The design conveys trust through geometric precision (0px radius), premium whitespace (40px–72px sections), and restrained color (navy + accent blue). Never add decorative curves, gradients, or tertiary colors; simplicity is the brand strength.