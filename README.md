# STEP UP - Student Management System

This application is ready for deployment to **Netlify** via **GitHub**.

## Deployment Steps

1.  **Push to GitHub**: Initialize a Git repository and push your code to a GitHub repository.
2.  **Connect to Netlify**:
    -   Log in to [Netlify](https://www.netlify.com/).
    -   Click **"Add new site"** > **"Import an existing project"**.
    -   Select **GitHub** and choose your repository.
3.  **Configure Build Settings**:
    -   **Build Command**: `npm run build`
    -   **Publish Directory**: `dist`
    -   *Note: These are already configured in `netlify.toml`.*
4.  **Environment Variables**:
    -   Go to **Site Settings** > **Environment variables**.
    -   Add `GEMINI_API_KEY` with your Gemini API key.
5.  **Deploy**: Netlify will automatically build and deploy your site.

## Configuration Files Added

-   `netlify.toml`: Configures the build command and publish directory for Netlify.
-   `public/_redirects`: Ensures that Single Page Application (SPA) routing works correctly on Netlify.
