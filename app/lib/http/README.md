# HttpClient

Cliente HTTP único para todas las requests de la web hacia el API. Usa `fetch`, adjunta el token en cada request y lo renueva automáticamente cuando vence.

## Configuración

Variables de entorno (ver `.env.example`):

| Variable | Valores | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del API, incluyendo prefijo (ej. `/api/v1`) | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_TOKEN_STORAGE` | `localStorage` \| `cookie` | `localStorage` |
| `NEXT_PUBLIC_REFRESH_PATH` | Endpoint de refresh | `/auth/refresh` |
| `NEXT_PUBLIC_AUTH_PATH` | Endpoint de login | `/auth/sign-in` |
| `NEXT_PUBLIC_SIGN_OUT_PATH` | Endpoint de logout | `/auth/sign-out` |

Las rutas se concatenan a `NEXT_PUBLIC_API_URL` (se conserva el prefijo, p. ej. `http://localhost:3001/api/v1/auth/sign-in`). Las variables `NEXT_PUBLIC_*` se leen al arrancar: reinicia `npm run dev` tras cambiarlas.

### Origen del token

- **`localStorage`**: el access token se guarda en localStorage y se envía en el header `Authorization: Bearer <token>`.
- **`cookie`**: el token es una cookie httpOnly. JS no puede leerla, así que no se envía el header; el navegador la manda sola (`credentials: 'include'`). El backend debe habilitar CORS con credenciales (o usar un proxy con `rewrites` en `next.config.ts`).

## Uso

```ts
import { http } from '@/app/lib/http';

const users = await http.get<User[]>('/users', { query: { page: 1 } });
const created = await http.post<User>('/users', { name: 'Ana' });
await http.put(`/users/${id}`, data);
await http.patch(`/users/${id}`, partial);
await http.delete(`/users/${id}`);
```

Recomendado: crear servicios por dominio en `app/lib/api/` (ver `auth.ts`) y que los componentes los consuman, sin usar `fetch` directo.

### Usuarios

El servicio `app/lib/api/users.ts` usa el contrato de `/users` y devuelve los datos ya extraídos de su envelope:

```ts
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from '@/app/lib/api/users';

const { data, meta } = await getUsers({ page: 1, limit: 10 });
const user = await getUser(1);
const created = await createUser({
  name: 'Ana',
  email: 'ana@example.com',
  password: 'secret123',
  phone: '809-555-0101',
  role: 'admin',
  status: 'active',
});
await updateUser(user.id, { name: 'Ana Pérez', status: 'inactive' });
await deleteUser(user.id);
```

La creación requiere contraseña; las operaciones de edición no la envían. Las operaciones no exitosas lanzan `HttpError`, igual que el resto del cliente HTTP.

### Opciones por request

- `query`: parámetros de query string (se omiten `undefined`/`null`).
- `body`: objeto (se serializa a JSON) o `FormData`.
- `skipAuth: true`: no adjunta token ni intenta refresh (login, refresh).
- Cualquier opción de `fetch` (`headers`, `signal`, etc.).

### Errores

Las respuestas no exitosas lanzan `HttpError` con `status` y `body`:

```ts
import { HttpError } from '@/app/lib/http';

try {
  await http.get('/users');
} catch (e) {
  if (e instanceof HttpError && e.status === 403) { /* ... */ }
}
```

## Renovación del token

1. Si una request responde `401` (y no usa `skipAuth`), se hace `POST /auth/refresh` sin body. El refresh token viaja en una cookie httpOnly y el API responde `{ "accessToken": "..." }`.
2. Se guarda el nuevo token y se reintenta la request original una sola vez.
3. Varias requests simultáneas con 401 comparten un único refresh.
4. Si el refresh falla, se limpia el token y se redirige a `/sign-in`.

## Login / logout

```ts
import { login, logout } from '@/app/lib/api/auth';

await login(email, password); // POST NEXT_PUBLIC_AUTH_PATH {email, password} (skipAuth); guarda el token si la respuesta trae accessToken
await logout();               // POST NEXT_PUBLIC_SIGN_OUT_PATH y limpia el token
```

El contrato del login (`{ email, password }`) y del logout es una suposición; ajústalo en `app/lib/api/auth.ts` según el API.

## Personalización

Crear otra instancia (por ejemplo para otro API o para pruebas):

```ts
import { createHttpClient, localStorageTokenStorage } from '@/app/lib/http';

const other = createHttpClient({
  baseUrl: 'https://otro.api',
  storage: localStorageTokenStorage,
  refreshPath: '/auth/refresh',
  onAuthFailure: () => {},
});
```

Para otro mecanismo de almacenamiento, implementar la interfaz `TokenStorage` (`get`, `set`, `clear`, `exposesToken`).

## CORS: proxy de Next

Si el API responde `Access-Control-Allow-Origin: *`, el navegador bloquea las requests con credenciales (modo `cookie`). Opciones:

1. **Proxy de Next (sin tocar el backend)**: en `.env` usar
   ```
   NEXT_PUBLIC_API_URL=/api/v1
   API_PROXY_TARGET=http://localhost:3001
   ```
   `next.config.ts` reenvía `/api/v1/*` al API, de modo que el navegador solo habla con su propio origen y la cookie httpOnly queda en ese origen. Reiniciar `npm run dev` al cambiar.
2. **Configurar CORS en el backend**: origen explícito (p. ej. `http://localhost:3000`, no `*`) y `Access-Control-Allow-Credentials: true`.

Nota: en API_PROXY_TARGET no uses IPv6 con corchetes ([::1]): Next lo interpreta como parámetro de ruta y responde 500 (Missing parameter name). Usa 127.0.0.1 o localhost.

## Rutas privadas

proxy.ts redirige a /sign-in?next=<ruta> si no hay cookie de sesión (modo cookie). Configura en AUTH_COOKIE_NAMES los nombres reales de las cookies del API (Authentication,Refresh). En modo localStorage la guarda la hace el layout privado en el cliente.
