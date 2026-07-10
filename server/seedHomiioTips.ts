/**
 * Non-destructive upsert: ensure Homiio product exists and publish Homiio Tips
 * newsroom posts. Safe for production (no collection wipes). Upserts by slug.
 *
 * Usage: MONGO_URI=... bun server/seedHomiioTips.ts
 */
import mongoose from 'mongoose'
import { config } from './config.js'
import { Product } from './models/Product.js'
import { NewsroomPost } from './models/NewsroomPost.js'
import { Media } from './models/Media.js'

type TipSeed = {
  slug: string
  title: string
  resume: string
  description: string
  content: string
  tags: string[]
  featured: boolean
  publishedAt: Date
  coverUrl: string
  coverFilename: string
  imageAlt: string
  authorUsername: string
}

/** Slugs to hard-delete (never re-upsert). */
const DELETE_SLUGS = ['how-to-read-a-rental-listing-like-a-pro'] as const

const TIPS: TipSeed[] = [
  {
    slug: 'senales-de-alerta-antes-de-pagar-nada',
    title: 'Señales de alerta antes de pagar nada',
    resume:
      'No adelantes fianza, “reserva” ni honorarios sin contrato claro. Aprende a detectar cobros ilegales y trampas habituales en Barcelona y el resto de España.',
    description:
      'Guía práctica para no pagar depósitos, reservas ni honorarios de agencia antes de tener un contrato y pruebas por escrito.',
    content: `## La regla de oro

**No pagues nada sustancial** (fianza, mes de reserva, “gastos de gestión”, aval) hasta tener:

1. Identidad del arrendador o agencia verificable
2. Contrato (o borrador) que puedas leer con calma
3. Recibo o transferencia con concepto claro

Si te presionan con “hay mucha gente detrás” y te piden un Bizum ya, frena.

## Cobros que suelen ser ilegales o abusivos

Desde la **Ley de Vivienda 12/2023**, los **gastos de gestión inmobiliaria y de formalización del contrato los paga el arrendador**, no tú (art. 20.1 LAU). Cobrar “mes de agencia” al inquilino es una práctica que el Sindicat de Llogateres y Consumo combaten activamente.

Cuidado con renombres:

- “Asesoramiento legal”
- “Servicio de búsqueda de piso”
- “Gestión del expediente”
- “Gastos de formalización”

Si no contrataste ese servicio de forma independiente y voluntaria, es muy probable que sea el mismo honorario disfrazado.

## Fianza y garantías: límites útiles

En vivienda habitual:

- **Fianza legal**: 1 mensualidad de renta
- **Garantías adicionales** (depósito, aval…): como máximo **2 mensualidades** en contratos de duración ordinaria

Si te piden 4–6 meses “porque el mercado está así”, no es normal. Documenta la petición y consulta antes de aceptar.

## Checklist antes de soltar dinero

- [ ] Has visitado el piso (o tienes videollamada + fotos recientes creíbles)
- [ ] El anuncio coincide con lo que te enseñan (metros, planta, precio)
- [ ] Te dan **factura o justificante** de cualquier pago
- [ ] Prefieres **transferencia** con concepto explícito (nunca solo efectivo sin recibo)
- [ ] Nadie te pide pagar a una cuenta personal “de un amigo del casero”

## Si ya pagaste honorarios indebidos

Guarda factura, transferencias y WhatsApps. El Sindicat de Llogateres publica guías y modelos de burofax para reclamar. También puedes acudir a **Consumo** (Agència Catalana del Consum en Catalunya). Organizarte con otras inquilinas acelera el proceso.

## En Homiio

Prioriza anuncios con precio y condiciones transparentes. Si algo huele a prisa + pago anticipado sin papeles, salta al siguiente piso.`,
    tags: ['safety', 'deposit', 'scams', 'barcelona', 'agency'],
    featured: true,
    publishedAt: new Date('2026-07-08T09:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-red-flags-cover.jpg',
    imageAlt: 'Persona revisando documentos y pagos con cuidado',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'que-debe-incluir-un-contrato-de-alquiler-justo',
    title: 'Qué debe incluir un contrato de alquiler justo',
    resume:
      'Duración, renta, fianza, actualización, inventario y datos del arrendador: lo mínimo que un contrato serio debería dejar por escrito en España.',
    description:
      'Lista práctica de cláusulas y datos que un contrato de vivienda debería contener para protegerte como inquilina.',
    content: `## Antes de firmar: pide el borrador

Un contrato justo se puede leer. Si solo te dejan “firmar ya en la agencia”, pide el PDF por correo y tómate tiempo. En Catalunya, la normativa de vivienda refuerza el derecho a información previa por escrito (descripción, renta, fianza, duración, etc.).

## Datos que no pueden faltar

- **Partes**: nombre/NIF del arrendador (o razón social) y del arrendatario
- **Vivienda**: dirección completa, referencia catastral si la tienen, uso (vivienda habitual)
- **Renta**: importe, forma de pago, cuenta, día del mes
- **Duración** y prórrogas
- **Fianza** (1 mes en vivienda) y, si hay, **garantía adicional** (tope habitual: 2 meses)
- **Inventario / estado de entrega** (anexo con fotos)
- **Quién paga** IBI, comunidad, basuras, seguros (si se repercuten, que conste)
- **Actualización de renta**: índice o sistema, y periodicidad

## Señales de un contrato sesgado

- Renuncias anticipadas a prórrogas legales
- Entrada del casero “cuando quiera” sin preaviso
- Honorarios de agencia a cargo del inquilino
- “Temporada” o “uso distinto” cuando en realidad vas a vivir allí todo el año
- Multas desproporcionadas por cualquier retraso

Las cláusulas que contradicen normas imperativas de la LAU **se tienen por no puestas**: no hace falta “aceptarlas” para que dejen de valer, pero sí conviene marcarlas y pedir que se corrijan antes de firmar.

## Zonas tensionadas y transparencia de precio

En mercados tensionados (Barcelona y muchos municipios catalanes), pide la información sobre la **última renta** y/o el **índice de referencia** cuando aplique. Si el anuncio y el contrato no cuadran, pregunta por escrito.

## Firma con cabeza

- Firma solo cuando el texto coincida con lo hablado
- Quédate una copia firmada el mismo día
- Guarda el anexo de inventario y las fotos de entrada

Un buen contrato no es “desconfianza”: es la base para que ambas partes sepan a qué atenerse.`,
    tags: ['contract', 'legal', 'renting', 'barcelona'],
    featured: true,
    publishedAt: new Date('2026-07-05T11:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-contract-cover.jpg',
    imageAlt: 'Contrato y bolígrafo sobre una mesa',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'checklist-para-visitar-un-piso-con-seguridad',
    title: 'Checklist para visitar un piso con seguridad',
    resume:
      'Habitabilidad, seguridad personal y coherencia del anuncio: qué mirar en la visita para no firmar a ciegas.',
    description:
      'Lista de comprobación para visitas de alquiler: humedad, suministros, vecinos, y cómo protegerte en visitas con desconocidos.',
    content: `## Seguridad personal primero

- Di a alguien dónde vas y a qué hora
- Prefiere visitas de día o con luz natural
- Si es la primera vez con un particular desconocido, valora ir acompañada
- No lleves efectivo ni documentos originales “por si acaso”

## Cruza anuncio y realidad

Durante la visita, comprueba:

- [ ] Metros, distribución y orientación
- [ ] Planta y ascensor (si el anuncio lo promete)
- [ ] Precio y qué incluye (comunidad, agua, internet…)
- [ ] Estado de cocina, baños, ventanas y calefacción
- [ ] Humedades, olores a moho, manchas en techos
- [ ] Presión de agua y que los grifos/cisternas funcionan
- [ ] Enchufes, luces, persianas
- [ ] Ruido de calle / patio / vecinos (quédate 5–10 minutos en silencio)

## Habitabilidad mínima

Un piso alquilable debería permitir vivir con dignidad: agua caliente, ventilación, calefacción usable en invierno, sin riesgos eléctricos evidentes. Si el casero dice “ya lo arreglaremos cuando firmes”, pide el compromiso **por escrito** o no firmes.

## Preguntas útiles

- ¿Quién es el titular del contrato? ¿Gran tenedor?
- ¿Hay obras previstas en el edificio?
- ¿Cuánto pagó el inquilino anterior? (útil en zona tensionada)
- ¿La fianza se deposita en INCASÒL / organismo autonómico?
- ¿Puedo ver el borrador del contrato hoy?

## Después de la visita

Anota defectos con fotos fechadas. Si te gusta el piso, pide el contrato por email — no dejes que la emoción de “por fin un piso” te haga saltarte el papel.`,
    tags: ['viewing', 'safety', 'habitability', 'beginners'],
    featured: false,
    publishedAt: new Date('2026-06-26T10:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-viewing-cover.jpg',
    imageAlt: 'Llaves de piso sobre una mesa en una visita',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'como-documentar-el-estado-del-piso-al-entrar',
    title: 'Cómo documentar el estado del piso al entrar',
    resume:
      'El inventario de entrada es tu mejor defensa cuando te quieran descontar la fianza por desgaste normal. Fotos, vídeo y firma el mismo día.',
    description:
      'Cómo hacer un inventario de entrada sólido: fotos, vídeo, lecturas de contadores y qué hacer si la agencia no quiere firmarlo.',
    content: `## Por qué importa

Al salir, muchas agencias intentan cobrar “limpieza profesional”, “pintura general” o desperfectos que ya estaban. Sin prueba del estado de entrada, discutes de memoria. Con inventario + fotos, discutes con hechos.

## El día de la entrega de llaves

Hazlo **antes de mudarte** o el mismo día, con luz:

1. **Vídeo lento** habitación por habitación (incluye techos y suelos)
2. **Fotos de cerca** de cada defecto: rayones, manchas, grietas, electrodomésticos
3. **Contadores**: agua, luz, gas (foto del número)
4. **Inventario escrito**: lista de muebles y estado (bueno / regular / malo)
5. **Firma** de ambas partes en el anexo; quédate copia

## Qué fotografiar sí o sí

- Baños (juntas, silicona, extractores)
- Cocina (encimera, campana, fondo de armarios)
- Ventanas y persianas
- Puertas y cerraduras
- Radiadores / aire acondicionado
- Terraza o patio si existe
- Trastero / parking si van en el contrato

## Si la agencia “no tiene tiempo”

Envía el inventario por email el mismo día: “Adjunto fotos del estado a la entrega de llaves del [fecha]. Por favor confirmen recepción.” El sello temporal del correo cuenta.

## Al salir

Repite el mismo ritual. Entrega llaves con acuse (burofax o email + confirmación). Pide por escrito el desglose de cualquier retención de fianza.

Documentar no es ser conflictiva: es alquilar con profesionalidad.`,
    tags: ['deposit', 'inventory', 'contract', 'safety'],
    featured: false,
    publishedAt: new Date('2026-06-19T09:30:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-inventory-cover.jpg',
    imageAlt: 'Interior luminoso de un piso listo para inventariar',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'que-hacer-si-no-te-devuelven-la-fianza',
    title: 'Qué hacer si no te devuelven la fianza',
    resume:
      'Tras entregar las llaves, el arrendador dispone de un mes para devolver el saldo. Pasos claros: prueba, requerimiento y, si hace falta, Consumo o demanda.',
    description:
      'Pasos prácticos cuando el casero o la agencia retienen la fianza sin justificación tras el fin del contrato.',
    content: `## Plazo clave

Según la LAU, el saldo de fianza que deba devolverse **devenga interés legal** si pasa **un mes** desde la entrega de llaves sin restituirlo. No esperes “a que el casero tenga tiempo”.

## Paso 1 — Reúne pruebas

- Contrato y anexos
- Inventario y fotos de entrada / salida
- Justificante de entrega de llaves
- Transferencias de renta al corriente
- Bajas de suministros o lecturas finales

## Paso 2 — Requerimiento por escrito

Envía un **burofax** (o medio fehaciente) pidiendo:

- Devolución íntegra (o el importe no justificado)
- Desglose motivado de cualquier descuento
- Plazo concreto (p. ej. 10 días)

En Catalunya, la fianza suele depositarse en **INCASÒL**. El trámite de devolución lo inicia normalmente el arrendador; si se niega a tramitarlo, documéntalo.

## Paso 3 — Si no responden

- **Consumo** / hoja de reclamaciones de la agencia
- Asesoramiento en el **Sindicat de Llogateres** (asamblea y acompañamiento colectivo)
- Demanda de juicio verbal por cantidad (a menudo viable sin abogado cuando la cuantía es baja; valora asesorarte igual)

## Qué NO es un descuento válido

- Desgaste por uso normal (pintura “porque se ve usada”)
- Limpieza general sin pacto claro y sin prueba de suciedad extraordinaria
- Reparaciones que corresponden al arrendador (habitabilidad)

## Qué SÍ puede descontarse (con prueba)

- Daños imputables más allá del uso normal
- Rentas o suministros impagados

Pide siempre factura o presupuesto de lo que te quieren cobrar. Sin prueba, disputa el descuento.`,
    tags: ['deposit', 'legal', 'eviction', 'barcelona'],
    featured: false,
    publishedAt: new Date('2026-06-10T14:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-fianza-cover.jpg',
    imageAlt: 'Monedas y ahorro simbolizando la fianza del alquiler',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'clausulas-y-practicas-ilegales-en-el-alquiler',
    title: 'Cláusulas y prácticas ilegales que debes vigilar',
    resume:
      'Honorarios al inquilino, fianzas excesivas, entradas sin preaviso, “temporadas” fingidas: patrones abusivos y cómo reaccionar sin paniquearte.',
    description:
      'Resumen de prácticas y cláusulas que suelen ser nulas o sancionables en alquileres de vivienda en España y Catalunya.',
    content: `## Principio general

La LAU dice que son **nulas** las estipulaciones que empeoran tus derechos imperativos. Aunque firmes, esa cláusula “se tiene por no puesta”. Aun así, mejor detectarla antes.

## Prácticas frecuentes a rechazar

### 1. Honorarios de agencia al inquilino
Ilegales desde la reforma de 2023: los paga el arrendador. Cuidado con conceptos inventados.

### 2. Fianza / garantías por encima del tope
1 mes de fianza + hasta 2 de garantía adicional en contratos ordinarios de vivienda. Excesos: reclamables.

### 3. Entrada del casero sin aviso
Salvo urgencia real (fuga, incendio), la vivienda es tu domicilio. Exige preaviso razonable por escrito.

### 4. Alquiler de “temporada” de mentira
Si vas a residir de forma estable, un contrato de temporada puede usarse para saltarse protecciones de vivienda habitual y topes en zonas tensionadas. Catalunya ha reforzado el régimen sancionador frente a estos abusos. Si te lo proponen “porque es más fácil”, pregunta por qué no es vivienda habitual.

### 5. Renuncia a prórrogas o derechos
Cláusulas del tipo “el inquilino renuncia a …” suelen ser papel mojado — y una bandera roja sobre con quién firmas.

### 6. Actualizaciones de renta opacas
La subida debe seguir el sistema pactado y los límites legales vigentes. Pide el cálculo por escrito.

## Cómo reaccionar

1. Marca la cláusula y pide corrección antes de firmar
2. Si ya firmaste: comunica por escrito que la consideras nula
3. Conserva anuncios, fichas y chats (la publicidad también vincula)
4. Acude a sindicato / Consumo si hay cobro indebido o coacción

No necesitas memorizar códigos: necesitas **no normalizar** lo abusivo.`,
    tags: ['legal', 'contract', 'agency', 'barcelona'],
    featured: false,
    publishedAt: new Date('2026-06-03T08:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-illegal-clauses-cover.jpg',
    imageAlt: 'Balanza de la justicia sobre documentos',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'derechos-basicos-en-pisos-compartidos',
    title: 'Derechos básicos en pisos compartidos',
    resume:
      '¿Estás en el contrato o solo pagas a un compañero? La diferencia cambia casi todo. Cómo protegerte en un piso compartido sin drama innecesario.',
    description:
      'Orientación práctica para roommates: contrato, empadronamiento, fianza y qué pasa si te echan de un piso compartido.',
    content: `## La pregunta que lo cambia todo

**¿Tu nombre está en el contrato de arrendamiento?**

- **Sí**: eres arrendataria (o coarrendataria) con derechos frente al casero.
- **No**: a menudo estás en una cesión / subarriendo / “habitación de palabra”. Tu protección es más frágil y depende de lo pactado con quien sí firma.

Antes de mudarte, pide ver el contrato y aclara tu situación por escrito.

## Buenas prácticas entre compañeras

- Acuerdo interno: renta, suministros, limpieza, visitas, mascotas
- Quién pagó qué parte de la fianza (y cómo se recupera al salir)
- Preaviso para dejar la habitación (30 días es un mínimo razonable entre adultas)
- Normas de convivencia claras, no “leyes” unilaterales

## Empadronamiento

Empadrónate en la dirección real. Facilita acceso a sanidad, votaciones y trámites. Si el casero o la compañera se niegan sin motivo, documenta y busca asesoramiento — el empadronamiento es un derecho vinculado a la residencia efectiva.

## Si te quieren echar “ya”

Nadie puede cambiar la cerradura ni retener tus cosas como chantaje. Si hay conflicto grave:

1. Guarda pruebas (mensajes, fotos)
2. Habla con el Sindicat o un servicio de mediación / asesoría
3. No firmes “salidas” bajo presión sin entender qué derechos entregas

## Homiio y roommates

Busca compañeras con valores alineados y deja las condiciones económicas por escrito desde el día uno. Un piso compartido sano se parece más a un mini-contrato entre iguales que a un favor.`,
    tags: ['roommates', 'contract', 'safety', 'beginners'],
    featured: false,
    publishedAt: new Date('2026-05-27T12:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-roommates-cover.jpg',
    imageAlt: 'Salón de un piso compartido con luz natural',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'donde-pedir-ayuda-alquiler-barcelona',
    title: 'Dónde pedir ayuda con el alquiler en Barcelona',
    resume:
      'Sindicat de Llogateres, Habitatge del Ajuntament, Consumo e INCASÒL: recursos reales cuando hay conflicto de fianza, honorarios o amenaza de expulsión.',
    description:
      'Directorio práctico de recursos para inquilinas en Barcelona y Catalunya: sindicatos, administración y consumo.',
    content: `## Empieza por organizarte

Los conflictos de alquiler se ganan más fácil en colectivo. El **Sindicat de Llogateres** acompaña casos de fianzas, honorarios, subidas y amenazas de no renovación.

- Web: [sindicatdellogateres.org](https://sindicatdellogateres.org/)
- Contacto: sindicat@sindicatdellogateres.org
- Consulta horarios de asamblea y puntos de acogida en su web (“On som” / “Dónde encontrarnos”) — pueden cambiar

También hay sindicatos de barrio (Gràcia, Vallcarca, Poble Sec, etc.) con asambleas propias.

## Administración y vivienda

- **Habitatge — Ajuntament de Barcelona**: FAQs y recursos sobre alquiler, fianza y honorarios en [barcelona.cat/habitatge](https://www.barcelona.cat/habitatge/)
- **Oficinas de Atención Ciudadana (OAC)**: trámites y orientación municipal; pide cita en los canales oficiales del Ayuntamiento
- **Agència de l’Habitatge de Catalunya / INCASÒL**: depósito y devolución de fianzas en Catalunya

Verifica siempre teléfonos y citas en la web oficial: los horarios cambian.

## Consumo

Si una agencia cobra indebido o se niega a dar hoja de reclamaciones:

- Pide la **hoja oficial de reclamación**
- Agència Catalana del Consum (reclamaciones de consumo en Catalunya)

Adjunta anuncio, contrato, facturas y chats.

## Qué llevar a cualquier cita

- DNI/NIE
- Contrato y anexos
- Pruebas de pago
- Cronología breve del conflicto (fechas + hechos)

## Homiio

Usamos estos mismos principios: transparencia, menos opacidad de agencia, y herramientas (como Sindi) para orientarte. Cuando el conflicto escala, el sindicato y la administración son tus aliados — no estás sola.`,
    tags: ['barcelona', 'legal', 'help', 'deposit'],
    featured: false,
    publishedAt: new Date('2026-05-20T10:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-barcelona-help-cover.jpg',
    imageAlt: 'Skyline de Barcelona al atardecer',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'como-evitar-estafas-de-alquiler-online',
    title: 'Cómo evitar estafas de alquiler online',
    resume:
      'Pisos fantasma, dueños en el extranjero y reservas por Bizum: el patrón de la estafa online y cómo cortarlo antes de perder dinero.',
    description:
      'Señales de estafa en portales y redes, y protocolo seguro para contactar, visitar y pagar un alquiler.',
    content: `## El guion clásico

1. Anuncio demasiado bueno (precio muy bajo en zona cara)
2. El “casero” está fuera y no puede enseñar el piso
3. Te pide **reserva / fianza por adelantado** para “bloquearlo”
4. Tras pagar, desaparece

Si reconoces el patrón, no negocies: corta.

## Red flags digitales

- Solo contacto por WhatsApp / Telegram, sin teléfono verificable
- Fotos de stock o que aparecen en otros anuncios con otra dirección (búsqueda inversa de imagen)
- Negativa absoluta a visita presencial o videollamada en directo
- Contrato PDF genérico con firmas ya puestas
- Pago a cuentas en el extranjero o a nombre distinto del anunciante
- Urgencia extrema + amenaza de perder la oportunidad

## Protocolo anti-estafa

- [ ] Visita el piso o haz videollamada en vivo recorriendo espacios
- [ ] Verifica que quien te atiende puede demostrar legitimidad (escritura, mandato de agencia, DNI del titular)
- [ ] No pagues reserva sin contrato o documento bilateral claro
- [ ] Usa transferencia con concepto; evita efectivo y criptomonedas
- [ ] Desconfía de “agencias” que solo existen como perfil de Instagram

## Portales y Homiio

En portales generalistas hay de todo. En Homiio priorizamos señales de transparencia (fuente, condiciones claras, menos fricción opaca). Aun así, aplica el mismo escepticismo sano: **si solo te piden dinero y nunca te enseñan el piso, no es un alquiler — es un timo.**

## Si te estafaron

1. Guarda conversaciones y comprobantes
2. Denuncia en Policía / Guardia Civil (estafa)
3. Avisa al portal para tumbar el anuncio
4. Habla con tu banco por transferencia no autorizada / fraude

Actuar rápido importa más que sentir vergüenza. Las estafas de alquiler son comunes; reportarlas protege a la siguiente persona.`,
    tags: ['scams', 'safety', 'online', 'beginners'],
    featured: false,
    publishedAt: new Date('2026-05-10T16:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-scams-cover.jpg',
    imageAlt: 'Portátil y candado simbolizando seguridad online',
    authorUsername: 'Homiio Team',
  },
  {
    slug: 'por-que-importa-alquilar-en-plataformas-eticas',
    title: 'Por qué importa alquilar en plataformas éticas',
    resume:
      'Menos opacidad, más información y herramientas pensadas para inquilinas: cómo elegir canales que no te traten como un lead más.',
    description:
      'Diferencias prácticas entre alquilar en un embudo agresivo y usar plataformas alineadas con derechos de inquilinas, como Homiio.',
    content: `## El problema no es “buscar piso”

El problema es un mercado donde a menudo:

- Se esconden honorarios hasta el último momento
- Se normaliza la prisa y la coacción
- El inquilino aporta datos sensibles sin reciprocidad
- Los anuncios mezclan vivienda real con ruido y fraude

Una plataforma ética no “arregla la ley”, pero sí puede **dejar de premiar** esas dinámicas.

## Qué mirar en cualquier app o portal

- ¿El precio y las condiciones se ven sin un embudo de registro agresivo?
- ¿Te empujan a pagar antes de entender el contrato?
- ¿Hay forma de reportar abusos o anuncios falsos?
- ¿La herramienta te orienta sobre derechos — o solo sobre conversión?

## Cómo encaja Homiio

Homiio nace para alquilar con menos miedo: listados más transparentes, matching de compañeras por valores, y Sindi para dudas de derechos. No sustituye al Sindicat ni a un abogado; **sí** intenta que el producto no esté diseñado en contra tuya.

## Tu poder como inquilina

Cada vez que rechazas un cobro ilegal, documentas un piso o eliges un canal más limpio, cambias un poco el incentivo del mercado. Alquila con información. Organízate cuando haga falta. Y no asumas que “así es el mercado” es una excusa válida.`,
    tags: ['homiio', 'ethics', 'renting', 'beginners'],
    featured: false,
    publishedAt: new Date('2026-04-28T11:00:00.000Z'),
    coverUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=630&fit=crop',
    coverFilename: 'homiio-tips-ethical-cover.jpg',
    imageAlt: 'Cocina acogedora de un hogar alquilado con luz cálida',
    authorUsername: 'Homiio Team',
  },
]

async function ensureCoverMedia(
  url: string,
  filename: string,
  alt: string,
): Promise<mongoose.Types.ObjectId> {
  const existing = await Media.findOne({ url }).select('_id')
  if (existing) return existing._id

  const doc = await Media.create({
    url,
    filename,
    key: new URL(url).pathname.slice(1) || filename,
    mimeType: 'image/jpeg',
    size: 0,
    alt,
    tags: ['seed', 'homiio', 'tips'],
    folder: 'seed',
    thumbnails: { sm: '', md: '', lg: '' },
  })
  return doc._id
}

async function main() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  let product = await Product.findOne({ productId: 'homiio' })
  if (!product) {
    product = await Product.create({
      productId: 'homiio',
      name: 'Homiio',
      tagline: 'Rental made easy',
      description:
        'Renting made fair: transparent listings, values-based roommate matching, an Oxy-powered trust score and Sindi, your AI tenant-rights assistant.',
      href: 'https://homiio.com/',
      landingUrl: '/homiio',
      external: false,
      cta: 'Explore Homiio',
      brand: '#e11d48',
      mark: 'H',
      section: 'apps',
      lifecycle: 'live',
      showOnProducts: true,
      showOnStatus: true,
      showInNav: true,
      order: 0,
    })
    console.log('Created Homiio product')
  } else {
    console.log('Homiio product already exists:', product._id.toString())
  }

  for (const slug of DELETE_SLUGS) {
    const deleted = await NewsroomPost.findOneAndDelete({ slug })
    if (deleted) {
      console.log('Deleted obsolete tip:', slug, deleted._id.toString())
    } else {
      console.log('Obsolete tip already absent:', slug)
    }
  }

  for (const tip of TIPS) {
    const coverImage = await ensureCoverMedia(tip.coverUrl, tip.coverFilename, tip.imageAlt)
    const payload = {
      title: tip.title,
      slug: tip.slug,
      resume: tip.resume,
      description: tip.description,
      content: tip.content,
      coverImage,
      imageAlt: tip.imageAlt,
      authorUsername: tip.authorUsername,
      tags: tip.tags,
      categories: ['Tips'],
      products: [product._id],
      featured: tip.featured,
      status: 'published' as const,
      publishedAt: tip.publishedAt,
    }

    const post = await NewsroomPost.findOneAndUpdate(
      { slug: tip.slug },
      { $set: payload },
      { upsert: true, new: true },
    )

    console.log(
      'Upserted:',
      post.slug,
      '| featured=',
      post.featured,
      '| publishedAt=',
      post.publishedAt.toISOString(),
    )
  }

  const count = await NewsroomPost.countDocuments({
    categories: 'Tips',
    products: product._id,
    status: 'published',
  })
  console.log('Published Homiio Tips total:', count)

  await mongoose.disconnect()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
