@echo off
title Build APK - psicologojuanfernandez
cd /d "%~dp0"

if not exist "eas.json" (
  echo ============================================================
  echo  ERROR: no encuentro eas.json en esta carpeta.
  echo  Guarda este archivo .bat DENTRO de la carpeta "app"
  echo  y vuelve a abrirlo con doble clic.
  echo ============================================================
  echo.
  pause
  exit /b
)

echo ============================================================
echo  Carpeta de trabajo:
cd
echo ============================================================
echo.
echo  Paso 1: iniciar sesion en Expo.
echo  La primera vez descarga la herramienta (puede tardar un par
echo  de minutos). Luego te pide tu correo y clave de Expo.
echo.
call npx --yes eas-cli@latest login
if errorlevel 1 goto error

echo.
echo  Paso 2: compilar el APK (runtime 1.0.1).
echo  Corre en la nube y tarda 10 a 20 minutos. Veras un enlace
echo  para seguir el progreso; puedes cerrar la ventana sin problema.
echo.
call npx --yes eas-cli@latest build --profile preview --platform android
if errorlevel 1 goto error

echo.
echo ============================================================
echo  Listo. Cuando la build termine en expo.dev, descarga el APK,
echo  instalalo y abre la app: ahi veras los cambios de C26.
echo