# AI Browser Agent Extension

## Build

```bash
npm install
npm run build
```

The build emits:

```txt
background.js
content.js
popup.js
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension` folder
5. Start the web app at `http://localhost:3000`
6. Open a job form or email request page
7. Click the floating `AI Assist` button
