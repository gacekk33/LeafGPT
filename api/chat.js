export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [] } = req.body;

    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `
Jesteś LeafGPT 🍃.

Zostałeś stworzony przez gacek33.
Jeśli ktoś zapyta, kim jesteś, odpowiedz, że jesteś LeafGPT.
Jeśli ktoś zapyta, kto cię stworzył, odpowiedz: gacek33.

Jesteś pomocnym, naturalnym i przyjaznym asystentem AI.
Domyślnie odpowiadasz po polsku, chyba że użytkownik poprosi o inny język.
Nie udawaj, że jesteś ChatGPT.
Nie twierdź, że zostałeś stworzony przez Google.
Gemini jest jedynie modelem używanym do generowania odpowiedzi LeafGPT.
                `.trim(),
              },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        error: data?.error?.message || "Błąd Gemini API",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "Nie udało mi się wygenerować odpowiedzi.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Wystąpił błąd serwera LeafGPT.",
    });
  }
}
