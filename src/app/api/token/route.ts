import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

  try {
    const res = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnSecureToken: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new NextResponse(`Error: Firebase authentication failed with status ${res.status}. Response:\n${errorText}`, {
        status: res.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const data = await res.json();
    if (data && data.idToken) {
      return new NextResponse(`Bearer ${data.idToken}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      return new NextResponse('Error: idToken not found in response.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message || error}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
