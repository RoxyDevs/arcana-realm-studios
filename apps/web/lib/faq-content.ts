export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Deterministic FAQ content — no LLM call, no backend round trip. A closed
 * set of "what is this feature / how do I use it" questions doesn't need AI
 * to answer well, and this way the widget never costs anything to run or
 * says something wrong (see CLAUDE.md's AI Philosophy: prefer deterministic
 * systems over AI where AI wouldn't add real value).
 */
export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "¿Qué es Arcana Realm Studios?",
    answer:
      "Un panel para dueños de salas de IMVU: radio automática (AutoDJ), moderación (Guardian), transmisión en vivo con mic, y más — todo desde una web, sin bot con avatar dentro de la sala.",
  },
  {
    question: "¿Cómo pongo música en mi sala?",
    answer:
      "Primero vinculás tu sala en el dashboard (pegás el link de IMVU y confirmás un token). Una vez verificada, subís tus propios temas o buscás en la librería compartida / catálogo Jamendo — se encolan solos para AutoDJ.",
  },
  {
    question: "¿Qué es Arcana Guardian?",
    answer:
      "El módulo de moderación: anti-spam, anti-raid, reportes de incidentes y reputación opcional entre salas. Tiene su propia licencia paga por créditos, independiente del tiempo de bot de música — podés tener una sin la otra, o las dos.",
  },
  {
    question: "¿Puedo transmitir con mi mic en vivo?",
    answer:
      "Sí — desde \"Live broadcast\" en el dashboard te doy credenciales de un solo uso para conectar BUTT, Mixxx o ffmpeg (todos gratis). Mientras estés conectado, tu audio reemplaza al AutoDJ; al cortar, vuelve solo.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Free: uso pago por créditos (pay-as-you-go). Plus $6.99/mes y Premium $14.99/mes te dan descuento en créditos + beneficios, con 3 días de prueba gratis (se pide tarjeta, pero no se cobra hasta el día 4).",
  },
  {
    question: "¿Puedo pagar sin tarjeta?",
    answer:
      "Sí, con PayPal o VCoin de IMVU — mencionás el plan y tu usuario, y se activa a mano desde el dashboard.",
  },
];
