{
  description = "SaaS Boilerplate — monorepo dev shell, production package, NixOS module, and clan.lol integration.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    clan-core = {
      url = "https://git.clan.lol/clan/clan-core/archive/main.tar.gz";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, clan-core, ... }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      forEachSystem = nixpkgs.lib.genAttrs systems;

      machinesDir = ./machines;
      machineNames =
        if builtins.pathExists machinesDir then
          builtins.attrNames
            (nixpkgs.lib.filterAttrs (_: t: t == "directory") (builtins.readDir machinesDir))
        else [ ];

      clan = clan-core.lib.buildClan {
        inherit self;
        meta.name = "saas-boilerplate";
        machines = nixpkgs.lib.genAttrs machineNames (name: {
          imports = [
            self.nixosModules.default
            (machinesDir + "/${name}/configuration.nix")
          ];
        });
      };
    in
    {
      devShells = forEachSystem (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          pgPort = "5432";
          dbName = "tanstack_start_dev";
          dbUser = "tanstack";
          dbPass = "tanstack";
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              corepack_22
              postgresql_17
              clan-core.packages.${system}.clan-cli
            ];

            DATABASE_URL = "postgresql://${dbUser}:${dbPass}@127.0.0.1:${pgPort}/${dbName}";

            shellHook = ''
              # ── silence noisy warnings ────────────────────────────────────────
              export NIX_SHELL_PRESERVE_PROMPT=1
              export PNPM_SCRIPT_SHELL_MODE=quiet
              export NO_UPDATE_NOTIFIER=1
              export DISABLE_OPENCOLLECTIVE=1
              export ADBLOCK=1

              # ── postgres env ──────────────────────────────────────────────────
              export PGPORT="${pgPort}"
              export PGDATA="$HOME/.postgres-saas"
              export PGHOST="127.0.0.1"
              export PGLOGFILE="$PGDATA/logfile"

              if [ ! -d "$PGDATA" ]; then
                initdb -D "$PGDATA" --no-locale --encoding=UTF8 -A trust \
                  --username=postgres -q 2>/dev/null
                echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
                echo "port = ${pgPort}"               >> "$PGDATA/postgresql.conf"
              fi

              if ! pg_isready -q -h 127.0.0.1 -p ${pgPort} 2>/dev/null; then
                pg_ctl -D "$PGDATA" -l "$PGLOGFILE" start -w \
                  -o "-p ${pgPort}" -o "-h 127.0.0.1" \
                  -s 2>/dev/null
              fi

              psql -h 127.0.0.1 -p ${pgPort} -d postgres -tc \
                "SELECT 1 FROM pg_roles WHERE rolname='${dbUser}'" 2>/dev/null \
                | grep -q 1 || \
                psql -h 127.0.0.1 -p ${pgPort} -d postgres \
                  -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}' CREATEDB;" \
                  >/dev/null 2>&1

              psql -h 127.0.0.1 -p ${pgPort} -d postgres -tc \
                "SELECT 1 FROM pg_database WHERE datname='${dbName}'" 2>/dev/null \
                | grep -q 1 || \
                psql -h 127.0.0.1 -p ${pgPort} -d postgres \
                  -c "CREATE DATABASE ${dbName} OWNER ${dbUser};" \
                  >/dev/null 2>&1

              export DATABASE_URL="postgresql://${dbUser}:${dbPass}@127.0.0.1:${pgPort}/${dbName}"

              _node_ver=$(node --version 2>/dev/null || echo "n/a")
              _pnpm_ver=$(pnpm --version 2>/dev/null | sed 's/^/v/' || echo "n/a")
              _pg_ver=$(psql --version 2>/dev/null | awk '{print $NF}' | sed 's/^/v/' || echo "n/a")
              _clan_ver=$(clan --version 2>/dev/null | awk '{print $NF}' | sed 's/^/v/' || echo "n/a")
              _git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "n/a")
              _pkg_ver=$(node -p "require('./package.json').version" 2>/dev/null || echo "n/a")

              printf '\033[2J\033[H'
              printf '\033[1;36m'
              printf '╔══════════════════════════════════════════════════════╗\n'
              printf '║          ⚡  SaaS Boilerplate  — Dev Shell  ⚡       ║\n'
              printf '╚══════════════════════════════════════════════════════╝\n'
              printf '\033[0m'

              printf '\n\033[1;33m  Welcome back! Environment is ready.\033[0m\n\n'

              printf '\033[1;34m  ┌─ Stats ──────────────────────────────────────────┐\033[0m\n'
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Project version" "v$_pkg_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Git branch"      "$_git_branch"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Node.js"         "$_node_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "pnpm"            "$_pnpm_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "PostgreSQL"      "$_pg_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "clan-cli"        "$_clan_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "DB"              "${dbName}@127.0.0.1:${pgPort}"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "DB status"       "✓ running"
              printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n'

              printf '\n\033[1;34m  ┌─ Commands ────────────────────────────────────────┐\033[0m\n'
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm dev"          "web + api (moon)"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm dev:web"       "web only (port 3000)"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm dev:api"       "api only (port 3001)"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm build"         "production build"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:migrate"    "run DB migrations"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:studio"     "open Drizzle Studio"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:seed"       "seed the database"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm storybook"     "Storybook (port 6006)"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "clan machines list" "list clan machines"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "clan machines update <m>" "deploy a machine"
              printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n\n'

              unset _node_ver _pnpm_ver _pg_ver _clan_ver _git_branch _pkg_ver
            '';
          };
        });

      packages = forEachSystem (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "saas-boilerplate";
            version = "0.5.1";

            src = pkgs.lib.fileset.toSource {
              root = ./.;
              fileset = pkgs.lib.fileset.unions [
                ./apps
                ./package.json
                ./pnpm-lock.yaml
                ./pnpm-workspace.yaml
                ./tsconfig.base.json
              ];
            };

            nativeBuildInputs = [
              pkgs.nodejs_22
              pkgs.pnpmConfigHook
              pkgs.esbuild
            ];

            pnpmDeps = pkgs.pnpm.fetchDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 3;
              hash = pkgs.lib.fakeHash;
            };

            buildPhase = ''
              runHook preBuild

              # Web → apps/web/dist (static SPA)
              pnpm --filter @saas/web run build

              # API → apps/api/dist/main.mjs (single bundle, external node_modules)
              mkdir -p apps/api/dist
              esbuild apps/api/src/main.ts \
                --bundle \
                --platform=node \
                --target=node22 \
                --format=esm \
                --packages=external \
                --outfile=apps/api/dist/main.mjs

              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall

              appDir="$out/lib/saas-boilerplate"
              mkdir -p "$appDir" "$out/bin"

              # Self-contained production deploy for the api workspace package.
              # `pnpm deploy --prod` produces a directory with a flat node_modules
              # containing only @saas/api's production dependencies.
              pnpm deploy --filter=@saas/api --prod --ignore-scripts --legacy "$appDir/api"

              # Replace the shipped TS source with the esbuild'd bundle so we can
              # run plain `node main.mjs` — no tsx required at runtime.
              rm -rf "$appDir/api/src"
              cp apps/api/dist/main.mjs "$appDir/api/main.mjs"

              # Drizzle migrations travel with the api.
              cp -r apps/api/drizzle "$appDir/api/drizzle"

              # Web static assets, served by Hono via WEB_DIST_PATH.
              mkdir -p "$appDir/web"
              cp -r apps/web/dist/. "$appDir/web/"

              # Entry point: run api, default WEB_DIST_PATH to shipped assets
              # (systemd or caller can override).
              cat > "$out/bin/saas-boilerplate" <<EOF
              #!/bin/sh
              set -e
              : "\''${WEB_DIST_PATH:=$appDir/web}"
              export WEB_DIST_PATH
              cd "$appDir/api"
              exec ${pkgs.nodejs_22}/bin/node main.mjs "\$@"
              EOF
              chmod +x "$out/bin/saas-boilerplate"

              runHook postInstall
            '';

            meta = {
              description = "SaaS Boilerplate — Hono api + TanStack Router SPA, single binary.";
              mainProgram = "saas-boilerplate";
            };
          });
        });

      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.saas-boilerplate;
          pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        in
        {
          options.services.saas-boilerplate = {
            enable = lib.mkEnableOption "saas-boilerplate service";

            port = lib.mkOption {
              type = lib.types.int;
              default = 3000;
              description = "Port the app listens on.";
            };

            host = lib.mkOption {
              type = lib.types.str;
              default = "127.0.0.1";
              description = "Host the app binds to.";
            };

            databaseUrl = lib.mkOption {
              type = lib.types.str;
              default = "postgresql://saas_boilerplate@localhost/saas_boilerplate?host=/run/postgresql";
              description = "PostgreSQL connection URL.";
            };

            redisUrl = lib.mkOption {
              type = lib.types.str;
              default = "redis://127.0.0.1:6380";
              description = "Redis connection URL.";
            };

            environmentFile = lib.mkOption {
              type = lib.types.nullOr lib.types.path;
              default = null;
              description = ''
                Path to a file containing secret env vars — at minimum
                BETTER_AUTH_SECRET, optionally GOOGLE_CLIENT_ID and
                GOOGLE_CLIENT_SECRET. Point this at a clan var / sops / agenix
                secret. If null, no EnvironmentFile is applied and secrets must
                be provided by some other means (e.g. systemd.services.*.environment).
              '';
            };

            nginx = {
              enable = lib.mkOption {
                type = lib.types.bool;
                default = false;
                description = "Whether to configure an nginx virtual host.";
              };

              domain = lib.mkOption {
                type = lib.types.str;
                default = "app.msdqn.dev";
                description = "Public domain name for the nginx virtual host.";
              };

              enableSSL = lib.mkOption {
                type = lib.types.bool;
                default = true;
                description = "Enable ACME/Let's Encrypt SSL.";
              };

              acmeEmail = lib.mkOption {
                type = lib.types.str;
                default = "";
                description = "Email for ACME certificate registration.";
              };
            };
          };

          config = lib.mkIf cfg.enable {
            services.postgresql = {
              enable = true;
              ensureDatabases = [ "saas_boilerplate" ];
              ensureUsers = [{
                name = "saas_boilerplate";
                ensureDBOwnership = true;
              }];
            };

            services.redis.servers.saas-boilerplate = {
              enable = true;
              port = 6380;
            };

            systemd.services.saas-boilerplate = {
              description = "SaaS Boilerplate";
              wantedBy = [ "multi-user.target" ];
              after = [ "network.target" "postgresql.service" "redis-saas-boilerplate.service" ];
              requires = [ "postgresql.service" ];

              environment = {
                HOST = cfg.host;
                PORT = toString cfg.port;
                DATABASE_URL = cfg.databaseUrl;
                REDIS_URL = cfg.redisUrl;
                WEB_ORIGIN =
                  if cfg.nginx.enable
                  then "https://${cfg.nginx.domain}"
                  else "http://${cfg.host}:${toString cfg.port}";
                BETTER_AUTH_URL =
                  if cfg.nginx.enable
                  then "https://${cfg.nginx.domain}"
                  else "http://${cfg.host}:${toString cfg.port}";
                WEB_DIST_PATH = "${pkg}/lib/saas-boilerplate/web";
                NODE_ENV = "production";
              };

              serviceConfig = {
                ExecStart = lib.getExe pkg;
                DynamicUser = true;
                NoNewPrivileges = true;
                ProtectSystem = "strict";
                ProtectHome = true;
                PrivateTmp = true;
                StateDirectory = "saas-boilerplate";
                Restart = "on-failure";
                RestartSec = "5s";
              } // lib.optionalAttrs (cfg.environmentFile != null) {
                EnvironmentFile = cfg.environmentFile;
              };
            };

            services.nginx = lib.mkIf cfg.nginx.enable {
              enable = true;
              recommendedProxySettings = true;
              recommendedGzipSettings = true;
              virtualHosts.${cfg.nginx.domain} = {
                locations."/" = {
                  proxyPass = "http://${cfg.host}:${toString cfg.port}";
                  proxyWebsockets = true;
                };
              } // lib.optionalAttrs cfg.nginx.enableSSL {
                forceSSL = true;
                enableACME = true;
              };
            };

            security.acme = lib.mkIf (cfg.nginx.enable && cfg.nginx.enableSSL && cfg.nginx.acmeEmail != "") {
              acceptTerms = true;
              defaults.email = cfg.nginx.acmeEmail;
            };
          };
        };

      inherit (clan) nixosConfigurations;
      clan = clan.clanInternals;
    };
}
