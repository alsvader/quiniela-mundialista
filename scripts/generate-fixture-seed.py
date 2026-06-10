#!/usr/bin/env python3
"""Genera supabase/migrations/0002_seed_fixture.sql desde scripts/data/fixture-raw.json.

El JSON es un snapshot del feed público https://fixturedownload.com/feed/json/fifa-world-cup-2026
(sorteo oficial del 5-dic-2025, repechajes de marzo 2026 resueltos). Solo fase de grupos.
Los ids preservan el número de partido oficial FIFA (1-72).

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
        home, home_code = TEAMS[m["HomeTeam"]]
        away, away_code = TEAMS[m["AwayTeam"]]
        group = m["Group"].removeprefix("Group ")
        rows.append(
            f"  ({m['MatchNumber']}, 'group_stage', '{match_date}', "
            f"'{kickoff.strftime('%Y-%m-%d %H:%M:%S+00')}', "
            f"{sql_quote(home)}, {sql_quote(away)}, "
            f"'{home_code}', '{away_code}', '{group}')"
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
    flags = sorted({code for _, code in TEAMS.values()})
    print(f"OK: {out} ({len(rows)} partidos, {len(flags)} banderas)")
    print(" ".join(flags))


if __name__ == "__main__":
    main()
