"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  from: string;
  body: string;
  timestamp: Date;
  type: "sent" | "received";
}

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const response = await fetch("/api/receive-sms?poll=true");
        if (response.ok) {
          const newMessages = await response.json();
          if (newMessages.length > 0) {
            setMessages((prev) => [...prev, ...newMessages]);
          }
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const validateForm = () => {
    if (!phoneNumber.trim()) {
      setStatus({ type: "error", message: "Please enter a phone number" });
      return false;
    }
    if (!messageBody.trim()) {
      setStatus({ type: "error", message: "Please enter a message" });
      return false;
    }
    // Basic phone validation (you can make this more sophisticated)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      setStatus({
        type: "error",
        message: "Please enter a valid phone number (E.164 format recommended)",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSending(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          body: messageBody,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add sent message to the list
        const sentMessage: Message = {
          id: Date.now().toString(),
          from: "You",
          body: messageBody,
          timestamp: new Date(),
          type: "sent",
        };
        setMessages((prev) => [...prev, sentMessage]);

        // Clear form
        setMessageBody("");
        setStatus({ type: "success", message: "Message sent successfully!" });

        // Clear status after 3 seconds
        setTimeout(() => setStatus({ type: null, message: "" }), 3000);
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to send message",
        });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 pt-8">
          Simple Messaging App
        </h1>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Messages Display Area */}
          <div className="h-96 overflow-y-auto bg-gray-50 p-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No messages yet. Send a message to start!
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "sent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === "sent"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {message.from}
                      </p>
                      <p className="text-sm break-words">{message.body}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
            {/* Status Messages */}
            {status.type && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  status.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="space-y-4">
              {/* Phone Number Input */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recipient Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use E.164 format (e.g., +1234567890)
                </p>
              </div>

              {/* Message Body Input */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {messageBody.length}/160 characters
                </p>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200 font-medium"
              >
                {isSending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Messages are ephemeral and will disappear on page refresh
        </p>
      </div>
    </div>
  );
}
