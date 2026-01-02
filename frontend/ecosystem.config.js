module.exports = {
  apps: [{
    name: 'boring-layer',
    cwd: '/home/ubuntu/boring-layer',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      PORT: 3000,
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://boringlayer.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://cybxnmqeowdqyngxzxby.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YnhubXFlb3dkcXluZ3h6eGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3Mjc3NDEsImV4cCI6MjA1MzMwMzc0MX0.6f8druzIVrxswhxgE3qFwBKYBaDbaFzz_1wdQHUjVs0',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YnhubXFlb3dkcXluZ3h6eGJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzcyNzc0MSwiZXhwIjoyMDUzMzAzNzQxfQ.MnZPMKGpRJ0_dHYe2FS48TBvsnDOwNdKip9VCPdjieY'
    }
  }]
}
