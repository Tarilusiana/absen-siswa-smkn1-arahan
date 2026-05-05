module.exports = {
  apps: [
    {
      name: "absen-siswa",
      script: "npm",
      args: "run start",
      cwd: "/opt/absen-siswa",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
