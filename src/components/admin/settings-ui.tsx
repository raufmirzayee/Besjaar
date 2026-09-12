import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  HelpCircle,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/translations";
import {
  SETTINGS,
  controlFor,
  editableSettings,
  type ResolvedSetting,
  type SettingCategory,
  type SettingValue,
} from "@/lib/settings-schema";
import type { SecretStatus, SecretStoreCapability, ManagedSecret } from "@/lib/secrets";
import type {
  HealthLevel,
  IntegrationStatus,
  Message,
  StatusDetail,
  TestResult,
} from "@/lib/integrations/types";

/* ------------------------------- messages -------------------------------- */

/**
 * Renders a server-decided message in the reader's language.
 *
 * The adapters name what happened; this turns the name into words. A `text`
 * message is content rather than copy — a domain name, a DeepL translation —
 * and passes through untouched.
 */
export function useMessage() {
  const { t } = useI18n();
  return (message: Message): string =>
    "text" in message ? message.text : t(message.key, message.params);
}

/* -------------------------------- health --------------------------------- */

const DOT: Record<HealthLevel, string> = {
  ok: "bg-emerald-500",
  attention: "bg-amber-500",
  critical: "bg-destructive",
  neutral: "bg-muted-foreground/40",
};

export function LevelDot({ level, className }: { level: HealthLevel; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", DOT[level], className)}
      aria-hidden
    />
  );
}

