# {{name}}

(One line: what this is and who it's for.)

## Run it
```sh
{{install}}
{{#dotenv}}
cp .env.example .env   # then fill it in
{{/dotenv}}
{{#postgres}}
docker compose up -d   # local Postgres
{{run}} db:migrate
{{/postgres}}
{{#d1}}
{{run}} db:migrate
{{/d1}}
{{run}} dev   # http://localhost:3000
```

## Read next
- `PROJECT.md`: what this project is, its features and decisions
- `AGENTS.md`: how coding agents (and humans) work here
- `docs/DEPLOYMENT.md` · `docs/RUNBOOK.md`: shipping and fixing production
