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
              export PGPORT="${pgPort}"
              export PGDATA="$HOME/.postgres-saas"
              export PGHOST="127.0.0.1"
              export PGLOGFILE="$PGDATA/logfile"

              # Init data dir if needed
              if [ ! -d "$PGDATA" ]; then
                echo "Initialising PostgreSQL data dir at $PGDATA..."
                initdb -D "$PGDATA" --no-locale --encoding=UTF8 -A trust \
                  --username=postgres -q
                echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
                echo "port = ${pgPort}" >> "$PGDATA/postgresql.conf"
              fi

              # Start postgres if not already running
              if ! pg_isready -q -h 127.0.0.1 -p ${pgPort}; then
                echo "Starting PostgreSQL on port ${pgPort}..."
                pg_ctl -D "$PGDATA" -l "$PGLOGFILE" start -w -o "-p ${pgPort}" -o "-h 127.0.0.1"
              fi

              # Ensure the role and database exist
              psql -h 127.0.0.1 -p ${pgPort} -d postgres -tc \
                "SELECT 1 FROM pg_roles WHERE rolname='${dbUser}'" \
                | grep -q 1 || \
                psql -h 127.0.0.1 -p ${pgPort} -d postgres \
                  -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}' CREATEDB;"

              psql -h 127.0.0.1 -p ${pgPort} -d postgres -tc \
                "SELECT 1 FROM pg_database WHERE datname='${dbName}'" \
                | grep -q 1 || \
                psql -h 127.0.0.1 -p ${pgPort} -d postgres \
                  -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"

              export DATABASE_URL="postgresql://${dbUser}:${dbPass}@127.0.0.1:${pgPort}/${dbName}"
              echo "✓ PostgreSQL ready — $DATABASE_URL"
            '';
          };
        });

      packages = forEachSystem (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "saas-boilerplate";
            version = "0.3.2";

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
