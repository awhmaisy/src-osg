"use client";

import { useState, useEffect, useRef } from "react";
import Loader from "@/app/components/Loader";

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (urlRegex.test(part)) {
      if (part.startsWith("[")) {
        const match = part.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
        if (match) {
          const [, linkText, url] = match;
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#fdb2ff] underline hover:text-decoration-underline"
            >
              {linkText}
            </a>
          );
        }
      } else {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#fdb2ff] underline hover:text-decoration-underline"
          >
            {part}
          </a>
        );
      }
    }
    return part;
  });
};

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (e.type === "submit" || (e as React.KeyboardEvent<HTMLInputElement>).key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        setMessages((prev) => [...prev, { role: "user", content: input, timestamp }]);
        setInput("");
        setLoading(true);
        const responseTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        setTimeout(async () => {
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: input }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply, timestamp: responseTimestamp }]);
          } catch {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "oops, something went wrong!", timestamp: responseTimestamp },
            ]);
          } finally {
            setLoading(false);
          }
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <h1 className="text-sm font-bold">@source has been released from its code enclosure.</h1>
      <p className="text-sm mb-4">play with it before the next injection...</p>
      <div className="w-full h-[80vh] overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <div className="text-sm text-gray-600">
              {msg.timestamp}
            </div>
            <div className="ml-4">
              <span className="text-sm" style={{ color: '#ca9ae5' }}>
                {msg.role === "user" ? "> @user" : "> @grok"}
              </span>
              <span className="text-sm ml-2">{renderTextWithLinks(msg.content)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-2">
            <div className="text-sm text-gray-600">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="ml-4 flex items-bottom space-x-2">
              <span className="text-sm" style={{ color: '#ca9ae5' }}>
                {`> @grok is loading`}
              </span>
              <Loader className="inline-block" style={{ height: '1em' }} />
            </div>
          </div>
        )}
        <div className="mb-2">
          <div className="text-sm text-gray-600">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-sm" style={{ color: '#ca9ae5' }}>{` > @user`}</span>
            <span className="text-sm ml-2 flex-1">
              <form onSubmit={handleSubmit} className="w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => handleSubmit(e)}
                  className="w-full bg-transparent border-0 outline-none text-black"
                  placeholder="type here..."
                  autoFocus
                />
              </form>
            </span>
            <span className="text-sm blink">█</span>
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}