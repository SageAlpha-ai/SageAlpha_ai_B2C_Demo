# SageAlpha Frontend (Vite + React)

This folder contains the new React frontend for SageAlpha.ai.

Quick start:

1. cd frontend
2. npm install
3. npm run dev

Notes:
- The development server proxies API calls to the backend at http://localhost:8000 to preserve same-origin cookies.
- The frontend uses Tailwind CSS and React Router.
- API calls use axios with withCredentials = true so session cookies are sent.
