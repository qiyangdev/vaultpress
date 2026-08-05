/**
 * Enforce the search visibility boundary on the server.
 *
 * Search tags are client-controlled query parameters. An unauthenticated
 * request must therefore never be allowed to select the protected index.
 */
export function getAuthorizedSearchUrl(requestUrl: string, hasProtectedAccess: boolean) {
  const url = new URL(requestUrl);

  if (!hasProtectedAccess) {
    url.searchParams.set('tag', 'public');
  }

  return url;
}
