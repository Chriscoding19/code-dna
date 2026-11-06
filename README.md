# CodeDNA

Turn any GitHub profile into a living genetic code.

CodeDNA is a web application that analyzes a developer’s public GitHub activity and generates a unique visual and interactive representation of their coding patterns. It collects repository data, language usage, and recent commit activity through the GitHub API, then transforms that information into a 3D DNA helix, trait scores, language composition, and a generative audio sequence.

## Features

- 3D DNA helix visualization colored by programming languages
- Night Owl and Polyglot trait scores
- Language composition breakdown
- Top repositories sorted by stars
- Generative genome soundtrack
- Side-by-side comparison of two developers
- Export the full view as a high-resolution PNG
- Shareable profile links (`/u/username`)

## How it works

The application retrieves public data for a given GitHub username. It processes the distribution of programming languages across repositories, estimates activity patterns from recent events, and maps the results into a DNA-like sequence. This sequence drives both the 3D visualization and the audio generation, creating a distinct genome for every developer.

## Getting Started

```bash
npm install
npm run dev
