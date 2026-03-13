
# SWA Zoning Analyzer - Documentation

## Overview
The **SWA Zoning Analyzer** is a professional-grade architectural tool designed for rapid feasibility studies of NYC residential districts (R1 through R12). It integrates current NYC Zoning Resolution data with "City of Yes" (UAP/QRS) bonuses and commercial overlays to provide real-time architectural insights and 3D massing visualizations.

---

## Key Features

### 1. Dynamic Zoning Engine
- **District Database**: Comprehensive lookup for R1-R12 districts including Floor Area Ratio (FAR), Max Building Height, Street Wall requirements, and Lot Coverage.
- **City of Yes Integration**: Toggle between base regulations and "Universal Affordability Preference" (UAP) or "Qualitative Residential Standards" (QRS) to see expanded development potential.
- **Commercial Overlay**: Simulate C1/C2 overlays on residential districts, automatically calculating mixed-use ZFA potential.

### 2. Precise Site Geometry
- **Lot Configuration**: Adjustable width and depth with automatic square footage calculation.
- **Lot Type Logic**: Toggle between **Interior** and **Corner** lots. The app automatically adjusts rear yard requirements (30' vs 0') and lot coverage allowances based on the selected type.
- **Street Width Sensitivity**: Wide vs. Narrow street width selection dynamically changes the required zoning setback (10' vs 15').

### 3. Massing Analysis & Calculators
- **ZFA & Units**: Calculates maximum permitted Residential and Commercial Zoning Floor Area. Estimates dwelling units based on a standard factor of 680 SF/unit.
- **Parking Requirements**: Determines required off-street parking spaces, incorporating "City of Yes" transit-oriented waivers.
- **Story Calculation**: 
    - **Physical Capacity**: Calculated as `Max Building Height / Floor Height`.
    - **FAR Utilization**: Shows the theoretical floor count required to utilize full FAR at max lot coverage.
    - **Bottleneck Identification**: Informs the designer whether the building is "Height Limited" or "FAR Limited."

### 4. Professional Visualizations
- **2D Section View**: A scaled architectural section showing the zoning envelope, street wall (base height), max height, and required setbacks.
- **2D Plan View**: A top-down view showing the property line, building footprint (based on coverage), required front yards, and rear yard setbacks.
- **Interactive 3D Massing**: A high-fidelity Three.js model featuring:
    - **Property Line Boundaries**: Visualized as a semi-transparent ground plane.
    - **Tiered Volume**: Distinct rendering of the street wall base and the setback upper volume.
    - **Floor Plates**: Wireframe indicators for every floor level.
    - **Orbit Controls**: Fully interactive rotation, zoom, and pan.

### 5. PDF Reporting
- Generates a high-resolution, one-page professional report containing all metrics, tables, and visual diagrams.

---

## How the App Works

1.  **Input Phase**: User selects the Zoning District and enters Site Dimensions (Width/Depth) in the sidebar.
2.  **Logic Processing**: The engine fetches constants from `ZONING_DB` and applies conditional logic:
    - If `isBonus` is true, partial overrides from the bonus object are merged into the base zoning parameters.
    - If `isCorner` is true, `Rear Yard` is set to 0 and `Lot Coverage` uses the corner-specific constant.
3.  **Visualization Sync**:
    - The **Section SVG** scales itself based on the maximum height of the selected district to ensure the diagram fits the viewport.
    - The **3D Scene** re-initializes geometries whenever lot dimensions or zoning heights change, ensuring a 1:1 spatial representation of the math.
4.  **Reporting**: Using `html2canvas` and `jsPDF`, the app captures the dashboard state and packages it into a downloadable PDF for client presentations or internal records.

---

## Technical Stack
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **3D Engine**: Three.js
- **PDF Generation**: jsPDF & html2canvas
- **Type Safety**: TypeScript

---
*Designed by SAM | SWA Architecture Studio Tool*
