# Studio Booking — Web

Web pública y panel administrativo de la plataforma de reservas para barberías, salones, spa y estudios de uñas.
Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Three.js.

La API vive en [barber-shop-back](https://github.com/sebastian-barrera-herrera/barber-shop-back).
Arquitectura y decisiones: [docs/PLAN_TECNICO.md](docs/PLAN_TECNICO.md).

## Estado

| Paso | Qué | Estado |
|---|---|---|
| 10 | Landing (hero 3D, carta de servicios, equipo, horario y ubicación) + SEO | ✅ |
| 11 | Reserva en 4 pantallas + página "mi cita" (ver, calendario, cancelar) | ✅ |
| 12 | Panel: login, "Hoy" (resumen, agenda con acciones rápidas, ingresos, servicios populares), nueva cita | ✅ |
| 13 | Calendario Día / Semana / Mes: crear tocando un hueco, ver, confirmar, cancelar, completar y mover | ✅ |
| 14+ | Mensajes, pagos, configuración, gestión de servicios/profesionales/clientes | Pendiente |

## Requisitos

- Node.js 20 o superior
- La API corriendo (ver el README del back)

## Puesta en marcha

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API (la usa el navegador) |
| `API_URL` | Opcional: URL de la API desde el servidor de Next (en Docker, `http://api:4000/api/v1`) |
| `NEXT_PUBLIC_BUSINESS_SLUG` | Qué negocio muestra esta web (`studio-demo` con los datos de prueba) |
| `NEXT_PUBLIC_SITE_URL` | Dominio público (canonical, sitemap, Open Graph) |

## Rutas

| Ruta | Página |
|---|---|
| `/` | Landing |
| `/servicios` | Carta completa |
| `/profesionales` | Equipo |
| `/contacto` | Horario, dirección y contacto |
| `/reservar` | Flujo de reserva (`?servicio=&con=&fecha=&hora=`) |
| `/cita/[token]` | Ver o cancelar una cita (enlace privado, no indexado) |
| `/admin/login` | Entrada al panel |
| `/admin` | Hoy: resumen del día y agenda |
| `/admin/calendario` | Calendario (`?vista=semana\|mes&fecha=&pro=`) |

Desde cualquier fila de la carta se entra con el servicio ya elegido (`/reservar?servicio=corte-clasico`);
desde el equipo, con el profesional (`/reservar?con=carlos`).

## Diseño

Concepto **"la libreta del salón"**: la carta de precios de la pared y el ticket de la cita, en lugar de una
plantilla de SaaS.

- **Marca por negocio sin tocar código.** `src/lib/theme.ts` tiene 5 presets (`studio`, `barber`, `spa`,
  `nails`, `beauty`). El servidor inyecta los colores como variables CSS en `<html>`, sin parpadeo al cargar.
  Los colores personalizados solo se aplican si tienen contraste suficiente.
- **Tipografía:** Fraunces (títulos) y Hanken Grotesk (texto), servidas por `next/font`.
- **Three.js solo en el hero.** Un único objeto cuyo material cambia según el preset: cerámica, latón, piedra,
  laca o seda. Se carga aparte y después de que la página ya se puede usar, y no carga con
  "reducir movimiento", ahorro de datos, sin WebGL o con animaciones apagadas; en esos casos se ve una silueta
  estática. Se pausa fuera de pantalla.
- **Animaciones sin JavaScript donde importa.** El título y las apariciones al hacer scroll son CSS puro
  (`animation-timeline: view()`): el contenido nunca queda oculto esperando a que cargue la app. Motion se usa en
  las transiciones entre pasos de la reserva.

## Panel

- **Sesión:** el token de acceso vive solo en memoria; la renovación usa la cookie httpOnly de la API
  (el JavaScript no puede leerla). Si vence, se renueva una sola vez aunque haya varias peticiones a la vez.
  La protección de rutas es del lado del cliente; la seguridad real la aplica la API en cada petición.
- **Siempre al día:** la agenda y el calendario se recargan cada 30 s y al volver a la pestaña, así que una
  reserva hecha en la web aparece sola. Cada acción (confirmar, mover…) refresca todo lo relacionado.
- **Roles:** dueño y administrador crean y mueven citas; el profesional ve solo su agenda y cambia estados.
- **Calendario:** Día = una columna por profesional, con las horas fuera de su horario rayadas; Semana = una
  columna por día (filtrable por profesional); Mes = cuántas citas hay cada día. Las citas que se cruzan se
  muestran lado a lado. Arrastrar para mover queda para la fase 2; por ahora se mueve desde el detalle,
  solo a horas libres.

## Accesibilidad

Enlace "saltar al contenido", foco visible, opciones de la reserva como `radiogroup`, foco al título en cada
paso, errores de formulario asociados a su campo, estados con texto (no solo color) y respeto por
`prefers-reduced-motion`.

## SEO

Metadata por página, Open Graph con imagen generada (`/opengraph-image`), favicon con la inicial del negocio,
`sitemap.xml`, `robots.txt` y datos estructurados schema.org (`HairSalon`, `DaySpa`, `NailSalon`…) con horario,
dirección y precios.

## Producción

```bash
npm run build && npm start
```

Docker (salida `standalone`):

```bash
docker build -f docker/Dockerfile -t studio-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://tudominio.com .
```

Todo junto (base de datos + API + web) desde el repo back:
`docker compose -f docker-compose.yml -f docker-compose.full.yml up -d --build`.

Si la API no responde durante el build, las páginas se generan con un aviso temporal y se regeneran solas
al minuto con los datos reales.
