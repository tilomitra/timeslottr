import { Header } from "@/components/header";
import { Playground } from "@/components/playground/playground";
import { CodeBlock } from "@/components/code-block";
import { InstallCommand } from "@/components/install-command";
import { ApiReference } from "@/components/api-reference";

export default function Home() {
  const singleDayCode = `
import { generateTimeslots } from 'timeslottr';

const slots = generateTimeslots({
  day: '2024-01-01',
  timezone: 'America/New_York',
  range: { start: '09:00', end: '17:00' },
  slotDurationMinutes: 30,
  excludedWindows: [
    { start: '12:00', end: '13:00' }
  ]
});
`;

  const multiDayCode = `
import { generateDailyTimeslots, Weekday } from 'timeslottr';

const slots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-14' },
  {
    range: new Map([
      [Weekday.MON, { start: '09:00', end: '17:00' }],
      [Weekday.TUE, { start: '09:00', end: '17:00' }],
      [Weekday.WED, { start: '09:00', end: '12:00' }],
      [Weekday.THU, { start: '09:00', end: '17:00' }],
      [Weekday.FRI, { start: '10:00', end: '16:00' }],
    ]),
    slotDurationMinutes: 60,
    timezone: 'America/New_York'
  }
);
`;

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-6 sm:px-8 lg:px-12">
        {/* Hero */}
        <section id="overview" className="pb-12 pt-10 md:pb-16 md:pt-14 lg:pb-20 lg:pt-20">
          <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Time slots, handled.
            </h1>
            <p className="max-w-[36rem] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Zero-dependency TypeScript library for generating time slots with timezone support, buffers, and exclusions.
            </p>
            <InstallCommand />
          </div>
        </section>

        {/* Code Examples */}
        <section id="examples" className="container mx-auto max-w-screen-xl pb-12 md:pb-16 lg:pb-20 scroll-mt-20">
          <div className="mx-auto flex max-w-[36rem] flex-col items-center text-center mb-8 md:mb-10">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Declarative scheduling
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Define single-day or multi-day schedules with one function call.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <CodeBlock title="Single Day" code={singleDayCode} />
            <CodeBlock title="Per-Weekday" code={multiDayCode} />
          </div>
        </section>

        {/* Playground */}
        <section id="playground" className="container mx-auto max-w-screen-xl pb-12 md:pb-16 lg:pb-20 scroll-mt-20">
          <div className="mx-auto flex max-w-[36rem] flex-col items-center text-center mb-8 md:mb-10">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Try it live
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Configure schedule rules and see the generated slots instantly.
            </p>
          </div>
          <Playground />
        </section>

        {/* API Reference */}
        <section id="api" className="container mx-auto max-w-screen-xl pb-12 md:pb-16 lg:pb-20 scroll-mt-20">
          <div className="mx-auto flex max-w-[36rem] flex-col items-center text-center mb-8 md:mb-10">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              API Reference
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Every exported function, config option, and type.
            </p>
          </div>
          <ApiReference />
        </section>
      </main>

      <footer className="border-t py-8 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-20 md:flex-row sm:px-8">
          <p className="text-sm text-muted-foreground">
            Built by <a href="https://twitter.com/tilomitra" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">Tilo Mitra</a>. Source on <a href="https://github.com/tilomitra/timeslottr" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 hover:text-foreground transition-colors">GitHub</a>.
          </p>
          <p className="text-sm text-muted-foreground">MIT License</p>
        </div>
      </footer>
    </div>
  );
}
