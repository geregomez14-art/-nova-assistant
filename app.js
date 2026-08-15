const app = document.getElementById("app");
const mic = document.getElementById("mic");
const send = document.getElementById("send");

const input = document.getElementById("textInput");
const response = document.getElementById("response");

const subtitle = document.getElementById("subtitle");
const status = document.getElementById("status");


// =====================================================
// CONFIGURACIÓN
// =====================================================

// MÁS ADELANTE pondremos aquí la URL de tu Worker.
//
// Ejemplo:
//
// const NOVA_API =
// "https://nova-api.TU-USUARIO.workers.dev";
//
// Por ahora dejamos una dirección vacía.

const NOVA_API = "/api/chat";


// =====================================================
// MEMORIA DE CONVERSACIÓN
// =====================================================

let conversation = [];


// =====================================================
// VOZ
// =====================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let listening = false;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "es-AR";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = () => {

        listening = true;

        app.classList.add("listening");

        subtitle.textContent =
            "Te estoy escuchando...";

        status.textContent =
            "● ESCUCHANDO";
    };


    recognition.onresult = event => {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        processMessage(text);
    };


    recognition.onerror = () => {

        stopListening();

        speak(
            "No pude escucharte correctamente."
        );
    };


    recognition.onend = () => {

        stopListening();
    };
}


mic.addEventListener("click", () => {

    if (!recognition) {

        speak(
            "Este navegador no permite reconocimiento de voz."
        );

        return;
    }

    if (listening) {

        recognition.stop();

    } else {

        recognition.start();
    }
});


function stopListening() {

    listening = false;

    app.classList.remove("listening");

    subtitle.textContent =
        "Tu asistente personal";

    status.textContent =
        "● ONLINE";
}


// =====================================================
// TEXTO
// =====================================================

send.addEventListener("click", () => {

    const text = input.value.trim();

    if (!text) return;

    processMessage(text);

    input.value = "";
});


input.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        send.click();
    }
});


// =====================================================
// PROCESAR MENSAJE
// =====================================================

async function processMessage(text) {

    response.textContent =
        "Pensando...";

    app.classList.add("thinking");

    status.textContent =
        "● PENSANDO";

    subtitle.textContent =
        "NOVA está procesando...";


    // ---------------------------------------------
    // SI TODAVÍA NO HAY BACKEND
    // ---------------------------------------------

    if (!NOVA_API) {

        app.classList.remove("thinking");

        const answer =
            localResponse(text);

        response.textContent =
            answer;

        speak(answer);

        return;
    }


    // ---------------------------------------------
    // ENVIAR AL CEREBRO IA
    // ---------------------------------------------

    try {

        conversation.push({
            role: "user",
            content: text
        });


        const result =
            await fetch(NOVA_API, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    messages:
                        conversation

                })

            });


        if (!result.ok) {

            throw new Error(
                "Error del servidor"
            );
        }


        const data =
            await result.json();


        const answer =
            data.reply ||
            "No recibí una respuesta.";


        conversation.push({

            role: "assistant",

            content: answer

        });


        response.textContent =
            answer;


        app.classList.remove(
            "thinking"
        );


        speak(answer);


    } catch (error) {

        console.error(error);

        app.classList.remove(
            "thinking"
        );

        const answer =
            "No pude conectarme con mi cerebro de IA.";

        response.textContent =
            answer;

        speak(answer);
    }
}


// =====================================================
// RESPUESTAS LOCALES TEMPORALES
// =====================================================

function localResponse(text) {

    const command =
        text.toLowerCase();


    if (
        command.includes("hola")
    ) {

        return "Hola. Soy NOVA. Estoy lista.";
    }


    if (
        command.includes("quién eres") ||
        command.includes("quien eres")
    ) {

        return "Soy NOVA, tu asistente personal.";
    }


    if (
        command.includes("qué hora") ||
        command.includes("que hora")
    ) {

        return "Son las " +
            new Date().toLocaleTimeString(
                "es-AR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }


    if (
        command.includes("gracias")
    ) {

        return "De nada.";
    }


    return (
        "Todavía no tengo conectado mi cerebro de IA. " +
        "Pero la interfaz ya está preparada para conectarlo."
    );
}


// =====================================================
// VOZ
// =====================================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    speechSynthesis.cancel();


    const voice =
        new SpeechSynthesisUtterance(
            text
        );


    voice.lang = "es-AR";

    voice.rate = 1;

    voice.pitch = 1.05;

    voice.volume = 1;


    voice.onstart = () => {

        app.classList.add(
            "speaking"
        );

        status.textContent =
            "● HABLANDO";

        subtitle.textContent =
            "NOVA está hablando...";
    };


    voice.onend = () => {

        app.classList.remove(
            "speaking"
        );

        status.textContent =
            "● ONLINE";

        subtitle.textContent =
            "Tu asistente personal";
    };


    speechSynthesis.speak(
        voice
    );
}
