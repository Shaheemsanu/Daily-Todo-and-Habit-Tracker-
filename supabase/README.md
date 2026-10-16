# Supabase setup for Daily Todo and Habit Tracker

This folder contains Supabase-related configuration and instructions.

How to use

1. Create a Supabase project at https://app.supabase.com/.
2. Copy the project URL and anon/public API key.
3. Create a .env file in your project root (do NOT commit secrets) with the following variables:

SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key

4. Use a Supabase client in your app (example using JavaScript/TypeScript):

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

5. See the supabase docs for more: https://supabase.com/docs
