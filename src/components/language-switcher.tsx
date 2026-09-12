import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, useI18n, type Locale } from "@/lib/i18n";

/**
 * `only` narrows the choices to the locales the surrounding area actually has
 * copy for. The backoffice is Dutch and English, and offering German there
 * would just serve Dutch under a German flag.
 */
export function LanguageSwitcher({ only }: { only?: readonly Locale[] } = {}) {
  const { locale, setLocale, t } = useI18n();
  const choices = only ?? LOCALES;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("header.language")} className="gap-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{LOCALE_SHORT[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {choices.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLocale(code)}
            className={code === locale ? "font-semibold" : undefined}
          >
            <span className="mr-2 text-xs text-muted-foreground">{LOCALE_SHORT[code]}</span>
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
