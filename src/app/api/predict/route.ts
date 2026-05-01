import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tokens } = await req.json();
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json({ success: false, error: "Invalid tokens payload" }, { status: 400 });
    }

    // Call Python FastAPI ML Service
    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      const mlRes = await fetch(`${mlServiceUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens })
      });
      
      const mlJson = await mlRes.json();
      
      if (mlJson.success) {
        // Merge ML results with original tokens
        const analyzedTokens = tokens.map(token => {
          const mlData = mlJson.data.find((d: any) => d.address === token.address);
          return {
            ...token,
            ...mlData
          };
        });
        return NextResponse.json({ success: true, data: analyzedTokens });
      } else {
        throw new Error(mlJson.detail || "ML Service Error");
      }
    } catch (mlError) {
      console.warn("Python ML Service unreachable. Falling back to default data.", mlError);
      return NextResponse.json({ success: true, data: tokens });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
