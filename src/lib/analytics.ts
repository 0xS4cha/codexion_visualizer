const LAST_VISIT_KEY = "codexion:last-visit-day";
const COUNTRY_KEY = "codexion:visitor-country";

let resolveCountry: ((country: string | null) => void) | null = null;
const countryReady = new Promise<string | null>((resolve) => {
  resolveCountry = resolve;
});

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    return;
  }
}

function claimFirstVisitToday(): boolean {
  const today = new Date().toISOString().split("T")[0];
  if (readStorage(() => localStorage, LAST_VISIT_KEY) === today) return false;
  writeStorage(() => localStorage, LAST_VISIT_KEY, today);
  return true;
}

export function trackVisit(path: string): Promise<string | null> {
  const request = fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, firstToday: claimFirstVisitToday() }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const country = typeof data?.country === "string" && /^[A-Z]{2}$/.test(data.country) ? data.country : null;
      if (country) writeStorage(() => sessionStorage, COUNTRY_KEY, country);
      return country ?? readStorage(() => sessionStorage, COUNTRY_KEY);
    })
    .catch(() => readStorage(() => sessionStorage, COUNTRY_KEY));
  request.then((country) => resolveCountry?.(country));
  return request;
}

export function getVisitorCountry(): Promise<string | null> {
  const stored = readStorage(() => sessionStorage, COUNTRY_KEY);
  return stored ? Promise.resolve(stored) : countryReady;
}
