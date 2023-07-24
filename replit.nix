{ pkgs }: {
	deps = [
    pkgs.ffmpeg.bin
    pkgs.chromium
    pkgs.vite
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
	];
}