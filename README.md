# CodeDNA 🧬

**Turn any GitHub profile into a living genetic code.**

CodeDNA analyzes a developer's GitHub activity and generates:

- A beautiful **3D DNA helix** with particles & stars
- Night Owl + Polyglot trait scores
- Language composition
- Top repositories
- Generative **genome soundtrack**
- **Compare** two developers side-by-side
- **Export PNG** of the full genome
- **Shareable links** (`/u/username`)

---

## Features

| Feature              | Description                                      |
|----------------------|--------------------------------------------------|
| 3D Helix             | Rotating double-helix colored by languages       |
| Particles + Stars    | Ambient space background                         |
| Shareable URLs       | `/u/Chriscoding19`                               |
| Compare Mode         | Side-by-side genomes                             |
| Export PNG           | High-res download of the whole view              |
| Soundtrack           | Play the genome as generative music              |
| Top Repos            | Sorted by stars                                  |

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Vercel (Recommended)

### Option 1 — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. It will give you a live URL.

### Option 2 — GitHub + Vercel Dashboard

1. Create a new GitHub repository
2. Push this project:
   ```bash
   git init
   git add .
   git commit -m "CodeDNA v1.1 — living GitHub genomes"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/code-dna.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) → New Project → Import the repo
4. Deploy (defaults work fine)

After deploy, your genome will be live at:
`https://your-app.vercel.app/u/Chriscoding19`

---

## Tech Stack

- Vite + React 19 + TypeScript
- React Three Fiber + Drei (3D)
- React Router (shareable links)
- Octokit (GitHub API)
- Tone.js (audio)
- html2canvas (export)

---

Built to stand out on GitHub.
