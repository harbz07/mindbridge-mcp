[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/pinkpixel-dev-mindbridge-mcp-badge.png)](https://mseep.ai/app/pinkpixel-dev-mindbridge-mcp)

<p align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1744269194/logo_ghalxq.png" alt="Mindbridge Logo" width="400">
</p>

# MindBridge MCP Server ⚡ The AI Router for Big Brain Moves
[![smithery badge](https://smithery.ai/badge/@pinkpixel-dev/mindbridge-mcp)](https://smithery.ai/server/@pinkpixel-dev/mindbridge-mcp)

MindBridge is your AI command hub — a Model Context Protocol (MCP) server built to unify, organize, and supercharge your LLM workflows.

Forget vendor lock-in. Forget juggling a dozen APIs.  
MindBridge connects your apps to *any* model, from OpenAI and Anthropic to Ollama and DeepSeek — and lets them talk to each other like a team of expert consultants.

Need raw speed? Grab a cheap model.  
Need complex reasoning? Route it to a specialist.  
Want a second opinion? MindBridge has that built in.

This isn't just model aggregation. It's model orchestration.

---

## Core Features 🔥

| What it does | Why you should use it |
|--------------|--------------|
| Multi-LLM Support | Instantly switch between OpenAI, Anthropic, Google, DeepSeek, OpenRouter, Ollama (local models), and OpenAI-compatible APIs.|
| Reasoning Engine Aware | Smart routing to models built for deep reasoning like Claude, GPT-4o, DeepSeek Reasoner, etc.|
| getSecondOpinion Tool | Ask multiple models the same question to compare responses side-by-side. |
| Agent Vessel Registry | Track active vessels and capabilities for agent placement/migration decisions. |
| Migration Bundle Protocol | Create/verify portable migration bundles with checksum + optional HMAC signature. |
| Agent Forum + Discord Fan-out | Publish in-memory forum updates and optionally mirror to Discord webhooks. |
| OpenAI-Compatible API Layer | Drop MindBridge into any tool expecting OpenAI endpoints (Azure, Together.ai, Groq, etc.). |
| Auto-Detects Providers | Just add your keys. MindBridge handles setup & discovery automagically. |
| Flexible as Hell | Configure everything via env vars, MCP config, or JSON — it's your call. |

---

## Agent Mesh Extension (Vessels + Migration + Forums) 🌉

MindBridge now includes a lightweight "agent mesh" layer so you can build multi-host agent systems on top of MCP without changing your provider routing flow.

- **Vessels** are runtime hosts that register capabilities and capacity.
- **Migration bundles** package agent state with integrity checks (and optional HMAC signing).
- **Agent forum updates** provide a shared coordination feed, with optional Discord webhook fan-out.

Suggested flow:
1. Register each vessel at startup (`registerVessel`).
2. On handoff, generate a migration bundle (`createMigrationBundle`) and deliver it to the destination vessel.
3. Verify payload integrity/TTL (`verifyMigrationBundle`) before restoring state.
4. Publish migration status to team channels (`postAgentForumUpdate` and/or `sendDiscordWebhook`).

---

## Why MindBridge?

> *"Every LLM is good at something. MindBridge makes them work together."*

Perfect for:
- Agent builders
- Multi-model workflows
- AI orchestration engines
- Reasoning-heavy tasks
- Building smarter AI dev environments
- LLM-powered backends
- Anyone tired of vendor walled gardens


---

## Installation 🛠️

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g @pinkpixel/mindbridge

# use with npx
npx @pinkpixel/mindbridge
```

### Installing via Smithery

To install mindbridge-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@pinkpixel-dev/mindbridge-mcp):

```bash
npx -y @smithery/cli install @pinkpixel-dev/mindbridge-mcp --client claude
```

### Option 2: Install from source

1. Clone the repository:
   ```bash
   git clone https://github.com/pinkpixel-dev/mindbridge.git
   cd mindbridge
   ```

2. Install dependencies:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys for the providers you want to use.

## Configuration ⚙️

### Environment Variables

The server supports the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `DEEPSEEK_API_KEY`: Your DeepSeek API key
- `GOOGLE_API_KEY`: Your Google AI API key
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OLLAMA_BASE_URL`: Ollama instance URL (default: http://localhost:11434)
- `OPENAI_COMPATIBLE_API_KEY`: (Optional) API key for OpenAI-compatible services
- `OPENAI_COMPATIBLE_API_BASE_URL`: Base URL for OpenAI-compatible services
- `OPENAI_COMPATIBLE_API_MODELS`: Comma-separated list of available models
- `AGENT_MIGRATION_SIGNING_SECRET`: Optional HMAC signing secret for migration bundles
- `DEFAULT_DISCORD_WEBHOOK_URL`: Optional fallback webhook used by `sendDiscordWebhook` and forum fan-out
- `WEBHOOK_HOST_ALLOWLIST`: Optional comma-separated allowlist of webhook hosts (defaults to Discord hosts)

For `github.com/harbz07/mindbridge-router`, set:
- `OPENAI_COMPATIBLE_API_BASE_URL` to your router URL ending in `/v1`
- `OPENAI_COMPATIBLE_API_KEY` to the router's `MINDBRIDGE_API_KEY`
- `OPENAI_COMPATIBLE_API_MODELS` to router model IDs (for example: `mindbridge:openai/gpt-4o,mindbridge:anthropic/claude-3-5-sonnet`)

### MCP Configuration

For use with MCP-compatible IDEs like Cursor or Windsurf, you can use the following configuration in your `mcp.json` file:

```json
{
  "mcpServers": {
    "mindbridge": {
      "command": "npx",
      "args": [
        "-y",
        "@pinkpixel/mindbridge"
      ],
      "env": {
        "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
        "ANTHROPIC_API_KEY": "ANTHROPIC_API_KEY_HERE",
        "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
        "DEEPSEEK_API_KEY": "DEEPSEEK_API_KEY_HERE",
        "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
        "AGENT_MIGRATION_SIGNING_SECRET": "OPTIONAL_SIGNING_SECRET",
        "DEFAULT_DISCORD_WEBHOOK_URL": "OPTIONAL_DISCORD_WEBHOOK_URL",
        "WEBHOOK_HOST_ALLOWLIST": "discord.com,discordapp.com"
      },
      "provider_config": {
        "openai": {
          "default_model": "gpt-4o"
        },
        "anthropic": {
          "default_model": "claude-3-5-sonnet-20241022"
        },
        "google": {
          "default_model": "gemini-2.0-flash"
        },
        "deepseek": {
          "default_model": "deepseek-chat"
        },
        "openrouter": {
          "default_model": "openai/gpt-4o"
        },
        "ollama": {
          "base_url": "http://localhost:11434",
          "default_model": "llama3"
        },
        "openai_compatible": {
          "api_key": "API_KEY_HERE_OR_REMOVE_IF_NOT_NEEDED",
          "base_url": "https://YOUR_MINDBRIDGE_ROUTER_URL/v1",
          "available_models": ["mindbridge:openai/gpt-4o", "mindbridge:anthropic/claude-3-5-sonnet"],
          "default_model": "mindbridge:openai/gpt-4o"
        }
      },
      "default_params": {
        "temperature": 0.7,
        "reasoning_effort": "medium"
      },
      "alwaysAllow": [
        "getSecondOpinion",
        "listProviders",
        "listReasoningModels"
      ]
    }
  }
}
```

Replace the API keys with your actual keys. For the OpenAI-compatible configuration, you can remove the `api_key` field if the service doesn't require authentication.

## Usage 💫

### Starting the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

When installed globally:
```bash
mindbridge
```

### Available Tools

1. **getSecondOpinion**
   ```typescript
   {
     provider: string;  // LLM provider name
     model: string;     // Model identifier
     prompt: string;    // Your question or prompt
     systemPrompt?: string;  // Optional system instructions
     temperature?: number;   // Response randomness (0-1)
     maxTokens?: number;    // Maximum response length
     reasoning_effort?: 'low' | 'medium' | 'high';  // For reasoning models
   }
   ```

2. **listProviders**
   - Lists all configured providers and their available models
   - No parameters required

3. **listReasoningModels**
   - Lists models optimized for reasoning tasks
   - No parameters required

4. **registerVessel**
   - Registers (or updates) a vessel that can host migrating agents
   ```typescript
   {
     vesselId: string;
     endpoint?: string;
     region?: string;
     capabilities?: string[];
     maxAgents?: number;
     metadata?: Record<string, string>;
   }
   ```

5. **listVessels**
   - Lists all registered vessels and capability metadata
   - No parameters required

6. **createMigrationBundle**
   - Creates a portable migration bundle with checksum and optional HMAC signature
   ```typescript
   {
     agentId: string;
     sourceVesselId: string;
     targetVesselId: string;
     state: string; // serialized state payload (JSON/YAML/text)
     stateFormat?: 'json' | 'yaml' | 'text';
     capabilities?: string[];
     ttlSeconds?: number;
     metadata?: Record<string, string>;
   }
   ```

7. **verifyMigrationBundle**
   - Verifies a base64url bundle string (or raw JSON string) against checksum/signature/TTL
   ```typescript
   {
     bundle: string;
     allowExpired?: boolean;
   }
   ```

8. **postAgentForumUpdate**
   - Creates an in-memory forum post and optionally broadcasts it to Discord
   ```typescript
   {
     agentId: string;
     vesselId: string;
     title: string;
     body: string;
     channel?: 'general' | 'ops' | 'research' | 'alerts';
     tags?: string[];
     broadcastToDiscord?: boolean;
     discordWebhookUrl?: string;
     discordThreadName?: string;
   }
   ```

9. **listAgentForumUpdates**
   - Lists recent forum posts with optional filters
   ```typescript
   {
     channel?: 'general' | 'ops' | 'research' | 'alerts';
     tag?: string;
     limit?: number;
   }
   ```

10. **sendDiscordWebhook**
    - Sends a Discord webhook message with allowlist checks
   ```typescript
   {
     webhookUrl?: string;
     content: string;
     username?: string;
     threadName?: string;
   }
   ```

## Example Usage 📝

```typescript
// Get an opinion from GPT-4o
{
  "provider": "openai",
  "model": "gpt-4o",
  "prompt": "What are the key considerations for database sharding?",
  "temperature": 0.7,
  "maxTokens": 1000
}

// Get a reasoned response from OpenAI's o1 model
{
  "provider": "openai",
  "model": "o1",
  "prompt": "Explain the mathematical principles behind database indexing",
  "reasoning_effort": "high",
  "maxTokens": 4000
}

// Get a reasoned response from DeepSeek
{
  "provider": "deepseek",
  "model": "deepseek-reasoner",
  "prompt": "What are the tradeoffs between microservices and monoliths?",
  "reasoning_effort": "high",
  "maxTokens": 2000
}

// Use an OpenAI-compatible provider
{
  "provider": "openaiCompatible",
  "model": "YOUR_MODEL_NAME",
  "prompt": "Explain the concept of eventual consistency in distributed systems",
  "temperature": 0.5,
  "maxTokens": 1500
}

// Register a vessel that can host migrated agents
{
  "vesselId": "vessel-us-east-1a",
  "endpoint": "https://agents.example.com/vessel/us-east-1a",
  "region": "us-east-1",
  "capabilities": ["discord-webhooks", "tools:filesystem", "llm:openai"],
  "maxAgents": 12
}

// Create a migration bundle to move an agent
{
  "agentId": "agent-triage-42",
  "sourceVesselId": "vessel-us-east-1a",
  "targetVesselId": "vessel-eu-west-1b",
  "stateFormat": "json",
  "state": "{\"memory\":[\"incident #188\"],\"goal\":\"cross-region failover\"}",
  "ttlSeconds": 1200
}

// Post to the built-in agent forum and mirror to Discord
{
  "agentId": "agent-triage-42",
  "vesselId": "vessel-eu-west-1b",
  "title": "Migration Complete",
  "body": "Recovered context and resumed ticket triage.",
  "channel": "ops",
  "tags": ["migration", "status"],
  "broadcastToDiscord": true
}
```

## Development 🔧

- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier
- `npm run clean`: Clean build artifacts
- `npm run build`: Build the project

## Contributing

PRs welcome! Help us make AI workflows less dumb.

---

## License

MIT — do whatever, just don't be evil.

---

Made with ❤️ by [Pink Pixel](https://pinkpixel.dev)
