/**
 * EE.log Parser Utility
 * Parse Warframe game log to extract mission rewards, trades, and relic results
 *
 * Log format: <elapsed_seconds> <source> [<type>]: <message>
 * Example: 123.456 Net [Info]: Trade complete: Received [Argon Crystal x3]
 */

export interface ParsedTrade {
  timestamp: number;
  partner?: string;
  given: { item: string; quantity: number }[];
  received: { item: string; quantity: number }[];
  platinum?: number;
}

export interface ParsedMissionReward {
  timestamp: number;
  mission?: string;
  rewards: { item: string; quantity: number }[];
}

export interface ParsedRelicResult {
  timestamp: number;
  relic: string;
  refinement?: string;
  reward: string;
  rarity: string;
}

export interface EELogParseResult {
  trades: ParsedTrade[];
  missionRewards: ParsedMissionReward[];
  relicResults: ParsedRelicResult[];
  warnings: string[];
  linesProcessed: number;
}

// Common regex patterns for log parsing
const PATTERNS = {
  // Trade patterns
  tradeComplete: /Trade complete/i,
  tradeReceived: /Received\s+\[([^\]]+)\]/gi,
  tradeGiven: /Given\s+\[([^\]]+)\]/gi,
  tradePlatinum: /(\d+)\s+Platinum/i,

  // Mission reward patterns
  missionComplete: /Mission\s+(complete|success)/i,
  endOfMission: /EndOfMatch|MissionComplete/i,
  rewardItem: /Received\s+([^,\n]+)/gi,

  // Relic cracking patterns
  relicOpened: /Relic\s+(Lith|Meso|Neo|Axi|Requiem)\s+(\w+)/i,
  relicReward: /Got\s+([^,\n]+)\s+from\s+relic/i,

  // General patterns
  timestamp: /^(\d+\.?\d*)\s+/,
  source: /^\d+\.?\d*\s+(\w+)\s+/,
  type: /\[(\w+)\]/,
};

// Parse item with quantity (e.g., "Argon Crystal x3" or "Argon Crystal (3)")
function parseItemWithQuantity(text: string): {
  item: string;
  quantity: number;
} {
  const xMatch = text.match(/(.+?)\s+x(\d+)$/i);
  if (xMatch) {
    return { item: xMatch[1].trim(), quantity: parseInt(xMatch[2], 10) };
  }

  const parenMatch = text.match(/(.+?)\s+\((\d+)\)$/);
  if (parenMatch) {
    return {
      item: parenMatch[1].trim(),
      quantity: parseInt(parenMatch[2], 10),
    };
  }

  return { item: text.trim(), quantity: 1 };
}

// Parse a single log line
function parseLogLine(
  line: string,
): { timestamp: number; source: string; type: string; message: string } | null {
  const timestampMatch = line.match(PATTERNS.timestamp);
  if (!timestampMatch) return null;

  const timestamp = parseFloat(timestampMatch[1]);
  const rest = line.slice(timestampMatch[0].length);

  const sourceMatch = rest.match(/^(\w+)\s+/);
  const source = sourceMatch ? sourceMatch[1] : "Unknown";

  const typeMatch = rest.match(PATTERNS.type);
  const type = typeMatch ? typeMatch[1] : "Info";

  const messageStart = rest.indexOf("]:") + 2;
  const message = messageStart > 1 ? rest.slice(messageStart).trim() : rest;

  return { timestamp, source, type, message };
}

