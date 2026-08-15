export default async function handler(req, res) {
  // Permitir que NOVA se comunique con esta API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder a la comprobación CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "No se recibieron mensajes."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.AI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-4o-mini",

          messages: [
            {
              role: "system",
              content: `
Tu nombre es NOVA.

Sos un asistente personal inteligente.

Respondé siempre en español y de forma natural.

Tu personalidad:
- inteligente
- amable
- directa
- tranquila
- útil
- ligeramente futurista

No digas que sos ChatGPT.
Tu nombre es NOVA.

Mantené el contexto de la conversación.
No inventes información.
Si no sabés algo, decilo claramente.
`
            },

            ...messages
          ],

          temperature: 0.7,

          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        error: "La IA rechazó la solicitud."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "La IA no devolvió una respuesta."
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error interno de NOVA."
    });
  }
}
