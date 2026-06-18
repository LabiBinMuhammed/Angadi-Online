# Deploying the Web Project on Vercel

This guide provides the necessary steps to deploy the Next.js web application on Vercel.

## 1. Project Configuration in Vercel

Since this is a monorepo / multi-project repository containing both a mobile app and a web app, you must tell Vercel to build the project from the `web` subdirectory.

When importing your project on Vercel:
1. In the **Configure Project** step, look for the **Root Directory** setting.
2. Click **Edit** and select or type `web`.
3. Keep the **Framework Preset** as **Next.js**.

## 2. Environment Variables

You need to configure the following environment variables in the Vercel dashboard (**Project Settings** > **Environment Variables**):

| Key | Description | Example / Source |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Can be copied from your local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client anonymous public key | Can be copied from your local `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin actions) | Can be copied from your local `.env.local` |
| `GOOGLE_TRANSLATION_API_KEY` | Google Translate API Key (optional) | Used by `/api/translate` |

> [!IMPORTANT]
> Make sure all keys are populated exactly as they are in your local `.env.local`. Do not share the `SUPABASE_SERVICE_ROLE_KEY` publicly; Vercel stores it securely.

## 3. Deployment

Once the configuration and environment variables are set:
1. Click **Deploy**.
2. Vercel will automatically build the Next.js app, run TypeScript compilation, and deploy it to a global edge network.
