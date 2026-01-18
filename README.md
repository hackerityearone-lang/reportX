# ReportX Stock - Professional Stock Management System

A modern, full-featured stock management application built with Next.js, React, TypeScript, and Supabase.

## Features

✅ **Dashboard** - Real-time insights and analytics  
✅ **Product Management** - Add, edit, delete products with inventory tracking  
✅ **Stock Management** - Stock In/Out transactions with detailed tracking  
✅ **Credit System** - Customer credit management and payment tracking  
✅ **Customer Management** - Complete customer database with history  
✅ **Reports** - Comprehensive reporting with multiple views  
✅ **Multi-Language Support** - English and Kinyarwanda  
✅ **Dark/Light Theme** - Full theme support  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Authentication** - Secure Supabase authentication  

## Quick Start

### Prerequisites

- Node.js 18+ or higher
- Supabase account (free at https://supabase.com)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd reportX
```

2. **Install dependencies**
```bash
pnpm install
# or npm install
# or yarn install
```

3. **Configure Supabase**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select existing
   - Go to Settings → API
   - Copy your Project URL and Anon Key

4. **Set up environment variables**

Create `.env.local` in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
reportX/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard and feature pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard specific components
│   ├── products/         # Product management components
│   ├── stock/            # Stock In/Out components
│   ├── credits/          # Credit management components
│   ├── customers/        # Customer management components
│   ├── reports/          # Reports components
│   └── settings/         # Settings components
├── lib/                   # Utility functions and helpers
│   ├── supabase/         # Supabase client configuration
│   ├── language-context.tsx  # Language context provider
│   ├── translations.ts   # Language translations
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── public/                # Static assets
├── scripts/               # Database migration scripts
├── package.json           # Project dependencies
└── tsconfig.json          # TypeScript configuration
```

## Key Technologies

- **Frontend Framework**: Next.js 16 with App Router
- **UI Component Library**: Radix UI + Shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Usage Guide

### Dashboard
After logging in, you'll see the main dashboard with:
- Sales statistics and trends
- Product overview
- Recent transactions
- Quick actions for common tasks

### Managing Products
1. Navigate to **Products**
2. Click **Add Product** to create new products
3. Edit or delete existing products
4. Monitor stock levels and product status

### Stock Transactions
- **Stock In**: Record incoming inventory
- **Stock Out**: Record outgoing inventory
- View transaction history and analytics

### Credit Management
- Create and manage customer credits
- Track payment status
- Generate credit reports

### Reporting
Access comprehensive reports including:
- Daily, weekly, and monthly sales reports
- Stock reports with low/out-of-stock alerts
- Credit reports with payment status

## Language Support

The app supports multiple languages:
- 🇬🇧 English
- 🇷🇼 Kinyarwanda

Switch languages using the globe icon (🌍) in the header. Your preference is saved automatically.

## Database Setup

The project includes SQL migration scripts in the `scripts/` directory to set up the database schema:

```bash
# Scripts are provided for:
# - Creating base tables
# - Setting up advanced features
# - Fixing constraints and relationships
```

Apply these scripts through your Supabase dashboard SQL editor.

## Troubleshooting

### "Your project's URL and Key are required to create a Supabase client!"

This error means environment variables are not configured. Follow these steps:

1. Verify `.env.local` exists in the root directory
2. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
3. Restart the development server
4. Clear browser cache if needed

### Build Issues

If you encounter build errors:
1. Delete `node_modules` and `.next` directories
2. Run `pnpm install` to reinstall dependencies
3. Run `pnpm dev` again

### TypeScript Errors

Ensure your TypeScript version is compatible:
```bash
pnpm add -D typescript@5
```

## Development

### Code Style
- Follow the existing code structure
- Use TypeScript for type safety
- Follow React best practices with hooks

### Adding New Features
1. Create components in the `components/` directory
2. Add types to `lib/types.ts` if needed
3. Use the language context for i18n support
4. Follow the existing styling conventions (Tailwind CSS)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables in project settings
4. Deploy

### Other Platforms

Ensure that:
- Environment variables are set in production
- Database migrations are applied
- Node.js 18+ is available
- Build command: `pnpm build`
- Start command: `pnpm start`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support or issues:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Review Next.js documentation: https://nextjs.org/docs

## Changelog

### Version 0.1.0
- Initial release
- Complete stock management system
- Multi-language support (English, Kinyarwanda)
- Dashboard with analytics
- Product and inventory management
- Credit and customer management
- Comprehensive reporting
- Dark/Light theme support
