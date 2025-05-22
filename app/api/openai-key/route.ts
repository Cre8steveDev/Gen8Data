import { NextResponse } from "next/server"

export async function GET() {
  // Check if the OpenAI API key is set
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        available: false,
        message: "OpenAI API key is not configured. AI-generated datasets will not be available.",
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    {
      available: true,
      message: "OpenAI API key is configured and available for use.",
    },
    { status: 200 },
  )
}
