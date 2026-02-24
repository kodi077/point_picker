---
description: How to deploy the Image Anchor Point Tool to Vercel
---

# Deploying to Vercel

To make this app available online, follow these steps:

### Option 1: Using the Vercel CLI (Quickest)

1. Open your terminal in the project directory:
   ```bash
   cd /Users/tourlive202507/Desktop/point_picker/anchor-tool
   ```
2. Install the Vercel CLI if you haven't:
   ```bash
   npm i -g vercel
   ```
3. Login and deploy:
   ```bash
   vercel login
   vercel
   ```
4. Follow the prompts (use defaults). Once finished, Vercel will give you a live URL.

### Option 2: Connecting to GitHub (Recommended for updates)

1. Create a new repository on GitHub.
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) and click **"New Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect the settings from `vercel.json` and deploy. Every time you push to GitHub, the site will update automatically!

### Important Configuration Note
The `vercel.json` file is already configured to:
- Run `npm install`
- Run `npm run build` (to generate `dist/bundle.js`)
- Serve the root directory (where `index.html` is located)
