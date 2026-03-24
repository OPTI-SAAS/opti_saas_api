module.exports = {
  apps: [
    {
      name: 'opti_saas_api',
      script: 'dist/src/main.js',
      cwd: '/home/ubuntu/projects/opti_saas_api',
      node_args: '--max-old-space-size=1800',
      env: {
        PORT: 3001,
        NODE_ENV: 'production',
      },
    },
  ],
};
