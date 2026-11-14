# La Ciudad + Neocities

El repositorio **blog-assets** ya contiene recursos usados por la radio de El Jardín y flujos automatizados existentes. **No renombrar, reorganizar ni borrar esos recursos sin revisar sus URLs.**

## Estado de integración (14-11-2026)

- Preparado: `.github/workflows/deploy-ciudad-neocities.yml`.
- Pendiente: incorporar el código **aprobado y actualizado** de La Ciudad en `site/`.
- Pendiente: crear el secreto de GitHub Actions `NEOCITIES_API_TOKEN`.
- No se ha realizado aún un despliegue automático.

## Estructura objetivo

```
blog-assets/
  .github/workflows/        # radio y mantenimiento existentes + despliegue de la ciudad
  radio/                    # NO MOVER: enlaces del Jardín
  biblioteca/               # NO MOVER: enlaces existentes
  *.mp3                     # NO MOVER: enlaces existentes
  site/                     # ÚNICAMENTE archivos públicos de Neocities
    index.html
    style.css
    script.js
    scenes/
      universidad/
      habitacion/
      cuenta/
      taller/
      biblioteca/
      pphy/
```

La carpeta `site/` debe reflejar las rutas públicas del sitio. **No incluir** contenido privado de El Jardín, contraseñas, tokens, archivos `.env`, ni respaldos de datos personales. El proyecto de Supabase permanece externo a GitHub; las claves secretas nunca deben entrar al navegador ni al repositorio. La clave *publishable* de Supabase es la única clase de clave pública válida en el cliente.

## Habilitación

1. Incorporar la versión actual y revisada del sitio bajo `site/`, sin modificar las carpetas existentes.
2. En Neocities, generar una clave de API en la configuración del sitio.
3. En GitHub: Settings → Secrets and variables → Actions → New repository secret. Nombre exacto: `NEOCITIES_API_TOKEN`. El valor se pega **solo ahí**, nunca en el chat o en un commit.
4. Verificar `site/index.html` y `site/scenes/universidad/index.html`.
5. Ejecutar manualmente `Deploy La Ciudad` desde Actions para la primera publicación. Luego, un push a `main` que cambie archivos bajo `site/` disparará nuevas publicaciones.

## Protecciones

- `cleanup: false`: no elimina archivos de Neocities que no estén en `site/`.
- El flujo solo publica `site/`, nunca la raíz del repositorio.
- Las automatizaciones `radio-weekly.yml` y `supabase-keepalive.yml` permanecen intactas.
- Si falta `site/index.html`, la publicación se detiene.
- Si aparecen rutas de El Jardín dentro de `site/`, se detiene.
- El repositorio actual es **público**: todo contenido añadido debe considerarse público, incluidas las páginas HTML, CSS, JS y recursos.

## Migración académica pendiente

El respaldo `ciudad_progress` de Supabase necesita pruebas de guardado y recuperación reales antes de afirmar que Universidad/PPHY están completamente sincronizados. No borrar el almacenamiento original del navegador hasta comprobar ambas operaciones.

## Nota de seguridad

El código fuente público no equivale a acceso autorizado a los datos: los permisos efectivos de Supabase se deben aplicar mediante RLS. El Jardín debe seguir separado del mundo compartido.
