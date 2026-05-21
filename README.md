# 🧬 Interactive DNA Double Helix Visualization

An advanced, interactive 3D simulation of the DNA Double Helix structure built from scratch using **pure WebGL** and vanilla JavaScript. This project provides an educational, high-performance visual tool to explore the chemical composition and biochemical properties of the four foundational nitrogenous bases: Adenine, Thymine, Guanine, and Cytosine.

---

## 🌟 Key Features

* **Pure WebGL Engine:** Rendered entirely using low-level vanilla WebGL without heavy third-party frameworks like Three.js, ensuring optimized performance and lightning-fast loading speeds.
* **Complementary Base Pairing:** Accurately visualizes Watson-Crick base pairing rules ($A=T$ and $G\equiv C$) with distinct neon color-coding and dynamic chemical bond lines.
* **Interactive Scientific Inspection Panel:** Clicking on any nucleotide or legend item reveals a dedicated analytical breakdown of that molecule.
* **Dynamic Epigenetic & Bio-Metadata Display:** Displays critical biological attributes inline, including:
  * Molecular Weight & Chemical Formula
  * Discovery History & Scientific Timeline
  * Hydrogen Bond Configuration
  * Comprehensive Genetic Role Descriptions
* **3D Viewport Controls:** Full user autonomy over the viewport with real-time mouse dragging for 3D rotation, scrolling for interactive zooming, and a custom animation subsystem.
* **Auto-Spin Control Hub:** A responsive custom UI container featuring smooth rotation automation with precise speed configuration sliders.

---

## 🧪 Biochemical Database Specs

The application embeds an exhaustive scientific dictionary mapping out the structural properties of each nucleobase:

* **Purines (Double-Ring):** **Adenine** ($C_5H_5N_5$) and **Guanine** ($C_5H_5N_5O$), detailing their roles from metabolic energy transfers (ATP conversion) to high thermal-stability GC genomic regions.
* **Pyrimidines (Single-Ring):** **Thymine** ($C_5H_6N_2O_2$) and **Cytosine** ($C_4H_5N_3O$), illustrating structural UV photostability and methylation pathways for epigenetic gene regulation.

---

## 🛠️ Project Structure

The project follows a clean, decoupled modular layout separating core rendering logic, stylistic environments, and DOM interaction hooks:

```text
├── index.html          # Semantic HTML5 architecture holding structural panels & the WebGL canvas
├── style.css           # Modern cosmic UI theme utilizing space typography and micro-interactions
└── script.js           # Matrix mathematics, raw shader programs, buffer objects, and state logic
