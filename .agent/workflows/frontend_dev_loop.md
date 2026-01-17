---
description: Interactive Frontend Development Loop
---

This workflow allows Antigravity to act as your "Browser in Editor" by managing the dev server, inspecting the UI, and applying changes iteratively.

1. **Start the Development Server** (if not already running)
   - Check if `npm start` or similar is running.
   - If not, start it in a background terminal.

2. **Open the Browser**
   - Use `browser_subagent` to open the local application URL (usually http://localhost:3000).
   - Take a screenshot to visualize the current state.

3. **Development Loop**
   - **Inspect**: If you need to identify a component, ask Antigravity to "inspect the element X". I will use browser tools to find the DOM element and trace it back to the React component.
   - **Edit**: Describe the visual change you want (e.g., "Make the header blue", "Add a button here").
   - **Apply**: Antigravity will locate the file, apply the `replace_file_content`, and save.
   - **Verify**: Antigravity will refresh the browser and show you the updated screenshot.

To start this workflow, simply ask: "Run the frontend dev loop".
