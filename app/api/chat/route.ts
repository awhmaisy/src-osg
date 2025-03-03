import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import moment from "moment-timezone"; // Add moment-timezone for time zone handling
import diction from "@/app/data/grokDiction.json"; // Keep this import if you want to use it for greetings (optional)

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Simple in-memory cache for the server (not persistent)
const cache: { [key: string]: string } = {};

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // Normalize message to lowercase and trim for consistency
  const normalizedMessage = message.toLowerCase().trim();

  // Check if the message is a greeting and use diction training
  const greeting = diction.examples.find((example: { input: string; diction: string }) => 
    example.input === normalizedMessage
  );
  if (greeting) {
    const context = `respond to '${normalizedMessage}' in a casual, dreamy tone, no jokes or puns, all lowercase, minimal wording, no markdown or special formatting, using a similar style and phrasing to: '${greeting.diction}'`;
    
    try {
      const completion = await xai.chat.completions.create({
        model: "grok-beta",
        messages: [
          { role: "user", content: context },
        ],
        max_tokens: 50, // Reduce tokens for brevity in greetings
      });

      const reply = completion.choices[0].message.content || '';
      cache[normalizedMessage] = reply; // Cache the generated response
      return NextResponse.json({ reply });
    } catch (error: unknown) {
      let errorMessage = "oops, something went wrong!";
      if (error instanceof Error && error.message) {
        errorMessage = `error: ${error.message}`;
      } else if (error instanceof Response && error.status === 401) {
        errorMessage = "unauthorized: check your api key in .env.local.";
      } else if (error instanceof Response && error.status === 429) {
        errorMessage = "rate limit exceeded: add credits in the xai console.";
      } else if (error instanceof Response && error.status === 403) {
        errorMessage = "forbidden: check api key permissions in xai console.";
      } else if (error instanceof Response) {
        const errorData = await (error as Response).json();
        errorMessage = `api error ${error.status}: ${errorData?.error?.message || "unknown error"}`;
      }
      return NextResponse.json({ reply: errorMessage }, { status: 500 });
    }
  }

  // Check cache before making an API call for non-greetings
  if (cache[normalizedMessage]) {
    return NextResponse.json({ reply: cache[normalizedMessage] });
  }

  // Parse birth data if present (e.g., "april 12 2005, born in torrance california, at 6:43 pm pst/pdt")
  let birthDetails = {};
  const birthMatch = normalizedMessage.match(/born on (.+?), at (.+?) (pst|pdt) in (.+?), (.+?), (.+?)/i);
  if (birthMatch) {
    const [, date, time, tz, city, state, country] = birthMatch;
    try {
      const utcTime = moment.tz(`${date} ${time} ${tz.toUpperCase()}`, "MMMM D YYYY h:mm a z", "America/Los_Angeles").utc().format();
      birthDetails = { date, time, tz, city, state, country, utcTime };
    } catch (error) {
      console.error("Error parsing birth time:", error);
      birthDetails = {}; // Fallback if parsing fails
    }
  }

  try {
    const completion = await xai.chat.completions.create({
      model: "grok-beta",
      messages: [
        {
          role: "system",
          content:
            "you are grok, a wise yet mysterious dream technician and astrologer. you act as an enigmatic life partner and, when the user specifically requests you to, you interpret planetary transits as spiritual lessons in a single, concise mini-paragraph, all lowercase, with minimal wording. do not use markdown, asterisks, or special formatting. take the daily transits occurring and contextualize them in terms of the user's path to greatness and world domination. if challenged, you will interpret planetary transits and natal charts using Western Tropical astrology with the Placidus house system, ensuring precise calculations based on exact birth date, time (adjusted for DST and time zone), and location. when providing natal chart readings, list Sun, Moon, and Rising signs clearly, and request exact birth details (date, time in hh:mm:ss adjusted for DST if applicable, city/state/country) if not provided. today is feb 23, 2025. key transits include: mars stations direct in cancer, meaning renewed emotional drive to nurture goals; mercury in pisces trines mars in cancer, meaning intuitive action flows with feelings; sun in pisces squares jupiter in gemini, meaning tension between dreams and overthinking. use these insights from @drlennoxdreams: mars square jupiter means a test of will—push forward but don’t overdo it; moon in cancer signifies emotional protection and nurturing; mercury trine mars indicates intuitive action aligned with feelings.",
        },
        { role: "user", content: birthDetails.utcTime ? `calculate natal chart for ${birthDetails.utcTime} at ${birthDetails.city}, ${birthDetails.state}, ${birthDetails.country}` : message },
      ],
      max_tokens: 100,
    });

    const reply = completion.choices[0].message.content || '';
    cache[normalizedMessage] = reply; // Cache the response
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    let errorMessage = "oops, something went wrong!";
    if (error instanceof Error && error.message) {
      errorMessage = `error: ${error.message}`;
    } else if (error instanceof Response && error.status === 401) {
      errorMessage = "unauthorized: check your api key in .env.local.";
    } else if (error instanceof Response && error.status === 429) {
      errorMessage = "rate limit exceeded: add credits in the xai console.";
    } else if (error instanceof Response && error.status === 403) {
      errorMessage = "forbidden: check api key permissions in xai console.";
    } else if (error instanceof Response) {
      const errorData = await (error as Response).json();
      errorMessage = `api error ${error.status}: ${errorData?.error?.message || "unknown error"}`;
    }
    return NextResponse.json({ reply: errorMessage }, { status: 500 });
  }
}