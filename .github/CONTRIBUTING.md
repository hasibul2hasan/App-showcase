# Contributing to OMGMimiq

Thank you for your interest in contributing to **OMGMimiq**! Contributions make the open-source community an inspiring place to learn and build together.

Please take a moment to review this guide before submitting your contributions.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainer.

---

## How Can I Contribute?

- **Reporting Bugs:** Check existing [GitHub Issues](https://github.com/hasibul2hasan/omgmimiq/issues) before opening a new one. Provide reproducible steps, expected vs. actual behavior, and browser/device details (especially for mobile sensor issues).
- **Suggesting Features:** Open an issue describing the proposed feature, why it is useful, and potential implementation approaches.
- **Submitting Code:** Improvements to Three.js rendering, WebSocket latency, UI controls, or mobile responsiveness are welcome.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (comes bundled with Node.js)

### 2. Setup
```bash
# Clone your fork of the repository
git clone https://github.com/<your-username>/omgmimiq.git

# Navigate into the project directory
cd omgmimiq

# Install dependencies
npm install

# Start development server with live reload
npm run dev
```

The application will be accessible at:
- **Desktop Studio Viewport:** [http://localhost:3000](http://localhost:3000)
- **Mobile Remote Controller:** [http://localhost:3000/phone](http://localhost:3000/phone)

> [!TIP]
> To test mobile motion sensors locally, ensure both your computer and mobile phone are connected to the same local Wi-Fi network, and access the server using your local network IP (e.g. `http://192.168.x.x:3000/phone`).

---

## Project Structure

```text
omgmimiq/
├── server.js          # Express server & WebSocket signaling server
├── netlify.toml       # Netlify SPA routing rules & build configuration
├── package.json       # Project dependencies & scripts
└── public/
    ├── index.html     # Desktop Three.js 3D staging studio & UI controls
    ├── phone.html     # Mobile device orientation streamer & touch pad
    ├── style.css      # Core styles and responsive layout
    ├── images/        # Static UI and branding assets
    └── models/        # 3D assets (.glb, .fbx, .gltf)
```

---

## Pull Request Guidelines

1. **Fork the repo** and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**:
   - Keep code clean, readable, and well-commented where appropriate.
   - Test across desktop and mobile devices/simulators to ensure 3D performance and responsiveness.
3. **Commit your changes**:
   - Write clear, concise commit messages following conventional standards (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
   ```bash
   git commit -m "feat: add support for custom lighting presets"
   ```
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**:
   - Fill out the PR description with details about the changes made, any screenshots/recordings of visual adjustments, and related issue numbers.
