# Server Configuration and Startup Guide

## Prerequisites

- [Bun](https://bun.sh/) runtime installed
- Dependencies installed (`bun install`)

## Configuration

### 1. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and configure.

### 2. Google OAuth Setup

1. Go to Google Cloud Console
2. Learn how to create OAuth using any tutorial
3. Create OAuth 2.0 credentials
4. Set authorized redirect URI to: `https://YOUR_SERVER/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

## Running the Server

```bash
bun run src/index.ts
```

### Socket Connection

The socket server URL is fetched from `https://aresconfig.ct8.pl/ef.txt` unless overridden by `ESSENCE_FIGHT_SERVER` environment variable.
