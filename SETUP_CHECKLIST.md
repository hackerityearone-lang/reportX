# Setup Checklist for Project001

## Initial Setup

- [ ] **Install Dependencies**
  ```bash
  pnpm install
  # or npm install
  ```

- [ ] **Configure Supabase**
  1. Go to https://supabase.com/dashboard
  2. Create or select a project
  3. Go to Settings → API
  4. Copy your Project URL and Anon Key
  5. Create `.env.local` in the project root
  6. Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     ```
  7. See SUPABASE_SETUP.md for detailed instructions

- [ ] **Database Setup (Optional)**
  - Run SQL migrations in `scripts/` directory if setting up a fresh database:
    - `001_create_tables.sql`
    - `002_seed_products.sql`
    - `003_profile_trigger.sql`

- [ ] **Start Development Server**
  ```bash
  pnpm dev
  # or npm run dev
  ```

- [ ] **Access Application**
  - Open http://localhost:3000 in your browser

## Key Files

- **Environment Variables**: `.env.local` (not committed to git)
- **Configuration Examples**: `.env.example`
- **Middleware**: `proxy.ts` (handles Supabase session updates)
- **Supabase Clients**:
  - `lib/supabase/client.ts` - Browser client
  - `lib/supabase/server.ts` - Server client
  - `lib/supabase/proxy.ts` - Middleware/Proxy handler

## Troubleshooting

### Error: "Your project's URL and Key are required to create a Supabase client!"

**Solution**: Add your Supabase credentials to `.env.local`

1. Verify `.env.local` exists in the project root
2. Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. Ensure values are copied correctly (no extra spaces or quotes)
4. Restart the dev server

### Error: Building or running the project fails

1. Clear the cache: `rm -r .next`
2. Reinstall dependencies: `pnpm install`
3. Start dev server again: `pnpm dev`

## Project Structure

- **app/** - Next.js App Router pages and layouts
- **components/** - Reusable React components
- **lib/** - Utility functions and Supabase clients
- **public/** - Static assets
- **scripts/** - Database migration scripts
- **styles/** - Global styles

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
