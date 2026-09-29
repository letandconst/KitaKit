export function useRouter() {
  return {
    push: (href: string) => {
      window.history.pushState(null, "", href);
    },
    replace: (href: string) => {
      window.history.replaceState(null, "", href);
    },
    back: () => {
      window.history.back();
    },
  };
}

export function usePathname(): string {
  return window.location.pathname;
}
