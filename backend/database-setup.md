# Free Database Options for Vercel Django Backend

## Option 1: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Create new project
4. Get connection URL from Settings > Database
5. URL format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

## Option 2: Neon
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub  
3. Create database
4. Copy connection string

## Option 3: ElephantSQL
1. Go to [elephantsql.com](https://www.elephantsql.com/)
2. Create free account
3. Create new instance (Tiny Turtle - Free)
4. Copy URL

## Option 4: Railway Database Only
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Copy connection URL

## Environment Variables for Vercel:
```
POSTGRES_URL=your-database-connection-url-here
SECRET_KEY=your-super-secret-key-here
DJANGO_SETTINGS_MODULE=core.vercel_settings
``` 