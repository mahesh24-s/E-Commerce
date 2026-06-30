<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Terminal Command Rules

1. **Long-Running Processes:** Whenever running commands that start a server (like `npm run dev`, `npm start`, or watch modes), you MUST send the command to the background immediately using a very low wait time (e.g., `WaitMsBeforeAsync: 500`). Do not wait for these commands to finish.
2. **Command Timeouts:** For standard scripts, do not use commands that block the terminal indefinitely. 
3. **Approval:** Keep output concise and do not run commands that require interactive user input (like `y/n` prompts) without using non-interactive flags (e.g., `-y`).






<!-- END:nextjs-agent-rules -->


