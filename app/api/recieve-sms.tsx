import { NextRequest, NextResponse } from "next/server";

// In-memory storage for received messages (ephemeral)
// In a production app, you might use Redis or a message queue
const receivedMessages: Array<{
  id: string;
  from: string;
  body: string;
  timestamp: Date;
  type: "received";
}> = [];

// Webhook endpoint for Twilio to send incoming SMS
export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio webhook
    const formData = await request.formData();

    // Extract SMS details from Twilio's webhook payload
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    if (!from || !body) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Store the received message in memory
    const newMessage = {
      id: messageSid || Date.now().toString(),
      from: from,
      body: body,
      timestamp: new Date(),
      type: "received" as const,
    };

    receivedMessages.push(newMessage);

    // Keep only the last 100 messages in memory to prevent memory issues
    if (receivedMessages.length > 100) {
      receivedMessages.shift();
    }

    console.log("Received SMS:", newMessage);

    // Return TwiML response (optional - sends an auto-reply)
    // Uncomment the following to send an automatic reply:
    /*
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>Thanks for your message! This is an automated reply.</Message>
    </Response>`;
    
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
    */

    // Simple acknowledgment without auto-reply
    return new NextResponse("Message received", { status: 200 });
  } catch (error) {
    console.error("Error processing incoming SMS:", error);
    return new NextResponse("Error processing message", { status: 500 });
  }
}

// GET endpoint for frontend to poll for new messages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPoll = searchParams.get("poll") === "true";

  if (isPoll) {
    // Return and clear messages (they're ephemeral)
    const messages = [...receivedMessages];
    receivedMessages.length = 0; // Clear the array

    return NextResponse.json(messages);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