// Main parsing function
export function parseEELog(logContent: string): EELogParseResult {
  const result: EELogParseResult = {
    trades: [],
    missionRewards: [],
    relicResults: [],
    warnings: [],
    linesProcessed: 0,
  };

  const lines = logContent.split("\n");
  result.linesProcessed = lines.length;

  let currentTrade: ParsedTrade | null = null;
  let currentMission: ParsedMissionReward | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const parsed = parseLogLine(line);
    if (!parsed) continue;

    const { timestamp, message } = parsed;

    try {
      // Trade detection
      if (PATTERNS.tradeComplete.test(message)) {
        if (currentTrade) {
          result.trades.push(currentTrade);
        }
        currentTrade = {
          timestamp,
          given: [],
          received: [],
        };
      }

      // Trade items
      if (currentTrade) {
        // Received items
        const receivedMatches = message.matchAll(PATTERNS.tradeReceived);
        for (const match of receivedMatches) {
          const parsed = parseItemWithQuantity(match[1]);
          if (parsed.item.toLowerCase().includes("platinum")) {
            const platMatch = parsed.item.match(/(\d+)/);
            if (platMatch) {
              currentTrade.platinum =
                (currentTrade.platinum || 0) + parseInt(platMatch[1], 10);
            }
          } else {
            currentTrade.received.push(parsed);
          }
        }

        // Given items
        const givenMatches = message.matchAll(PATTERNS.tradeGiven);
        for (const match of givenMatches) {
          const parsed = parseItemWithQuantity(match[1]);
          if (parsed.item.toLowerCase().includes("platinum")) {
            const platMatch = parsed.item.match(/(\d+)/);
            if (platMatch) {
              currentTrade.platinum =
                (currentTrade.platinum || 0) - parseInt(platMatch[1], 10);
            }
          } else {
            currentTrade.given.push(parsed);
          }
        }
      }

      // Mission completion
      if (
        PATTERNS.missionComplete.test(message) ||
        PATTERNS.endOfMission.test(message)
      ) {
        if (currentMission && currentMission.rewards.length > 0) {
          result.missionRewards.push(currentMission);
        }
        currentMission = {
          timestamp,
          rewards: [],
        };
      }

      // Relic results
      const relicMatch = message.match(PATTERNS.relicOpened);
      if (relicMatch) {
        const relic = `${relicMatch[1]} ${relicMatch[2]}`;
        // Look for reward in same or following lines
        const rewardMatch = message.match(PATTERNS.relicReward);
        if (rewardMatch) {
          result.relicResults.push({
            timestamp,
            relic,
            reward: rewardMatch[1].trim(),
            rarity: "Unknown", // Would need more context to determine
          });
        }
      }
    } catch {
      result.warnings.push(`Error parsing line: ${line.substring(0, 50)}...`);
    }
  }

  // Push any remaining trade/mission
  if (
    currentTrade &&
    (currentTrade.given.length > 0 || currentTrade.received.length > 0)
  ) {
    result.trades.push(currentTrade);
  }
  if (currentMission && currentMission.rewards.length > 0) {
    result.missionRewards.push(currentMission);
  }

  return result;
}

// Format results for display
export function formatParseResults(results: EELogParseResult): string {
  const lines: string[] = [];

  lines.push(`Processed ${results.linesProcessed.toLocaleString()} lines`);
  lines.push("");

  if (results.trades.length > 0) {
    lines.push(`## Trades (${results.trades.length})`);
    results.trades.forEach((trade, i) => {
      lines.push(`### Trade ${i + 1}`);
      if (trade.received.length > 0) {
        lines.push(
          `Received: ${trade.received.map((r) => `${r.item}${r.quantity > 1 ? ` x${r.quantity}` : ""}`).join(", ")}`,
        );
      }
      if (trade.given.length > 0) {
        lines.push(
          `Given: ${trade.given.map((g) => `${g.item}${g.quantity > 1 ? ` x${g.quantity}` : ""}`).join(", ")}`,
        );
      }
      if (trade.platinum) {
        lines.push(
          `Platinum: ${trade.platinum > 0 ? "+" : ""}${trade.platinum}`,
        );
      }
      lines.push("");
    });
  }

  if (results.relicResults.length > 0) {
    lines.push(`## Relic Results (${results.relicResults.length})`);
    results.relicResults.forEach((relic) => {
      lines.push(`- ${relic.relic}: ${relic.reward}`);
    });
    lines.push("");
  }

  if (results.warnings.length > 0) {
    lines.push(`## Warnings (${results.warnings.length})`);
    results.warnings.slice(0, 5).forEach((w) => lines.push(`- ${w}`));
    if (results.warnings.length > 5) {
      lines.push(`... and ${results.warnings.length - 5} more`);
    }
  }

  return lines.join("\n");
}
