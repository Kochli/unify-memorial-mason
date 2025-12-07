#!/usr/bin/env node
import readline from "readline";

console.error("[MCP] Server starting...");

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

send({
  jsonrpc: "2.0",
  method: "ready",
  params: {}
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", (line) => {
  console.error("[MCP] Received:", line);

  let msg;
  try {
    msg = JSON.parse(line);
  } catch (err) {
    console.error("[MCP] Invalid JSON");
    return;
  }

  // === HANDLE INITIALIZE (required by Cursor) ===
  if (msg.method === "initialize") {
    return send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: msg.params.protocolVersion,
        serverInfo: {
          name: "claude-code",
          version: "1.0.0"
        },
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        }
      }
    });
  }

  // === REQUIRED BY CURSOR ===
  if (msg.method === "tools/list") {
    return send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        tools: []
      }
    });
  }

  // Default response
  if (msg.id !== undefined) {
    return send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {}
    });
  }
});