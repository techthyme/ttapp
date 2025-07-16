import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client with your credentials
// IMPORTANT: Replace these with your actual Twilio credentials in .env.local
const accountSid =
  process.env.TWILIO_ACCOUNT_SID || "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN || "xxxxxxxxxxxxxxxxxxxxxxxxxx"; // Your Auth Token from www.twilio.com/console
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+1234567890"; // Your Twilio phone number

// Create Twilio client
const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { to, body } = await request.json();

    // Validate input
    if (!to || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to and body" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ""))) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Please use E.164 format (e.g., +1234567890)",
        },
        { status: 400 }
      );
    }

    // Send SMS using Twilio
    const message = await client.messages.create({
      body: body,
      to: to,
      from: twilioPhoneNumber, // Your Twilio phone number
    });

    // Return success response
    return NextResponse.json({
      success: true,
      messageId: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
    });
  } catch (error: any) {
    console.error("Twilio Error:", error);

    // Handle Twilio-specific errors
    if (error.code) {
      return NextResponse.json(
        {
          error: `Twilio Error: ${error.message}`,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    // Handle general errors
    return NextResponse.json(
      {
        error:
          "Failed to send message. Please check your Twilio credentials and try again.",
      },
      { status: 500 }
    );
  }
}
