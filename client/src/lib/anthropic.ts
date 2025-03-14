export async function sendMessage(botId: number, message: string): Promise<string> {
  const response = await fetch(`/api/chat/${botId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || "Failed to send message");
  }

  const data = await response.json();
  return data.response;
}