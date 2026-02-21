#!/usr/bin/env node

import dotenv from 'dotenv';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import MindBridgeServer from './server.js';

// Load environment variables from .env file
dotenv.config();

// Configure stdio transport for simplicity
const transport = new StdioServerTransport();

// Create and start the server
const server = new MindBridgeServer();

// Print banner - using console.error for stderr output
console.error('\n✨ Mindbridge MCP Server ✨');
console.error('Version: 1.2.0');
console.error('\nStarting server...');

// Connect the server
(async () => {
  try {
    await server.connect(transport);

    console.error('\nServer started successfully!');
    console.error('\nAvailable Tools:');
    console.error('- getSecondOpinion: Get responses from various LLM providers');
    console.error('- listProviders: List all configured LLM providers and their models');
    console.error('- listReasoningModels: List models optimized for reasoning tasks');
    console.error('- registerVessel: Register/update vessel metadata');
    console.error('- listVessels: List known migration vessels');
    console.error('- createMigrationBundle: Build migration payloads');
    console.error('- verifyMigrationBundle: Validate migration payloads');
    console.error('- postAgentForumUpdate: Publish forum updates');
    console.error('- listAgentForumUpdates: Read forum updates');
    console.error('- sendDiscordWebhook: Push messages to Discord webhooks\n');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down server...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
