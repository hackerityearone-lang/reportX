# ReportX Imports Reference

This document provides a comprehensive overview of all imports used in the RecentTransactions component and their purposes.

## React & Next.js Core Imports

### React Hooks
```typescript
import { useState } from "react"
```
- **Purpose**: State management for component-level state
- **Usage**: Managing delete dialog state, loading states, form inputs

### Next.js Navigation
```typescript
import { useRouter } from "next/navigation"
```
- **Purpose**: Client-side navigation and page refresh
- **Usage**: Refreshing page after successful operations

### Next.js Link Component
```typescript
import Link from "next/link"
```
- **Purpose**: Client-side navigation between pages
- **Usage**: Navigation to reports page, maintaining SPA behavior

## Database & Authentication

### Supabase Client
```typescript
import { createClient } from "@/lib/supabase/client"
```
- **Purpose**: Database operations and authentication
- **Usage**: CRUD operations on transactions, user authentication checks

## UI Components (Shadcn/ui)

### Card Components
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```
- **Card**: Main container component
- **CardContent**: Content area of the card
- **CardHeader**: Header section with title
- **CardTitle**: Styled title component
- **Usage**: Main transaction list container

### Badge Component
```typescript
import { Badge } from "@/components/ui/badge"
```
- **Purpose**: Small status indicators
- **Usage**: Payment type indicators (Cash/Credit)

### Button Component
```typescript
import { Button } from "@/components/ui/button"
```
- **Purpose**: Interactive buttons with consistent styling
- **Usage**: Action buttons, navigation buttons, form submissions

### Alert Dialog Components
```typescript
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
```
- **AlertDialog**: Modal dialog container
- **AlertDialogAction**: Confirm action button
- **AlertDialogCancel**: Cancel action button
- **AlertDialogContent**: Dialog content wrapper
- **AlertDialogDescription**: Dialog description text
- **AlertDialogFooter**: Dialog footer with buttons
- **AlertDialogHeader**: Dialog header section
- **AlertDialogTitle**: Dialog title
- **Usage**: Delete confirmation modal

### Form Components
```typescript
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
```
- **Textarea**: Multi-line text input
- **Label**: Form field labels
- **Usage**: Delete reason input form

## Icons (Lucide React)

### Transaction & Navigation Icons
```typescript
import { 
  ArrowDownToLine,    // Stock IN transactions
  ArrowUpFromLine,    // Stock OUT transactions
  History,            // Transaction history
  Trash2,             // Delete action
  Package,            // Box products indicator
  Beer,               // Product type indicator (unused in current code)
  AlertTriangle,      // Warning/alert indicator
  Loader2,            // Loading spinner
  Edit                // Edit action
} from "lucide-react"
```

**Icon Usage:**
- **ArrowDownToLine**: Indicates stock coming in (positive transactions)
- **ArrowUpFromLine**: Indicates stock going out (negative transactions)
- **History**: Main component icon and empty state
- **Trash2**: Delete transaction button
- **Package**: Shows when product is sold by boxes
- **AlertTriangle**: Warning icon in delete dialog
- **Loader2**: Loading state during delete operation
- **Edit**: Edit transaction button (functionality pending)

## Notifications

### Toast Notifications
```typescript
import { toast } from "sonner"
```
- **Purpose**: User feedback notifications
- **Usage**: Success, error, and info messages

## Type Definitions

### Custom Types
```typescript
import type { StockTransaction } from "@/lib/types"
```
- **Purpose**: TypeScript type definitions
- **Usage**: Type safety for transaction data structures

## Component Props Interface

```typescript
interface RecentTransactionsProps {
  transactions: (StockTransaction & { 
    product?: { 
      name: string
      brand: string
      unit_type?: string
      pieces_per_box?: number
    } | null
    total_amount?: number | null
    payment_type?: "CASH" | "CREDIT" | null
  })[]
}
```

## Import Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| React/Next.js | 3 | Core framework functionality |
| Database | 1 | Data operations |
| UI Components | 4 groups | User interface elements |
| Icons | 9 | Visual indicators |
| Notifications | 1 | User feedback |
| Types | 1 | Type safety |

## File Structure Context

```
@/components/ui/     - Reusable UI components (Shadcn/ui)
@/lib/supabase/      - Database client configuration
@/lib/types          - TypeScript type definitions
```

## Usage Patterns

### State Management
- `useState` for local component state
- Multiple state variables for different UI states

### Async Operations
- Supabase client for database operations
- Error handling with try-catch blocks
- Loading states during operations

### User Experience
- Toast notifications for feedback
- Loading spinners during operations
- Confirmation dialogs for destructive actions

### Responsive Design
- Conditional rendering based on screen size
- Hover states for interactive elements
- Truncation for long text content

This reference serves as a comprehensive guide for understanding the component's dependencies and their specific roles in the RecentTransactions functionality.