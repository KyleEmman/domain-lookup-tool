# Domain Lookup Tool

A comprehensive domain lookup application built with Next.js that provides traditional WHOIS domain information and AI-powered domain suggestions.

## Features

-   Traditional WHOIS domain and contact information lookup
-   AI-powered domain suggestions based on descriptions
-   Responsive design with accessibility features
-   Error handling and user feedback
-   Real-time input validation

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:5000](http://localhost:5000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
WHOIS_API_KEY=your_whois_api_key_here
```

### Getting API Keys

#### Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Generate your API key
4. Add it to your `.env.local` file

#### WHOIS API Key

1. Register an account on [WHOIS XML API](https://whois.whoisxmlapi.com)
2. Login to your dashboard
3. Navigate to your API key section
4. Copy your API key
5. Add it to your `.env.local` file

## Deployment

### Vercel (Recommended)

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com):

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Visit [Vercel](https://vercel.com) and sign up/login
3. Click "New Project" and import your repository
4. Add your environment variables in the Vercel dashboard:
    - Go to your project settings
    - Navigate to "Environment Variables"
    - Add `GEMINI_API_KEY` and `WHOIS_API_KEY`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/your-repo-name)

### Netlify

1. Build your application:

```bash
npm run build
```

2. Push your code to a Git repository
3. Visit [Netlify](https://netlify.com) and sign up/login
4. Click "New site from Git" and connect your repository
5. Set build settings:
    - Build command: `npm run build`
    - Publish directory: `.next`
6. Add environment variables in Netlify dashboard:
    - Go to Site settings → Environment variables
    - Add `GEMINI_API_KEY` and `WHOIS_API_KEY`
7. Deploy!

### Railway

1. Visit [Railway](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Next.js app
5. Add environment variables:
    - Go to your project → Variables tab
    - Add `GEMINI_API_KEY` and `WHOIS_API_KEY`
6. Deploy!

### DigitalOcean App Platform

1. Push your code to a Git repository
2. Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click "Create App" and connect your repository
4. Configure your app:
    - Build command: `npm run build`
    - Run command: `npm start`
5. Add environment variables in the app settings
6. Deploy!

### Docker Deployment

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t domain-lookup-tool .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key -e WHOIS_API_KEY=your_key domain-lookup-tool
```

### Self-Hosted (VPS/Dedicated Server)

1. Set up a server with Node.js 18+
2. Clone your repository:

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

3. Install dependencies:

```bash
npm install
```

4. Create `.env.local` with your API keys
5. Build the application:

```bash
npm run build
```

6. Start the application:

```bash
npm start
```

7. Set up a reverse proxy (nginx/Apache) and SSL certificate
8. Configure a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "domain-lookup" -- start
pm2 startup
pm2 save
```

## Build

To create a production build:

```bash
npm run build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
