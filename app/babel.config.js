module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          // El contenido se sincroniza desde /src/lib del repo (fuente única)
          // hacia esta carpeta interna en cada install. La app nunca cruza
          // fuera de /app, lo que hace la resolución de Metro robusta.
          alias: { '@contenido': './src/contenido' },
          extensions: ['.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
