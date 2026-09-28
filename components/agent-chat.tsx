"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import type { ReturnOrderToolInvocation, ShoppingAgentUIMessage } from "@/lib/agent";
import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useMemo, useState } from "react";
import { AgentProductCard } from "./agent-product-card";
import { AgentProductList } from "./agent-product-list";

export function AgentChat() {
  const [input, setInput] = useState("");

  const activeRunId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("active-workflow-run-id") ?? undefined;
  }, []);

  const { messages, status, error, sendMessage } = useChat<ShoppingAgentUIMessage>({
    resume: Boolean(activeRunId),
    transport: new WorkflowChatTransport({
      api: "/api/chat",
      onChatSendMessage: (response) => {
        const runId = response.headers.get("x-workflow-run-id");
        if (runId) localStorage.setItem("active-workflow-run-id", runId);
      },
      onChatEnd: () => localStorage.removeItem("active-workflow-run-id"),
      prepareReconnectToStreamRequest: ({ api, ...rest }) => {
        const runId = localStorage.getItem("active-workflow-run-id");
        if (!runId) throw new Error("No active workflow run ID found");
        return {
          ...rest,
          api: `/api/chat/${encodeURIComponent(runId)}/stream`,
        };
      },
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage({ text: input });
    setInput("");
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageHasContent =
    lastMessage?.role === "assistant" && lastMessage.parts.length > 0;
  const isThinking =
    status === "submitted" ||
    (status === "streaming" && !lastMessageHasContent);

  if (error) return <div>{error.message}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((m) =>
            m.parts.map((p, i) => {
              switch (p.type) {
                case "text":
                  return (
                    <Message key={`${m.id}-${i}`} from={m.role}>
                      <MessageContent>
                        <MessageResponse>{p.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                case "tool-searchProducts":
                  return (
                    <AgentProductList key={`${m.id}-${i}`} invocation={p} />
                  );
                case "tool-getProductDetails":
                  return (
                    <AgentProductCard key={`${m.id}-${i}`} invocation={p} />
                  );
                case "tool-returnOrder": {
                  const inv = p as ReturnOrderToolInvocation;
                  if (
                    inv.state === "input-streaming" ||
                    inv.state === "input-available"
                  ) {
                    return (
                      <div
                        key={`${m.id}-${i}`}
                        className="my-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500"
                      >
                        Filing return…
                      </div>
                    );
                  }
                  if (inv.state === "output-available") {
                    if (inv.output && typeof inv.output === "object" && "error" in inv.output) {
                      return (
                        <div
                          key={`${m.id}-${i}`}
                          className="my-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                          {String((inv.output as { error: unknown }).error)}
                        </div>
                      );
                    }
                    const output = inv.output as { runId?: string; message?: string } | undefined;
                    return (
                      <div
                        key={`${m.id}-${i}`}
                        className="my-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                      >
                        {output?.message ?? "Return request received."}
                      </div>
                    );
                  }
                  return null;
                }
                default:
                  return null;
              }
            }),
          )}
          {isThinking && (
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>Thinking…</MessageResponse>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask the agent"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status="ready" disabled={!input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
