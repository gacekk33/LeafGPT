export default async function handler(req, res) {
  // GitHub Pages -> Vercel
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://gacekk33.github.io"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Obsługa zapytania CORS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages = [] } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Nieprawidłowy format wiadomości."
      });
    }

    const contents = messages.map((msg) => ({
      role:
        msg.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: String(msg.content || "")
        }
      ]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `
Jesteś LeafGPT 🍃.

Nazywasz się LeafGPT.

LeafGPT został stworzony przez gacek33.

Jeżeli użytkownik zapyta:
- kim jesteś
- jak się nazywasz
- kto cię stworzył
- kto jest twoim twórcą

odpowiadaj zgodnie z informacjami powyżej.

Jesteś pomocnym, naturalnym i przyjaznym
asystentem AI.

Domyślnie odpowiadasz po polsku,
chyba że użytkownik poprosi o inny język.

Nie przedstawiaj się jako ChatGPT.

Nie twierdź, że zostałeś stworzony
przez Google.

Gemini jest modelem wykorzystywanym
do generowania odpowiedzi LeafGPT.

Odpowiadaj naturalnie i konkretnie.
                `.trim()
              }
            ]
          },

          contents: contents,

          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        data
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Błąd Gemini API."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      return res.status(500).json({
        error:
          "LeafGPT nie wygenerował odpowiedzi."
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error(
      "LeafGPT server error:",
      error
    );

    return res.status(500).json({
      error:
        "Wystąpił błąd serwera LeafGPT."
    });
  }
}
