Run a local static server for this project

Preferred (Node.js)

1. Open PowerShell in the project root (where this README lives).
2. Run:

	 npx http-server -p 8000 -a localhost -c-1

This will serve the current folder on http://localhost:8000/ and disable caching (-c-1).

Batch helper

- Double-click `start-server.bat` or run it from CMD/PowerShell. It runs the same `npx http-server` command.

PowerShell helper

- Run `.\n+  start-server.ps1` from PowerShell. The script will keep running until you press Enter.

Fallback options

- If you don't have Node.js, you can use Python (if installed):

	- Python 3: `python -m http.server 8000 --bind 127.0.0.1`
	- Python 2: `python -m SimpleHTTPServer 8000`

- If you have PHP installed, you can serve with PHP's built-in server:

	php -S localhost:8000 -t .

VS Code

- If you use VS Code, the Live Server extension works well for quick previews.

Notes

- This project contains some PHP endpoints under the `api/` folder. The static server will still serve the front-end files, but PHP endpoints require a PHP runtime to work.
- If port 8000 is already in use, you can pick another port with the `-p` flag (for `http-server`) or the port argument for Python/PHP.

Troubleshooting

- "php" not found: install PHP or use the Node/Python fallback above.
- "npx" not found: install Node.js (which includes npm and npx).

Enjoy!