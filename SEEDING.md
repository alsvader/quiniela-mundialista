# Sembrar rondas del fixture (runbook)

Cómo agregar los partidos de una ronda nueva del Mundial 2026 y aplicar la
migración en local y en producción. La fase de grupos y las rondas de
eliminatoria ya sembradas siguen exactamente este patrón (ver migraciones
`0011`, `0015`, `0016`, `0017`). Reglas de comportamiento del seed:
`openspec/specs/data-seeding/spec.md`.

## Cómo funciona

Los seeds **no se escriben a mano**. Nacen de un snapshot del feed público y se
generan con un script:

```
scripts/data/fixture-raw.json  ──►  scripts/generate-fixture-seed.py  ──►  supabase/migrations/00NN_seed_*.sql
   (snapshot del feed)                (un bloque por ronda)                  (NO editar a mano)
```

`fixture-raw.json` trae **todas** las rondas desde el sorteo, con número FIFA,
hora y sede reales, pero con los equipos como `"To be announced"` hasta que el
cuadro los resuelve. Sembrar una ronda = resolver esos equipos y correr el
generador.

### Mapa ronda → fase → ids → migración

| `RoundNumber` (feed) | `phase` (enum) | ids FIFA | migración |
|---|---|---|---|
| 1–3 | `group_stage` | 1–72 | `0002_seed_fixture.sql` |
| 4 | `round_of_32` (dieciseisavos) | 73–88 | `0011_seed_dieciseisavos.sql` |
| 5 | `round_of_16` (octavos) | 89–96 | `0015_seed_octavos.sql` |
| 6 | `quarter_final` (cuartos) | 97–100 | `0016_seed_cuartos.sql` |
| 7 | `semi_final` (semifinales) | 101–102 | `0017_seed_semifinales.sql` |
| 8 | `third_place` + `final` | 103, 104 | *(pendiente)* |

> **Ojo con RoundNumber 8:** contiene **dos fases distintas** — 103 = tercer
> lugar (`third_place`), 104 = final (`final`). El bloque de ese round debe
> asignar la `phase` por `MatchNumber`, no una sola para todo el round. Es la
> única ronda que rompe el patrón "un RoundNumber = una fase".

## Reglas (invariantes del seed)

- **Fuente de verdad de los equipos:** `fixture-raw.json`. Reemplaza
  `"To be announced"` por el nombre del equipo **en inglés del feed** (p. ej.
  `France`, `Spain`). Ese nombre DEBE existir en el mapa `TEAMS` del generador,
  que lo traduce a es-MX y le asigna el código de bandera. Un nombre desconocido
  revienta con `KeyError` a propósito (no emitir seeds incompletos).
- **Orden home/away:** el `HomeTeam` es el primero listado en la fuente
  (`Francia vs. España` → home Francia).
- **`phase`:** valor del enum `public.match_phase` según el mapa de arriba.
- **`group_label` = NULL** siempre en eliminatoria (design D1).
- **`avanza` = NULL** al sembrar. El ganador se captura cuando el admin cierra
  el partido; en eliminatoria un partido no puede quedar finalizado sin
  `avanza` (constraint `matches_elim_finished_requires_avanza`, migración 0012).
- **ids = número de partido oficial FIFA**, insertados con
  `overriding system value`.
- **Secuencia intacta:** `0002` ya dejó la secuencia en 200; los seeds de ronda
  no la tocan.
- **Idempotencia:** `on conflict (id) do nothing`. Reaplicar es seguro.
- **Sedes:** se derivan del mapa `VENUES` — nombre comercial real + ciudad
  ancla (`Dallas Stadium` → `AT&T Stadium` / `Dallas`), **nunca** el nombre
  crudo del feed ni el literal de `matches.md`. Una ubicación sin entrada en
  `VENUES` revienta con `KeyError`.
- **Horarios:** `kickoff_at` se guarda en **UTC**; `match_date` es la **fecha
  local en America/Mexico_City**. México es **UTC−6 fijo** (sin horario de
  verano desde 2022), así que **1 p.m. CDMX = 19:00 UTC**. El generador hace la
  conversión; no la hagas a mano.
- **Nunca edites una migración generada a mano.** Cambia el JSON o el script y
  regenera.

## Procedimiento

### 1. Resolver los equipos en el JSON

En `scripts/data/fixture-raw.json`, para cada partido de la ronda, sustituye
`"HomeTeam":"To be announced","AwayTeam":"To be announced"` por los equipos
reales (nombres del feed en inglés). El JSON está minificado en una sola línea;
edita solo esos dos campos por partido.

