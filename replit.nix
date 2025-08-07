
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.openjdk11
    pkgs.android-tools
  ];
  env = {
    JAVA_HOME = "${pkgs.openjdk11}";
  };
}
