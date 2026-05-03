# Browser AI Chat with WebLLM

This project is a Vite vanilla JavaScript app that runs a local AI chat model directly in the browser with `@mlc-ai/web-llm` and WebGPU. There is no backend or API server.

The source lives in [`webgpu-ai-chat/`](./), but the production build is currently published into the existing site's `/ai-chat/` route for testing.

## Features

- Browser-only AI chat using WebGPU
- Lazy startup with a `Start AI Chat` button
- Default fast model: `SmolLM2-360M-Instruct-q4f16_1-MLC`
- Optional model selector:
  - `Fast`: `SmolLM2-360M-Instruct-q4f16_1-MLC`
  - `Better`: `SmolLM2-1.7B-Instruct-q4f16_1-MLC`
  - `Best`: `Llama-3.2-3B-Instruct-q4f16_1-MLC`
- Streaming responses
- Model download and loading progress UI
- Friendly WebGPU compatibility message
- In-memory chat history
- `Clear chat` button
- Responsive layout for desktop and mobile

## Setup

1. Install Node.js 18+ or 20+.
2. Open a terminal in the `webgpu-ai-chat` folder.
3. Install dependencies:

```bash
npm install
```

## Local run

From the `webgpu-ai-chat` folder:

```bash
npm run dev
```

Vite will print a local URL such as `http://localhost:5173`.

## Build

From the `webgpu-ai-chat` folder:

```bash
npm run build
```

The current Vite config builds directly into the repository root's `ai-chat/` folder so the existing site can expose the beta at `https://pulsagi.com/ai-chat/`.

## Testing inside the existing site

The Vite config is in [`vite.config.js`](./vite.config.js).

- While the chat is in beta, production builds use base path `/ai-chat/` and output into the root `ai-chat/` folder.
- The current site can link to `/ai-chat/` like any other static section.
- When you want the chat to become the primary homepage later, change the Vite production base to `"/"` and switch the output strategy to match the new site structure.

## Browser requirements

- A recent Chromium-based browser with WebGPU support, such as Chrome or Edge
- Hardware acceleration enabled
- Secure context such as `https://` or `http://localhost`
- Enough available GPU memory for the selected model

## How model loading works

- The app does **not** download a model when the page first opens.
- The user must click `Start AI Chat` first.
- On the first load for a model, the browser downloads its files.
- Later loads often reuse the browser cache, so startup is usually faster.

## Limitations

- WebGPU support is still evolving and may not work in every browser or device.
- Larger models need more GPU memory and may fail on lower-end machines.
- Chat history is only stored in memory, so it resets on refresh.
- All inference happens locally in the browser, so performance varies a lot by hardware.
