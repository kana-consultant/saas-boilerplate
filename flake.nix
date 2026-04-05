{
  description = "SaaS Boilerplate — dev environment with PostgreSQL";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in {
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

              # Init data dir if needed (silent)
              if [ ! -d "$PGDATA" ]; then
                initdb -D "$PGDATA" --no-locale --encoding=UTF8 -A trust \
                  --username=postgres -q 2>/dev/null
                echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
                echo "port = ${pgPort}"               >> "$PGDATA/postgresql.conf"
              fi

              # Start postgres if not already running (silent)
              if ! pg_isready -q -h 127.0.0.1 -p ${pgPort} 2>/dev/null; then
                pg_ctl -D "$PGDATA" -l "$PGLOGFILE" start -w \
                  -o "-p ${pgPort}" -o "-h 127.0.0.1" \
                  -s 2>/dev/null
              fi

              # Ensure role and database exist (silent)
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

              # ── collect stats ─────────────────────────────────────────────────
              _node_ver=$(node --version 2>/dev/null || echo "n/a")
              _pnpm_ver=$(pnpm --version 2>/dev/null | sed 's/^/v/' || echo "n/a")
              _pg_ver=$(psql --version 2>/dev/null | awk '{print $NF}' | sed 's/^/v/' || echo "n/a")
              _git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "n/a")
              _pkg_ver=$(node -p "require('./package.json').version" 2>/dev/null || echo "n/a")

              # ── welcome banner ────────────────────────────────────────────────
              printf '\033[2J\033[H'   # clear screen

              printf '\033[1;36m'
              printf '╔══════════════════════════════════════════════════════╗\n'
              printf '║          ⚡  SaaS Boilerplate  — Dev Shell  ⚡       ║\n'
              printf '╚══════════════════════════════════════════════════════╝\n'
              printf '\033[0m'

              printf '\n\033[1;33m  Welcome back! Environment is ready.\033[0m\n\n'

              # stats table
              printf '\033[1;34m  ┌─ Stats ──────────────────────────────────────────┐\033[0m\n'
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Project version" "v$_pkg_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Git branch"      "$_git_branch"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Node.js"         "$_node_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "pnpm"            "$_pnpm_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "PostgreSQL"      "$_pg_ver"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "DB"              "${dbName}@127.0.0.1:${pgPort}"
              printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "DB status"       "✓ running"
              printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n'

              # available commands
              printf '\n\033[1;34m  ┌─ Commands ────────────────────────────────────────┐\033[0m\n'
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm dev"          "start dev server  (port 3000)"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm build"         "production build"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm start"         "run production server"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm test"          "run test suite"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm lint"          "lint with Biome"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm check"         "format + lint check"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:migrate"    "run DB migrations"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:generate"   "generate migration files"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:studio"     "open Drizzle Studio"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:seed"       "seed the database"
              printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm storybook"     "launch Storybook  (port 6006)"
              printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n\n'

              unset _node_ver _pnpm_ver _pg_ver _git_branch _pkg_ver
            '';
          };
        });

      packages = forEachSystem (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "saas-boilerplate";
            version = "0.4.0";

            src = pkgs.lib.fileset.toSource {
              root = ./.;
              fileset = pkgs.lib.fileset.unions [
                ./package.json
                ./pnpm-lock.yaml
                ./vite.config.ts
                ./tsconfig.json
                ./tsr.config.json
                ./server.mjs
                ./src
              ];
            };

            nativeBuildInputs = [
              pkgs.nodejs_22
              pkgs.pnpmConfigHook
            ];

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 3;
              hash = pkgs.lib.fakeHash;
            };

            buildPhase = ''
              runHook preBuild
              pnpm build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall

              # Install prod-only deps into a temporary location
              pnpm install --frozen-lockfile --prod --ignore-scripts

              appDir="$out/lib/saas-boilerplate"
              mkdir -p "$appDir" "$out/bin"

              cp -r dist "$appDir/dist"
              cp server.mjs "$appDir/server.mjs"
              cp package.json "$appDir/package.json"
              cp -r node_modules "$appDir/node_modules"

              cat > "$out/bin/saas-boilerplate" <<EOF
              #!/bin/sh
              cd "$appDir"
              exec ${pkgs.nodejs_22}/bin/node server.mjs "\$@"
              EOF
              chmod +x "$out/bin/saas-boilerplate"

              runHook postInstall
            '';
          });
        });

      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.saas-boilerplate;
          pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        in {
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
              default = "postgresql://saas_boilerplate:saas_boilerplate@localhost:5432/saas_boilerplate";
              description = "PostgreSQL connection URL.";
            };

            redisUrl = lib.mkOption {
              type = lib.types.str;
              default = "redis://127.0.0.1:6380";
              description = "Redis connection URL.";
            };

            environmentFile = lib.mkOption {
              type = lib.types.path;
              description = "Path to a file containing secret environment variables (BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).";
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
                description = "Whether to enable ACME/Let's Encrypt SSL.";
              };

              acmeEmail = lib.mkOption {
                type = lib.types.str;
                default = "";
                description = "Email address for ACME certificate registration.";
              };
            };
          };

          config = lib.mkIf cfg.enable {
            services.postgresql = {
              enable = true;
              ensureDatabases = [ "saas_boilerplate" ];
              ensureUsers = [
                {
                  name = "saas_boilerplate";
                  ensureDBOwnership = true;
                }
              ];
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
                BETTER_AUTH_URL = "https://${cfg.nginx.domain}";
                NODE_ENV = "production";
              };

              serviceConfig = {
                ExecStart = "${pkg}/bin/saas-boilerplate";
                EnvironmentFile = cfg.environmentFile;
                DynamicUser = true;
                NoNewPrivileges = true;
                ProtectSystem = "strict";
                ProtectHome = true;
                PrivateTmp = true;
                StateDirectory = "saas-boilerplate";
                Restart = "on-failure";
                RestartSec = "5s";
              };
            };

            services.nginx = lib.mkIf cfg.nginx.enable {
              enable = true;
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
              certs.${cfg.nginx.domain}.email = cfg.nginx.acmeEmail;
            };
          };
        };
    };
}
