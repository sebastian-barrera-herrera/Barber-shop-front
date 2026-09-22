# Studio Booking — Web

Web pública y panel administrativo de la plataforma de reservas para barberías, salones de belleza, spa y
estudios de uñas. **Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query · Motion · Three.js.**

- API: [barber-shop-back](https://github.com/sebastian-barrera-herrera/barber-shop-back) (incluye guías de Wompi y despliegue)
- Arquitectura y decisiones: [docs/PLAN_TECNICO.md](docs/PLAN_TECNICO.md)

## Qué incluye

**Web pública**
- Landing con hero editorial, objeto 3D por tipo de negocio, carta de servicios con precios, equipo, horario
  con "abierto ahora", ubicación y botón de WhatsApp.
- Reserva en 4 pantallas: servicio → profesional ("me da igual") → fecha y hora → tus datos. Sin cuenta.
- "Mi cita" (enlace privado): agregar al calendario, cancelar dentro del plazo, chatear con el negocio y pagar en línea.

**Panel** (`/admin`)
- **Hoy**: resumen, agenda con acciones de un toque, ingresos de la semana, servicios populares.
- **Calendario** día / semana / mes · **Citas** con filtros · **Clientes** con ficha e historial.
- **Mensajes** · **Servicios** · **Profesionales** (servicios, horario, días libres, acceso) · **Mi horario**.
- **Pagos** (conectar Wompi) · **Reportes** · **Configuración** (negocio, horario, redes, apariencia, reservas).
- Buscador global (atajo `/`), avisos de nuevas reservas, mensajes y pagos. Todo se actualiza solo.

## 1. Requisitos

- Node.js 20+
- La API corriendo (ver su README)

## 2. Instalación y ejecución

```bash
git clone git@github.com:sebastian-barrera-herrera/Barber-shop-front.git
cd Barber-shop-front
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000   ·   panel: http://localhost:3000/admin
```

## 3. Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API (la usa el navegador) |
| `API_URL` | Opcional: URL de la API desde el servidor de Next (en Docker, `http://api:4000/api/v1`) |
| `NEXT_PUBLIC_BUSINESS_SLUG` | Qué negocio muestra esta web (`studio-demo` con los datos de prueba) |
| `NEXT_PUBLIC_SITE_URL` | Dominio público (canonical, sitemap, Open Graph) |

Las variables `NEXT_PUBLIC_*` quedan fijas al compilar.

## 4. Rutas

| Ruta | Página |
|---|---|
| `/` · `/servicios` · `/profesionales` · `/contacto` | Web pública |
| `/reservar` | Reserva (`?servicio=&con=&fecha=&hora=`, el botón "atrás" funciona) |
| `/cita/[token]` | Ver, cancelar, chatear y pagar (privada, no indexada) |
| `/admin/login` | Entrada al panel |
| `/admin`, `/admin/calendario`, `/admin/citas`, `/admin/clientes`, `/admin/mensajes`, `/admin/servicios`, `/admin/profesionales`, `/admin/mi-horario`, `/admin/pagos`, `/admin/reportes`, `/admin/configuracion` | Panel (según rol) |

## 5. Diseño

Concepto **"la libreta del salón"**: la carta de precios de la pared y el ticket de la cita, en vez de una plantilla de SaaS.

- **Marca sin tocar código:** 5 estilos (`studio`, `barber`, `spa`, `nails`, `beauty`) en `src/lib/theme.ts`,
  aplicados desde el servidor como variables CSS (sin parpadeo). Los colores propios se aceptan solo si tienen
  contraste suficiente; los estilos cumplen WCAG AA (verificado en tests).
- **Tipografía:** Fraunces (títulos) y Hanken Grotesk (texto) con `next/font`.
- **Three.js solo en el hero:** un objeto cuyo material cambia por estilo (cerámica, latón, piedra, laca, seda).
  Se descarga después de que la página ya se puede usar, y no se carga con "reducir movimiento", ahorro de
  datos, sin WebGL o con animaciones apagadas.
- **Animaciones sin bloquear contenido:** el título y las apariciones al hacer scroll son CSS; Motion se usa en
  la reserva y el panel.

## 6. Accesibilidad

Navegación por teclado, foco visible, "saltar al contenido", opciones como `radiogroup`/`switch`, paneles con foco
atrapado y Esc, errores asociados a su campo, estados con texto (no solo color), contraste AA y
`prefers-reduced-motion`.

## 7. SEO

Metadata por página, Open Graph con imagen generada, favicon con la inicial del negocio, `sitemap.xml`,
`robots.txt` (excluye `/admin` y `/cita`) y datos estructurados schema.org con horario, dirección y precios.

## 8. Rendimiento

Páginas públicas prerenderizadas y revalidadas cada minuto (ISR). En la landing se cargan unos 143 KB
comprimidos de JavaScript antes del `load` (principalmente React/Next); Three.js (~186 KB) llega después y
solo si aplica. Imágenes con `next/image`, fuentes autoalojadas.

## 9. Sesión del panel

El token de acceso vive solo en memoria; la renovación usa la cookie httpOnly de la API. La protección de rutas
es del lado del cliente; la seguridad real la aplica la API en cada petición (roles y negocio).

## 10. Tests

```bash
npm test             # dinero, fechas, zona horaria, contraste de los estilos, archivo de calendario
npm run typecheck
```

## 11. Producción y Docker

```bash
npm run build && npm start
```

```bash
docker build -f docker/Dockerfile -t studio-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://tudominio.com .
```

Todo junto (base de datos + API + web) desde el repo del back:
`docker compose -f docker-compose.yml -f docker-compose.full.yml up -d --build`.

Si la API no responde durante la compilación, las páginas se generan con un aviso temporal y se regeneran
solas al minuto con los datos reales.
