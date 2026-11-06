/** A protected page always requires access, even if the password is missing. */
export function isPageProtected(page: { data: { protected?: boolean } }) {
  return page.data.protected === true;
}

export const pageRequiresAuth = isPageProtected;
