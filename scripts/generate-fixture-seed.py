#!/usr/bin/env python3
"""Genera las migraciones de seed del fixture desde scripts/data/fixture-raw.json.

El JSON es un snapshot del feed público https://fixturedownload.com/feed/json/fifa-world-cup-2026
(sorteo oficial del 5-dic-2025, repechajes de marzo 2026 resueltos). Cubre la fase de
grupos (ids 1-72) y los dieciseisavos de final (round_of_32, ids 73-88, resueltos con
los equipos reales tras la fase de grupos).

Salidas (NO editar a mano):
  - 0002_seed_fixture.sql        72 partidos de fase de grupos
  - 0008_estadio_ciudad.sql      columnas estadio/ciudad + backfill de los 72 de grupos
  - 0011_seed_dieciseisavos.sql  16 partidos de dieciseisavos (round_of_32)

Cada equipo lleva (nombre es-MX, código de bandera ISO 3166-1 alfa-2 o regional
para naciones constituyentes — design.md D10). Los SVG viven en public/flags/.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

MX = ZoneInfo("America/Mexico_City")
ROOT = Path(__file__).resolve().parent.parent

# Nombre del feed → (nombre es-MX, código de bandera)
TEAMS = {
    "Algeria": ("Argelia", "dz"),
    "Argentina": ("Argentina", "ar"),
    "Australia": ("Australia", "au"),
    "Austria": ("Austria", "at"),
    "Belgium": ("Bélgica", "be"),
    "Bosnia and Herzegovina": ("Bosnia y Herzegovina", "ba"),
    "Brazil": ("Brasil", "br"),
    "Cabo Verde": ("Cabo Verde", "cv"),
    "Canada": ("Canadá", "ca"),
    "Colombia": ("Colombia", "co"),
    "Congo DR": ("RD del Congo", "cd"),
    "Croatia": ("Croacia", "hr"),
    "Curaçao": ("Curazao", "cw"),
    "Czechia": ("Chequia", "cz"),
    "Côte d'Ivoire": ("Costa de Marfil", "ci"),
    "Ecuador": ("Ecuador", "ec"),
    "Egypt": ("Egipto", "eg"),
    "England": ("Inglaterra", "gb-eng"),
    "France": ("Francia", "fr"),
    "Germany": ("Alemania", "de"),
    "Ghana": ("Ghana", "gh"),
    "Haiti": ("Haití", "ht"),
    "IR Iran": ("Irán", "ir"),
    "Iraq": ("Irak", "iq"),
    "Japan": ("Japón", "jp"),
    "Jordan": ("Jordania", "jo"),
    "Korea Republic": ("Corea del Sur", "kr"),
    "Mexico": ("México", "mx"),
    "Morocco": ("Marruecos", "ma"),
    "Netherlands": ("Países Bajos", "nl"),
    "New Zealand": ("Nueva Zelanda", "nz"),
    "Norway": ("Noruega", "no"),
    "Panama": ("Panamá", "pa"),
    "Paraguay": ("Paraguay", "py"),
    "Portugal": ("Portugal", "pt"),
    "Qatar": ("Catar", "qa"),
    "Saudi Arabia": ("Arabia Saudita", "sa"),
    "Scotland": ("Escocia", "gb-sct"),
    "Senegal": ("Senegal", "sn"),
    "South Africa": ("Sudáfrica", "za"),
    "Spain": ("España", "es"),
    "Sweden": ("Suecia", "se"),
    "Switzerland": ("Suiza", "ch"),
    "Tunisia": ("Túnez", "tn"),
    "Türkiye": ("Turquía", "tr"),
    "USA": ("Estados Unidos", "us"),
    "Uruguay": ("Uruguay", "uy"),
    "Uzbekistan": ("Uzbekistán", "uz"),
}

# Location del feed (nombre FIFA neutro) → (estadio es-MX, ciudad es-MX).
# Criterio coloquial aprobado (spec data-seeding): Azteca/Akron/BBVA en México,
# nombres comerciales reales en EE. UU./Canadá, ciudad ancla simplificada.
VENUES = {
    "Mexico City Stadium": ("Estadio Azteca", "Ciudad de México"),
    "Guadalajara Stadium": ("Estadio Akron", "Guadalajara"),
    "Monterrey Stadium": ("Estadio BBVA", "Monterrey"),
    "Atlanta Stadium": ("Mercedes-Benz Stadium", "Atlanta"),
    "Boston Stadium": ("Gillette Stadium", "Boston"),
    "Dallas Stadium": ("AT&T Stadium", "Dallas"),
    "Houston Stadium": ("NRG Stadium", "Houston"),
    "Kansas City Stadium": ("Arrowhead Stadium", "Kansas City"),
    "Los Angeles Stadium": ("SoFi Stadium", "Los Ángeles"),
    "Miami Stadium": ("Hard Rock Stadium", "Miami"),
    "New York/New Jersey Stadium": ("MetLife Stadium", "Nueva York"),
    "Philadelphia Stadium": ("Lincoln Financial Field", "Filadelfia"),
    "San Francisco Bay Area Stadium": ("Levi's Stadium", "San Francisco"),
    "Seattle Stadium": ("Lumen Field", "Seattle"),
    "BC Place Vancouver": ("BC Place", "Vancouver"),
    "Toronto Stadium": ("BMO Field", "Toronto"),
}


def sql_quote(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    raw = json.loads((ROOT / "scripts/data/fixture-raw.json").read_text())
    group_matches = [m for m in raw if m["Group"]]
    assert len(group_matches) == 72, f"esperaba 72 partidos, hay {len(group_matches)}"

    rows = []
    venue_rows = []
    for m in sorted(group_matches, key=lambda x: x["MatchNumber"]):
        kickoff = datetime.strptime(m["DateUtc"], "%Y-%m-%d %H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
        match_date = kickoff.astimezone(MX).date()  # fecha de jornada en CDMX
        home, home_code = TEAMS[m["HomeTeam"]]
        away, away_code = TEAMS[m["AwayTeam"]]
        group = m["Group"].removeprefix("Group ")
        # KeyError ruidoso a propósito: una Location desconocida del feed no
        # debe emitir seeds con sedes faltantes (spec data-seeding)
        stadium, city = VENUES[m["Location"]]
        rows.append(
            f"  ({m['MatchNumber']}, 'group_stage', '{match_date}', "
            f"'{kickoff.strftime('%Y-%m-%d %H:%M:%S+00')}', "
            f"{sql_quote(home)}, {sql_quote(away)}, "
            f"'{home_code}', '{away_code}', '{group}')"
        )
        venue_rows.append(
            f"    ({m['MatchNumber']}, {sql_quote(stadium)}, {sql_quote(city)})"
        )

    out = ROOT / "supabase/migrations/0002_seed_fixture.sql"
    out.write_text(
        "-- Fixture oficial: 72 partidos de fase de grupos, Mundial 2026.\n"
        "-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.\n"
        "-- id = número de partido oficial FIFA. match_date = fecha en America/Mexico_City.\n\n"
        "insert into public.matches\n"
        "  (id, phase, match_date, kickoff_at, home_team, away_team,\n"
        "   home_code, away_code, group_label)\n"
        "overriding system value\nvalues\n" + ",\n".join(rows) + "\n"
        "on conflict (id) do nothing;\n\n"
        "-- deja la secuencia libre para partidos creados por el admin (eliminatorias V2)\n"
        "select setval(pg_get_serial_sequence('public.matches', 'id'), 200);\n"
    )

    # Sedes en migración propia (columnas + backfill): corre después del seed,
    # idéntica en entornos frescos y en producción. Generada aquí para que el
    # naming es-MX viva en un solo lugar (design D2).
    backfill = ROOT / "supabase/migrations/0008_estadio_ciudad.sql"
    backfill.write_text(
        "-- Estadio y ciudad de cada partido (change estadio-ciudad, specs\n"
        "-- match-schedule, data-seeding, admin-panel). Generado por\n"
        "-- scripts/generate-fixture-seed.py; NO editar a mano. Columnas nullable\n"
        "-- (partidos por definir V2) + backfill de los 72 partidos sembrados,\n"
        "-- keyed por id oficial FIFA. Naming es-MX aprobado (VENUES).\n\n"
        "alter table public.matches\n"
        "  add column if not exists stadium text,\n"
        "  add column if not exists city text;\n\n"
        "update public.matches m\n"
        "  set stadium = v.stadium, city = v.city\n"
        "  from (values\n" + ",\n".join(venue_rows) + "\n"
        "  ) as v(id, stadium, city)\n"
        "  where m.id = v.id;\n"
    )

    # Dieciseisavos de final (round_of_32): los 16 partidos con RoundNumber 4.
    # group_label NULL (eliminatoria, design D1). Estadio/ciudad inline: las
    # columnas ya existen tras 0008, así que no hace falta backfill aparte.
    r32_matches = [m for m in raw if m["RoundNumber"] == 4]
    assert len(r32_matches) == 16, f"esperaba 16 dieciseisavos, hay {len(r32_matches)}"

    r32_rows = []
    for m in sorted(r32_matches, key=lambda x: x["MatchNumber"]):
        kickoff = datetime.strptime(m["DateUtc"], "%Y-%m-%d %H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
        match_date = kickoff.astimezone(MX).date()
        # KeyError ruidoso a propósito: un placeholder sin resolver ("1A", "3ABCDF")
        # o un equipo desconocido no debe emitir un seed silenciosamente incompleto.
        home, home_code = TEAMS[m["HomeTeam"]]
        away, away_code = TEAMS[m["AwayTeam"]]
        stadium, city = VENUES[m["Location"]]
        r32_rows.append(
            f"  ({m['MatchNumber']}, 'round_of_32', '{match_date}', "
            f"'{kickoff.strftime('%Y-%m-%d %H:%M:%S+00')}', "
            f"{sql_quote(home)}, {sql_quote(away)}, "
            f"'{home_code}', '{away_code}', null, "
            f"{sql_quote(stadium)}, {sql_quote(city)})"
        )

    r32_out = ROOT / "supabase/migrations/0011_seed_dieciseisavos.sql"
    r32_out.write_text(
        "-- Dieciseisavos de final (round_of_32): 16 partidos, Mundial 2026.\n"
        "-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.\n"
        "-- id = número de partido oficial FIFA (73-88). group_label NULL (eliminatoria,\n"
        "-- design D1). match_date = fecha en America/Mexico_City. Estadio/ciudad inline\n"
        "-- (columnas ya existen tras 0008). Equipos resueltos del cuadro tras la fase\n"
        "-- de grupos. No toca la secuencia: 0002 ya la dejó en 200.\n\n"
        "insert into public.matches\n"
        "  (id, phase, match_date, kickoff_at, home_team, away_team,\n"
        "   home_code, away_code, group_label, stadium, city)\n"
        "overriding system value\nvalues\n" + ",\n".join(r32_rows) + "\n"
        "on conflict (id) do nothing;\n"
    )

    flags = sorted({code for _, code in TEAMS.values()})
    venues = sorted({v for v in VENUES.values()})
    print(f"OK: {out} ({len(rows)} partidos, {len(flags)} banderas, {len(venues)} sedes)")
    print(f"OK: {backfill} (backfill de {len(venue_rows)} filas)")
    print(f"OK: {r32_out} ({len(r32_rows)} dieciseisavos)")
    print(" ".join(flags))


if __name__ == "__main__":
    main()
