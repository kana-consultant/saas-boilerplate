{ config, lib, ... }:
{
  networking.hostName = "saas-example";
  system.stateVersion = "24.11";

  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";

  clan.core.networking.targetHost = lib.mkDefault "root@saas.example.com";

  boot.loader.grub.enable = lib.mkDefault true;
  boot.loader.grub.device = lib.mkDefault "/dev/vda";
  fileSystems."/" = lib.mkDefault {
    device = "/dev/vda1";
    fsType = "ext4";
  };

  services.openssh.enable = true;
  networking.firewall.allowedTCPPorts = [ 80 443 ];

  services.saas-boilerplate = {
    enable = true;
    nginx = {
      enable = true;
      domain = "app.example.com";
      enableSSL = true;
      acmeEmail = "you@example.com";
    };
  };
}
