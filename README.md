# Skybound Flight Booking Pro

A modern flight booking application built with React, TypeScript, and Vite.

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd airtkt-1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the root directory.
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build

Build the project for production:
```bash
npm run build
```

## 🛠️ Deployment

This project is configured to verify builds using GitHub Actions.

To deploy to GitHub Pages:
1. Go to repository Settings > Pages.
2. Select "GitHub Actions" as the source.
3. Push to `main` branch to trigger the deployment workflow.

## 📁 Project Structure

- `/src` - Source code
- `/public` - Static assets
- `.github/workflows` - CI/CD configurations
