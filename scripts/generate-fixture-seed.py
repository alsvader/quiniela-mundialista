#!/usr/bin/env python3
"""Genera supabase/migrations/0002_seed_fixture.sql desde scripts/data/fixture-raw.json.

El JSON es un snapshot del feed público https://fixturedownload.com/feed/json/fifa-world-cup-2026
(sorteo oficial del 5-dic-2025, repechajes de marzo 2026 resueltos). Solo fase de grupos.
Los ids preservan el número de partido oficial FIFA (1-72).
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

MX = ZoneInfo("America/Mexico_City")
ROOT = Path(__file__).resolve().parent.parent

ES_NAMES = {
    "Algeria": "Argelia",
    "Argentina": "Argentina",
    "Australia": "Australia",
    "Austria": "Austria",
    "Belgium": "Bélgica",
    "Bosnia and Herzegovina": "Bosnia y Herzegovina",
    "Brazil": "Brasil",
    "Cabo Verde": "Cabo Verde",
    "Canada": "Canadá",
    "Colombia": "Colombia",
    "Congo DR": "RD del Congo",
    "Croatia": "Croacia",
    "Curaçao": "Curazao",
    "Czechia": "Chequia",
    "Côte d'Ivoire": "Costa de Marfil",
    "Ecuador": "Ecuador",
    "Egypt": "Egipto",
    "England": "Inglaterra",
    "France": "Francia",
    "Germany": "Alemania",
    "Ghana": "Ghana",
    "Haiti": "Haití",
    "IR Iran": "Irán",
    "Iraq": "Irak",
    "Japan": "Japón",
    "Jordan": "Jordania",
    "Korea Republic": "Corea del Sur",
    "Mexico": "México",
    "Morocco": "Marruecos",
    "Netherlands": "Países Bajos",
    "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega",
    "Panama": "Panamá",
    "Paraguay": "Paraguay",
    "Portugal": "Portugal",
    "Qatar": "Catar",
    "Saudi Arabia": "Arabia Saudita",
    "Scotland": "Escocia",
    "Senegal": "Senegal",
    "South Africa": "Sudáfrica",
    "Spain": "España",
    "Sweden": "Suecia",
    "Switzerland": "Suiza",
    "Tunisia": "Túnez",
    "Türkiye": "Turquía",
    "USA": "Estados Unidos",
    "Uruguay": "Uruguay",
    "Uzbekistan": "Uzbekistán",
}


def sql_quote(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    raw = json.loads((ROOT / "scripts/data/fixture-raw.json").read_text())
    group_matches = [m for m in raw if m["Group"]]
    assert len(group_matches) == 72, f"esperaba 72 partidos, hay {len(group_matches)}"

    rows = []
    for m in sorted(group_matches, key=lambda x: x["MatchNumber"]):
        kickoff = datetime.strptime(m["DateUtc"], "%Y-%m-%d %H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
        match_date = kickoff.astimezone(MX).date()  # fecha de jornada en CDMX
        home = ES_NAMES[m["HomeTeam"]]
        away = ES_NAMES[m["AwayTeam"]]
        group = m["Group"].removeprefix("Group ")
        rows.append(
            f"  ({m['MatchNumber']}, 'group_stage', '{match_date}', "
            f"'{kickoff.strftime('%Y-%m-%d %H:%M:%S+00')}', "
            f"{sql_quote(home)}, {sql_quote(away)}, '{group}')"
        )

    out = ROOT / "supabase/migrations/0002_seed_fixture.sql"
    out.write_text(
        "-- Fixture oficial: 72 partidos de fase de grupos, Mundial 2026.\n"
        "-- Generado por scripts/generate-fixture-seed.py; NO editar a mano.\n"
        "-- id = número de partido oficial FIFA. match_date = fecha en America/Mexico_City.\n\n"
        "insert into public.matches\n"
        "  (id, phase, match_date, kickoff_at, home_team, away_team, group_label)\n"
        "overriding system value\nvalues\n" + ",\n".join(rows) + "\n"
        "on conflict (id) do nothing;\n\n"
        "-- deja la secuencia libre para partidos creados por el admin (eliminatorias V2)\n"
        "select setval(pg_get_serial_sequence('public.matches', 'id'), 200);\n"
    )
    print(f"OK: {out} ({len(rows)} partidos)")


if __name__ == "__main__":
    main()
