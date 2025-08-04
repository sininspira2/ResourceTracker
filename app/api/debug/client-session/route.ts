import { NextRequest, NextResponse } from 'next/server'

// This endpoint returns client session debugging JavaScript
export async function GET(request: NextRequest) {
  const debugScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Client Session Debug</title>
    <script src="https://unpkg.com/next-auth@4/client/_app.js"></script>
</head>
<body>
    <h1>Client Session Debug</h1>
    <div id="output">Loading...</div>
    
    <script type="module">
        // Import the session hook equivalent
        async function checkClientSession() {
            try {
                const response = await fetch('/api/auth/session');
                const session = await response.json();
                
                const debugInfo = {
                    timestamp: new Date().toISOString(),
                    session: session,
                    userRoles: session?.user?.roles || [],
                    hasRoles: !!(session?.user?.roles?.length),
                    specificRole: session?.user?.roles?.includes('1379886542641692742'),
                    environment: 'client-side fetch'
                };
                
                document.getElementById('output').innerHTML = 
                    '<pre>' + JSON.stringify(debugInfo, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('output').innerHTML = 
                    '<pre>Error: ' + error.message + '</pre>';
            }
        }
        
        checkClientSession();
    </script>
</body>
</html>
  `;
  
  return new Response(debugScript, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate'
    }
  })
}