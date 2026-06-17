# The Lecture Hall
> A living textbook written by practitioners — intuition-first, simulation-backed, and always growing.

**Other name candidates:** Intuition Lab, The Signal Path, Groundplane, Node Vault, Fermi's Bench (any suggestions?)

---

## Vision

The Lecture Hall is an interactive educational platform documenting concepts from Electrical Engineering through visualizations, simulations, design stories, and mini-games. The goal is not merely to present information, but to help users build intuition through exploration and experimentation.

This is a **living textbook** — open to contributions from EE practitioners, researchers, and students. Content is community-enforced for accuracy and continuously extended.

---

## Core Sections

### Circuits
- Circuit Analysis
- Operational Amplifiers
- Filters
- Feedback Systems

### Electronics
- Diodes
- BJTs
- MOSFETs
- Analog Design

### Signals and Systems
- Convolution
- Fourier Series
- Fourier Transform
- Laplace Transform
- Sampling Theory

### Control Systems
- Transfer Functions
- Stability
- Root Locus
- Bode Plots
- Control Loops
- PID Controllers

### Power Electronics
- Buck Converters
- Boost Converters
- Flyback Converters
- Motor Control
- PFC (Power Factor Correction)
- LLC Resonant Converters

### Digital Design
- Logic Gates
- Finite State Machines
- Verilog
- FPGA Design

### Computer Architecture
- Pipelines
- Hazards
- Tomasulo Algorithm
- Out-of-Order Execution
- Caches and Memory

### VLSI & IC Design
- CMOS Logic
- Layout
- DRC/LVS
- Parasitics
- SRAM
- ADCs
- PLLs
- RFIC
- PMIC

### Communications
- Modulation
- Wireless Systems
- Antennas
- RF Fundamentals

---

## Interactive Features

### Visualizations
Slider or input-driven interactive plots for building intuition on key concepts. Examples:
- Bode plot explorer
- Laplace pole-zero explorer
- Smith chart explorer
- MOSFET IV curve explorer
- Control system response explorer
- Power factor waveform visualizer *(existing)*
- Beer glass power factor analogy *(existing)*
- LLC operating modes explorer *(existing)*
- Boost inductor position advantage *(existing)*

### Simulators
In-browser circuit and system simulators. Examples:
- Op-amp simulator
- Common-source amplifier designer
- Current mirror designer
- Buck converter simulator
- PLL simulator

### Design Stories *(optional, add when content warrants)*
Short narratives covering the engineering history and motivation behind important concepts — why something was invented, what problem it solved, and how the insight emerged.

---

## Mini-Games

### Circuit Challenge
Construct or modify circuits to satisfy given performance specifications.

### Stability Judge
Identify stable vs. unstable systems from pole-zero plots or Bode diagrams.

### Verilog Debug
Fix broken RTL code snippets to make a testbench pass.

---

## Interview Prep

Role-specific preparation modules, each covering:
- Key concepts tested
- Common question archetypes
- Typical gotchas and misconceptions
- Worked example problems

**Tracks:**
- Analog IC Design
- Power Electronics
- Digital / RTL Design
- RFIC
- Embedded Systems
- VLSI / Physical Design

---

## Worked Example Library

Concrete, fully solved problems organized by topic. Tied to the Interview Prep section where relevant. Each example follows the format:
1. Problem statement
2. Intuition / approach
3. Step-by-step solution
4. Key takeaway

---

## Progression System *(optional, for engagement)*
- XP for mastered concepts
- Achievement badges

---

## Contribution Guidelines

Each topic page follows a standard template to keep contributor experience consistent:

```
## [Topic Name]
> One-line hook: why this matters in practice.

### Intuition
[Plain-language explanation before any math]

### Theory
[Derivations, equations, key results]

### Interactive
[Embedded visualization or simulator]

### Worked Examples
[1–3 solved problems]

### Further Reading
[Links to papers, datasheets, textbooks]
```

Contributors should flag any content they are uncertain about using the repository's issue tracker. Accuracy is enforced by peer review from domain specialists.

---

## Long-Term Goals
- Full EE curriculum coverage across all sections
- Interactive simulations for every major topic
- Design interview preparation for all major EE roles
- Open-source educational resource with community contributions
- Mobile-friendly experience

---

## Technical Notes *(internal)*

- **Hosting:** GitHub Pages (static)
- **Interactive components:** Self-contained HTML files with embedded JS (Chart.js, D3, or vanilla canvas), embeddable per topic page
- **Math rendering:** KaTeX or MathJax
- **Search:** Algolia DocSearch (free for open-source/educational projects) — add early
- **In-browser simulation:** Falstad / circuit.js for simple circuits
