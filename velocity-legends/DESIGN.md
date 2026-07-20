---
name: Velocity Legends
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e6beb2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ad897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59e'
  primary: '#ffb59e'
  on-primary: '#5e1700'
  primary-container: '#ff571a'
  on-primary-container: '#521300'
  inverse-primary: '#ae3200'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.5'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.2em
spacing:
  unit: 4px
  gutter: 16px
  margin-safe: 32px
  container-padding: 24px
---

## Brand & Style
The brand personality is **Aggressive, Premium, and High-Octane**. This design system targets a core gaming audience that demands AAA visual fidelity, drawing inspiration from high-performance automotive engineering and cutting-edge motorsport technology.

The design style is **Future-Sport**, a hybrid of high-end Minimalism and Glassmorphism with Brutalist structural undertones. The UI mimics a pilot's HUD, utilizing frosted glass textures to maintain high environmental visibility without sacrificing legibility. Every element is engineered to evoke the sensation of speed, precision, and the raw power of Unreal Engine 5. Expect sharp angles, ray-traced lighting cues, and subtle "digital" imperfections like scanlines to ground the interface in a high-tech reality.

## Colors
The palette is built on a foundation of **Carbon Black (#0A0A0A)** and **Deep Slate**, providing a high-contrast backdrop for high-visibility accent colors.

- **Velocity Orange (#FF4D00):** Used for primary actions, critical alerts, and finish-line indicators. It represents heat, friction, and intensity.
- **Electric Cyan (#00F2FF):** Used for telemetry data, nitrogen (NOS) levels, and secondary navigational cues. It represents electricity and advanced tech.
- **Neutral / Slate:** A range of grays from `#0A0A0A` to `#333639` used for depth layering and container backgrounds.
- **Surface Overlays:** Use 40-60% opacity with backdrop blurs (20px+) for HUD elements to create the "Glassmorphism" effect.

## Typography
Typography is a critical driver of the "speed" aesthetic. 

1.  **Headlines (Anybody):** Utilizes a heavy weight and mandatory italicization to suggest forward motion. 
2.  **Body (Hanken Grotesk):** A clean, modern sans-serif for descriptions, settings, and news content.
3.  **Data/Telemetry (JetBrains Mono):** Monospaced fonts are used for all dynamic values (speedometer, lap times, gear shifts) to ensure character widths remain constant as numbers rapidly change.

All caps should be used sparingly for secondary labels and section headers to maintain a technical, militaristic feel.

## Layout & Spacing
The layout uses a **Fluid Grid** model with generous safe zones to account for mobile device notches and player grip areas. 

- **HUD Layout:** Critical data is pinned to the corners (Speedometer bottom-right, Map top-left) with a 32px safe-area margin. 
- **Menu Layout:** Uses a slanted vertical column system (angled at 15 degrees) to align with the italicized typography.
- **Rhythm:** A 4px baseline grid ensures tight, technical alignment. Spacing between related telemetry blocks should be 8px, while spacing between major HUD modules should be 24px+.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Optical Glows** rather than traditional drop shadows.

- **HUD Glass:** Elements use a `background-blur(24px)` with a 1px `Electric Cyan` inner stroke (opacity 20%) to simulate a glass edge.
- **Lighting:** Use "Ray-traced" cues—subtle linear gradients that mimic light hitting a metallic surface.
- **Scanlines:** A 10% opacity repeating pattern of horizontal lines is overlaid on all glass containers to give a "digital display" feel.
- **Active State Glow:** Interaction points (selected buttons) emit a soft outer glow in the primary `Velocity Orange` to simulate an illuminated hardware button.

## Shapes
The design system utilizes **Sharp Angles (0px roundedness)** to emphasize a mechanical, aggressive look. 

To add visual interest, use **clipped corners (chamfers)** at 45-degree angles on large containers and buttons. This "Stealth Bomber" geometry reinforces the Future-Sport aesthetic. If a container requires a fill, use a diagonal striped pattern (10% opacity) in the background to suggest carbon fiber or industrial grip tape.

## Components
- **Buttons:** Primary buttons use a solid `Velocity Orange` fill with a slight inner top-edge highlight (1px white, 30% opacity). Secondary buttons are "ghost" style with a 2px `Electric Cyan` border and a 15-degree slanted cut on the right side.
- **Telemetry Chips:** Small, monospaced data blocks with a semi-transparent slate background and a left-accent bar in Cyan.
- **Progress Bars (NOS/Fuel):** Segmented bars instead of solid fills. Each segment represents a 5% increment to enhance the technical read.
- **Input Fields:** Bottom-border only, using `JetBrains Mono` for the text. Active state triggers a subtle scanline flicker effect.
- **Cards (Car Selection):** High-contrast "hero" images with text overlays. The background of the card should be a vertical gradient from `#1A1C1E` to `transparent` to let the 3D car model pop.
- **Lists:** Items separated by thin 1px lines with a 40% opacity; selected items feature a "moving" light-sweep animation across the surface.