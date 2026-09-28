import { convertToModelMessages, type UIMessage } from "ai";

export async function convertMessagesStep(messages: UIMessage[]) {
  "use step";
  return convertToModelMessages(messages);
}
