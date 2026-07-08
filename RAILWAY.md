# Desplegar SplitSnap en Railway

Guía paso a paso: **GitHub → Railway (MySQL + API + Web)**.

## Requisitos

- Cuenta en [GitHub](https://github.com) y [Railway](https://railway.app)
- Repo del proyecto subido a GitHub (**privado** recomendado)
- **No** subir `backend/.env` ni `storage/` (ya están en `.gitignore`)

---

## 1. Subir el código a GitHub

```bash
cd "/Users/andregarcia/Desktop/SplitSnap Ticket"
git status
git add .
git commit -m "Preparar despliegue Railway"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

---

## 2. Crear proyecto en Railway

1. Entra a [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → autoriza GitHub → elige tu repo
3. Railway creará un primer servicio; lo reconfiguraremos en los pasos siguientes

---

## 3. Base de datos MySQL

1. En el proyecto Railway → **+ New** → **Database** → **MySQL**
2. Espera a que esté **Active**
3. En la pestaña **Variables** del MySQL verás `MYSQL_URL` (u otras). La usarás en el backend

---

## 4. Servicio Backend (API)

1. **+ New** → **GitHub Repo** → mismo repo (o **Empty Service** y conecta el repo)
2. **Settings** → **Root Directory** → `backend`
3. **Settings** → **Networking** → **Generate Domain** (ej. `splitsnap-api-production.up.railway.app`)
4. **Variables** (pestaña Variables del servicio backend):

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | Referencia `${{MySQL.MYSQL_URL}}` (usa *Add Reference* desde el servicio MySQL) |
| `NODE_ENV` | `production` |
| `PORT` | Railway lo inyecta solo; no hace falta fijarlo |
| `CORS_ORIGIN` | URL del frontend (paso 5), ej. `https://splitsnap-web-production.up.railway.app` |
| `STORAGE_DIR` | `/data/uploads` |
| `PIPELINE_MOCK` | `false` |
| `OCR_SPACE_API_KEY` | tu clave |
| `OPENROUTER_API_KEY` | tu clave |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash` |
| `OPENROUTER_HTTP_REFERER` | URL pública del frontend |
| `MAX_UPLOAD_MB` | `5` |

5. **Volume** (importante para fotos):
   - Servicio backend → **Settings** → **Volumes** → **Add Volume**
   - Mount path: `/data/uploads`

6. **Deploy** → el build usa `backend/railway.toml` (Prisma migrate + `npm start`)

7. Comprueba: `https://TU-DOMINIO-API/api/v1/health` → `"status":"healthy"`

---

## 5. Servicio Frontend (Web)

1. **+ New** → **GitHub Repo** → mismo repo
2. **Root Directory** → `frontend`
3. **Generate Domain** (ej. `splitsnap-web-production.up.railway.app`)
4. **Variables**:

| Variable | Valor |
|----------|--------|
| `VITE_API_BASE_URL` | `https://TU-DOMINIO-API/api/v1` (URL del paso 4) |

5. Redeploy del frontend después de definir la variable (Vite la embebe en el build)

6. Vuelve al **backend** y actualiza `CORS_ORIGIN` con la URL exacta del frontend → redeploy API

---

## 6. Probar en el celular

Abre en el navegador del móvil la URL del **frontend** Railway. Debe cargar tickets, grupos y participantes contra la API pública.

---

## 7. Desarrollo en casa (clonar)

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
npm install
cp backend/.env.example backend/.env   # claves locales
docker compose up -d mysql
npm run dev:backend
npm run dev:frontend
```

Cada cambio: `git push` → Railway redeploya automáticamente (si activaste deploy on push).

---

## Seguridad

- Repo **privado** en GitHub
- Claves **solo** en Variables de Railway, nunca en el repo
- Rota `OPENROUTER_API_KEY` si alguna vez se expuso en chat o commits
- `CORS_ORIGIN` = solo tu dominio frontend (no `*`)

---

## Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| API no arranca | Logs del servicio backend; `DATABASE_URL` referenciada al MySQL |
| CORS en el navegador | `CORS_ORIGIN` = URL exacta del frontend (con `https://`) |
| Fotos no se ven | Volume en `/data/uploads` + `STORAGE_DIR=/data/uploads` |
| Frontend no llega al API | `VITE_API_BASE_URL` correcta y **rebuild** del frontend |
| Migraciones | Logs: `prisma migrate deploy` en el start del backend |
| **Build failed** (API o Web) | **Root Directory**: `backend` / `frontend`. Build con `npm install --include=dev` (ver `railway.toml`). Logs en Deployments → deploy fallido |