### 2. Añadir el bloque de la ronda al generador

En `scripts/generate-fixture-seed.py`, replica el bloque de la ronda anterior
(busca `RoundNumber == 6` para cuartos como plantilla). Un bloque nuevo:

- filtra `[m for m in raw if m["RoundNumber"] == N]` y hace `assert` de la
  cantidad esperada de partidos,
- emite las filas con la `phase` correcta,
- escribe `supabase/migrations/00NN_seed_<ronda>.sql`.

Actualiza también el docstring (lista de salidas) y la línea `print(...)` del
resumen.

### 3. Generar y verificar que no hay drift

```bash
python3 scripts/generate-fixture-seed.py
git diff --stat -- supabase/migrations/
```

El script reescribe **todas** las migraciones de seed. El `git diff --stat`
DEBE mostrar cambios **solo** en la migración nueva; las anteriores quedan
byte-idénticas. Si alguna previa cambió, revierte y revisa qué tocaste de más.

### 4. Probar en local

Supabase local debe estar corriendo (`node_modules/.bin/supabase status`).

```bash
node_modules/.bin/supabase migration list --local     # confirma que la nueva está "pendiente"
node_modules/.bin/supabase migration up --local       # aplica solo la pendiente (no destructivo)
```

Verifica los renglones (ajusta los ids de la ronda):

```bash
docker exec supabase_db_quiniela-mundialista \
  psql "postgresql://postgres:postgres@127.0.0.1:5432/postgres" \
  -c "select id, phase, match_date,
        kickoff_at at time zone 'America/Mexico_City' as kickoff_cdmx,
        home_team, away_team, home_code, away_code, group_label, avanza, stadium, city
      from public.matches where id in (101,102) order by id;"
```

Confirma: `phase` correcta, `kickoff_cdmx` = la hora esperada (p. ej. 13:00 para
1 p.m.), `group_label`/`avanza` en NULL, sedes con naming es-MX.

### 5. Commit y merge (patrón de las rondas previas)

```bash
git checkout -b seed-<ronda>
git add scripts/data/fixture-raw.json scripts/generate-fixture-seed.py \
        supabase/migrations/00NN_seed_<ronda>.sql
git commit -m "Sembrar <ronda> (<phase>) tras la ronda anterior"
git checkout main
git merge --no-ff seed-<ronda> -m "Merge branch 'seed-<ronda>': Sembrar <ronda> (<phase>)"
git push origin main
```

> `matches.md` (raíz) es una nota de trabajo con la info de la ronda; **no se
> versiona** — déjalo fuera del commit.

## Aplicar la migración en producción

El push a prod usa `supabase db push`, que aplica al proyecto vinculado
(`rfgivkoycpkacitlmziq`).

**Credenciales:** vienen de `.env.prod.local`. Con un `SUPABASE_ACCESS_TOKEN`
válido, la CLI crea un login-role temporal vía API de gestión y **no necesita
contraseña de la DB**. Si el token está expirado/revocado verás
`401 Unauthorized` (y un fallback pidiendo `SUPABASE_DB_PASSWORD`): renuévalo en
https://supabase.com/dashboard/account/tokens y actualiza la línea del env.

```bash
# Cargar solo el access token (evita arrastrar un token viejo desde el entorno).
# El valor va sin comillas en .env.prod.local; si las tuviera, quítalas.
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.prod.local | cut -d= -f2-)"

# 0) Sanity: el token autentica y lista el proyecto de prod
node_modules/.bin/supabase projects list

# 1) Dry-run: confirma que SOLO se aplicaría la migración nueva
node_modules/.bin/supabase db push --linked --dry-run

# 2) Push real (pide confirmación Y/n)
node_modules/.bin/supabase db push --linked
```

**Verificar en prod** vía REST con la service role key (no expone la contraseña
de la DB; ajusta los ids):

```bash
set -a; . ./.env.prod.local; set +a
URL="$NEXT_PUBLIC_SUPABASE_URL"; case "$URL" in http*) ;; *) URL="https://$URL";; esac
curl -s "$URL/rest/v1/matches?id=in.(101,102)&select=id,phase,match_date,kickoff_at,home_team,away_team,group_label,avanza,stadium,city&order=id" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -m json.tool
```

> El `SUPABASE_SERVICE_ROLE_KEY` y el `SUPABASE_ACCESS_TOKEN` son secretos: no
> los imprimas ni los pegues en commits/PRs. `.env.prod.local` no se versiona.