export function DetailList({ details }: { details: StatusDetail[] }) {
  const message = useMessage();
  if (details.length === 0) return null;
  return (
    <dl className="divide-y divide-border/60 text-sm">
      {details.map((detail, index) => (
        <div
          key={`${message(detail.label)}-${index}`}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-1.5"
        >
          <dt className="text-muted-foreground">{message(detail.label)}</dt>
          <dd className="flex min-w-0 items-center gap-2 text-right">
            <LevelDot level={detail.level} />
            <span className="break-words">{message(detail.value)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------- help ---------------------------------- */

/** A collapsible explanation. Closed by default so it never crowds the form. */
export function HelpNote({ body, title }: { body: TranslationKey; title?: TranslationKey }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        // Padded to a 24px-tall target: the text alone is 16px, which is
        // awkward to hit with a thumb on the phone this admin gets used on.
        className="-mx-1 inline-flex min-h-6 items-center gap-1.5 px-1 py-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        aria-expanded={open}
      >
        <HelpCircle className="size-3.5" aria-hidden />
        {t(open ? "admin.set.hideHelp" : (title ?? "admin.set.help"))}
      </button>
      {open ? (
        <p className="mt-1.5 rounded-md border border-border/70 bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
          {t(body)}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------ page wrapper ------------------------------ */

export function SettingsSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

/* -------------------------------- the form -------------------------------- */

export type SettingsFormProps = {
  category: SettingCategory;
  /** What the server resolved, including where each value came from. */
  resolved: ResolvedSetting[];
  canEdit: boolean;
  saving: boolean;
  errors: Record<string, string>;
  onSave: (values: Record<string, SettingValue>) => void;
  /** Keys to leave out — a page that renders one of them itself. */
  omit?: string[];
};

/**
 * One category's settings, with a save bar that only appears once something
 * has changed.
 *
 * Every field shows where its value came from. That row is the whole point of
 * the exercise: a value inherited from the deployment environment looks exactly
 * like one somebody typed here, and the difference decides whether editing this
 * screen will actually change anything.
 */
export function SettingsForm({
  category,
  resolved,
  canEdit,
  saving,
  errors,
  onSave,
  omit = [],
}: SettingsFormProps) {
  const { t } = useI18n();
  const definitions = useMemo(
    () => editableSettings(category).filter((definition) => !omit.includes(definition.key)),
    [category, omit],
  );

  const initial = useMemo(() => {
    const values: Record<string, SettingValue> = {};
    for (const definition of definitions) {
      const match = resolved.find((entry) => entry.key === definition.key);
      values[definition.key] = match ? match.value : definition.fallback;
    }
    return values;
  }, [definitions, resolved]);

  const [draft, setDraft] = useState<Record<string, SettingValue>>(initial);
  const [touched, setTouched] = useState(false);

  // The server is the source of truth; a reload or another tab's save replaces
  // what is on screen unless this one has unsaved edits.
  const values = touched ? draft : initial;

  const changed = definitions
    .map((definition) => definition.key)
    .filter((key) => JSON.stringify(values[key]) !== JSON.stringify(initial[key]));

  function update(key: string, value: SettingValue) {
    setTouched(true);
    setDraft({ ...values, [key]: value });
  }

  function reset() {
    setTouched(false);
    setDraft(initial);
  }

  function submit() {
    const payload: Record<string, SettingValue> = {};
    for (const key of changed) payload[key] = values[key];
    onSave(payload);
    setTouched(false);
  }

  return (
    <div>
      <div className="divide-y divide-border/60">
        {definitions.map((definition) => (
          <SettingRow
            key={definition.key}
            settingKey={definition.key}
            value={values[definition.key]}
            source={resolved.find((entry) => entry.key === definition.key)?.source ?? "default"}
            error={errors[definition.key]}
            disabled={!canEdit || saving}
            onChange={(next) => update(definition.key, next)}
          />
        ))}
      </div>

      {!canEdit ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {t("admin.set.readOnly")}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button onClick={submit} disabled={changed.length === 0 || saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            {t(saving ? "admin.set.saving" : "admin.set.save")}
          </Button>
          {changed.length > 0 ? (
            <>
              <Button variant="ghost" onClick={reset} disabled={saving}>
                {t("admin.set.discard")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("admin.set.unsaved", { count: changed.length })}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{t("admin.set.noChanges")}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SettingRow({
  settingKey,
  value,
  source,
  error,
  disabled,
  onChange,
}: {
  settingKey: string;
  value: SettingValue;
  source: ResolvedSetting["source"];
  error?: string;
  disabled: boolean;
  onChange: (value: SettingValue) => void;
}) {
  const { t } = useI18n();
  const definition = SETTINGS[settingKey];
  const control = controlFor(definition);
  const id = `setting-${settingKey.replace(/\./g, "-")}`;

  const label = t(`admin.set.f.${settingKey}` as TranslationKey);
  const help = `admin.set.h.${settingKey}` as TranslationKey;

  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:gap-6">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SourceBadge source={source} />
          {definition.sensitive ? (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <ShieldAlert className="size-3" aria-hidden />
              {t("admin.set.sensitive")}
            </Badge>
          ) : null}
        </div>
        <HelpNote body={help} />
      </div>

      <div className="min-w-0">
        {control.kind === "switch" ? (
          <div className="flex items-center gap-3">
            <Switch
              id={id}
              checked={value === true}
              disabled={disabled}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted-foreground">
              {t(value === true ? "admin.set.yes" : "admin.set.no")}
            </span>
          </div>
        ) : control.kind === "select" ? (
          <Select
            value={String(value ?? "")}
            disabled={disabled}
            onValueChange={(next) => onChange(next)}
          >
            <SelectTrigger id={id} className="max-w-sm">
              {/*
                Radix only learns an option's label when its items mount, so a
                bare SelectValue renders an empty box on the server and until
                hydration — the field reads as "not set" when it is set. Naming
                the label explicitly renders it immediately, and it still
                tracks the selection because `value` is this component's state.
              */}
              <SelectValue>{t(optionKey(settingKey, String(value ?? "")))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {control.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(optionKey(settingKey, option))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : control.kind === "number" ? (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            className="max-w-[12rem]"
            value={value === null || value === undefined ? "" : String(value)}
            disabled={disabled}
            onChange={(event) =>
              onChange(event.target.value === "" ? 0 : Number(event.target.value))
            }
          />
        ) : control.kind === "textarea" ? (
          <Textarea
            id={id}
            rows={3}
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <Input
            id={id}
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        )}

        {error ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive" role="alert">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Option labels live under a per-setting key where the wording differs, and
 * fall back to a shared one where it does not — `nl` means Dutch on every
 * screen that offers it.
 */
function optionKey(settingKey: string, option: string): TranslationKey {
  if (settingKey === "payments.mode") return `admin.set.opt.mode.${option}` as TranslationKey;
  if (settingKey === "email.provider") return `admin.set.opt.provider.${option}` as TranslationKey;
  if (settingKey === "translations.endpoint") {
    return `admin.set.opt.plan.${option}` as TranslationKey;
  }
  return `admin.set.opt.lang.${option}` as TranslationKey;
}

export function SourceBadge({ source }: { source: ResolvedSetting["source"] }) {
  const { t } = useI18n();
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-normal",
        source === "database" ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400" : "",
      )}
      title={t("admin.set.srcExplainer")}
    >
      {t(`admin.set.src.${source}` as TranslationKey)}
    </Badge>
  );
}

/* ---------------------------- connection cards ---------------------------- */

export function ConnectionCard({
  status,
  onTest,
  testing,
  result,
  canTest,
  configureTo,
  children,
}: {
  status: IntegrationStatus;
  onTest?: () => void;
  testing?: boolean;
  result?: TestResult;
  canTest: boolean;
  configureTo?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <LevelDot level={status.level} />
            {t(`admin.conn.name.${status.id}` as TranslationKey)}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(`admin.conn.purpose.${status.id}` as TranslationKey)}
          </p>
        </div>
        <StateBadge state={status.state} />
      </header>

      <div className="mt-3 flex-1">
        <DetailList details={status.details} />
      </div>

      {result ? <TestResultPanel result={result} /> : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {onTest ? (
          <Button size="sm" variant="outline" onClick={onTest} disabled={testing || !canTest}>
            {testing ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-2 size-3.5" aria-hidden />
            )}
            {t(testing ? "admin.conn.testing" : "admin.conn.test")}
          </Button>
        ) : null}
        {configureTo ? (
          <Button size="sm" variant="ghost" asChild>
            <Link to={configureTo}>{t("admin.conn.configure")}</Link>
          </Button>
        ) : null}
        {children}
      </footer>
    </section>
  );
}

export function StateBadge({ state }: { state: IntegrationStatus["state"] }) {
  const { t } = useI18n();
  const tone =
    state === "connected"
      ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
      : state === "failed"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : state === "configured"
          ? "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", tone)}
      title={t(`admin.conn.stateHelp.${state}` as TranslationKey)}
    >
      {t(`admin.conn.state.${state}` as TranslationKey)}
    </span>
  );
}

export function TestResultPanel({ result }: { result: TestResult }) {
  const { t } = useI18n();
  const message = useMessage();

  return (
    <div
      className={cn(
        "mt-3 rounded-lg border p-3 text-sm",
        result.ok
          ? "border-emerald-600/30 bg-emerald-600/5"
          : "border-destructive/30 bg-destructive/5",
      )}
      role="status"
    >
      <p className="flex items-start gap-2 font-medium">
        {result.ok ? (
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        )}
        <span className="min-w-0 break-words">{message(result.message)}</span>
      </p>
      {result.details?.length ? (
        <div className="mt-2">
          <DetailList details={result.details} />
        </div>
      ) : null}
      {result.durationMs !== undefined ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("admin.conn.duration", { ms: result.durationMs })}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------- secret management --------------------------- */

/**
 * One credential: whether it exists, where it lives, and a box to replace it.
 *
 * The current value is never shown, never fetched, and has no field in the type
 * that reaches this component. Replacing is the only operation, which is also
 * the honest one — a credential you can read back out of a settings screen is a
 * credential that leaks the first time somebody shares their screen.
 */
export function SecretField({
  status,
  capability,
  canManage,
  saving,
  onSave,
  onRemove,
}: {
  status: SecretStatus;
  capability: SecretStoreCapability;
  canManage: boolean;
  saving: boolean;
  onSave: (value: string) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const name = t(`admin.secret.name.${status.name}` as TranslationKey);
  const id = `secret-${status.name}`;

  async function copyName() {
    try {
      await navigator.clipboard.writeText(status.name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A browser that refuses clipboard access is not an error worth a toast:
      // the variable name is on screen and can be selected by hand.
      setCopied(false);
    }
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 text-[10px] font-normal">
              <LevelDot level={status.configured ? "ok" : "neutral"} />
              {t(status.configured ? "admin.secret.configured" : "admin.secret.notConfigured")}
            </Badge>
            {status.configured ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                {t(
                  status.source === "vault" ? "admin.secret.inVault" : "admin.secret.inEnvironment",
                )}
              </Badge>
            ) : null}
            {status.maskedHint ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {status.maskedHint}
              </code>
            ) : null}
          </div>
          {status.updatedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.secret.updatedAt", { date: status.updatedAt.slice(0, 10) })}
            </p>
          ) : null}
        </div>

        {canManage && capability.writable ? (
          <div className="flex shrink-0 gap-2">
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {t(status.configured ? "admin.secret.replace" : "admin.secret.add")}
              </Button>
            ) : null}
            {status.configured && status.source === "vault" && !editing ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(t("admin.secret.confirmRemove"))) onRemove();
                }}
              >
                {t("admin.secret.remove")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor={id} className="sr-only">
              {name}
            </Label>
            <Input
              id={id}
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={t("admin.secret.placeholder")}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{t("admin.secret.neverShown")}</p>
          </div>
          <Button
            size="sm"
            disabled={value.trim().length < 8 || saving}
            onClick={() => {
              onSave(value.trim());
              setValue("");
              setEditing(false);
            }}
          >
            {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden /> : null}
            {t("admin.set.save")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setValue("");
              setEditing(false);
            }}
          >
            {t("admin.secret.cancel")}
          </Button>
        </div>
      ) : null}

      {!capability.writable ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden />
            {t("admin.secret.noStore")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("admin.secret.noStoreHelp")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("admin.secret.envVariable")}</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{status.name}</code>
            <Button size="sm" variant="ghost" onClick={() => void copyName()}>
              {t(copied ? "admin.secret.copied" : "admin.secret.copy")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The credentials one integration needs, in a titled block. */
export function SecretGroup({
  title,
  secrets,
  capability,
  canManage,
  savingName,
  onSave,
  onRemove,
}: {
  title: string;
  secrets: SecretStatus[];
  capability: SecretStoreCapability;
  canManage: boolean;
  savingName: ManagedSecret | null;
  onSave: (name: ManagedSecret, value: string) => void;
  onRemove: (name: ManagedSecret) => void;
}) {
  if (secrets.length === 0) return null;
  return (
    <SettingsSection title={title}>
      <div className="divide-y divide-border/60">
        {secrets.map((secret) => (
          <SecretField
            key={secret.name}
            status={secret}
            capability={capability}
            canManage={canManage}
            saving={savingName === secret.name}
            onSave={(value) => onSave(secret.name, value)}
            onRemove={() => onRemove(secret.name)}
          />
        ))}
      </div>
    </SettingsSection>
  );
}

/* ------------------------------- checklists ------------------------------- */

export function ChecklistRow({
  complete,
  title,
  description,
  to,
  action,
}: {
  complete: boolean;
  title: string;
  description?: string;
  to?: string;
  action?: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          complete
            ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-600"
            : "border-border text-muted-foreground",
        )}
        aria-hidden
      >
        {complete ? <Check className="size-3" /> : <CircleDashed className="size-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", complete ? "text-muted-foreground" : "")}>
          {to ? (
            <Link to={to} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
}

/** A labelled progress bar. Used by the wizard and the launch checklist. */
export function ProgressBar({
  completed,
  total,
  label,
}: {
  completed: number;
  total: number;
  label: string;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {completed} / {total}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
