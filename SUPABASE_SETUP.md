# Supabase Configuration Guide

## Required Environment Variables

This project requires Supabase environment variables to function properly. Follow these steps to set them up:

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Click on **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Create `.env.local` File

Create a `.env.local` file in the root directory of your project with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Verify Installation

After adding the environment variables:

1. Stop the dev server if it's running
2. Run `npm run dev` (or `pnpm dev`)
3. The Supabase client should now initialize without errors

## Environment Variables Explained

- **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project's REST API endpoint
  - Example: `https://your-project.supabase.co`
  
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: The public anonymous key for client-side authentication
  - This is safe to expose in frontend code (it's the "anon" key)
  - Prefix `NEXT_PUBLIC_` makes it available in the browser

## Troubleshooting

If you see the error:
```
Your project's URL and Key are required to create a Supabase client!
```

1. Check that `.env.local` file exists in the project root
2. Verify the values are correctly copied from your Supabase dashboard
3. Restart the dev server
4. Clear `.next` directory: `rm -r .next` then run dev again

## Security Notes

- Never commit `.env.local` to version control (it's in `.gitignore`)
- Keep your ANON_KEY secure - while it's meant to be public, treat it as sensitive
- For server-side operations, you may need additional environment variables (like `SUPABASE_SERVICE_ROLE_KEY`)
