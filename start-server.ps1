# Start a static file server on port 8000 using npx http-server (Node.js required)
Set-Location -Path $PSScriptRoot
npx http-server -p 8000 -a localhost -c-1
Read-Host "Press Enter to exit..."
