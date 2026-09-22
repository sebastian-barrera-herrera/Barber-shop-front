/** Rutas dentro de la página de una empresa: siteHref('el-bigote', '/reservar') → '/el-bigote/reservar'. */
export function siteHref(slug: string, path = '/'): string {
  return `/${slug}${path === '/' ? '' : path}`;
}
