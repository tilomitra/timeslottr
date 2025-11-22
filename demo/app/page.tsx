import { Header } from "@/components/header";
import { Playground } from "@/components/playground/playground";
import { CodeBlock } from "@/components/code-block";
import { InstallCommand } from "@/components/install-command";

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
import { generateDailyTimeslots } from 'timeslottr';

const slots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-08' },
  {
    range: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 60,
    timezone: 'America/New_York'
  }
);
`;

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 md:px-0">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Flexible Time Slot Generation
            </h1>
            <p className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-xl sm:leading-8">
              A zero-dependency, timezone-aware library for generating time slots.
              Handles exclusions, buffers, and alignments.
            </p>
            <div className="space-x-4">
              <InstallCommand />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-screen-xl pb-8 md:pb-12 lg:pb-24">
          <div className="mx-auto flex flex-col items-center space-y-4 text-center mb-16">
              <h2 className="font-semibold text-3xl leading-[1.1] tracking-tight sm:text-3xl md:text-4xl">
                Effortless setup
              </h2>
              <p className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-lg sm:leading-7">
                With a simple declarative API to define and use your schedules.
              </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <CodeBlock title="Single Day Schedule" code={singleDayCode} />
            <CodeBlock title="Multi-Day Schedule" code={multiDayCode} />
          </div>
        </section>

        <section className="container mx-auto max-w-screen-xl pb-8 md:pb-12 lg:pb-24">
          <div className="mx-auto flex flex-col items-center space-y-4 text-center mb-16">
             <div className="rounded-2xl bg-muted px-3 py-1 text-sm font-medium">
                Interactive Demo
             </div>
             <h2 className="font-semibold text-3xl leading-[1.1] tracking-tight sm:text-3xl md:text-4xl">
                See it in action
             </h2>
             <p className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-lg sm:leading-7">
                Configure your schedule rules on the left and see the generated slots instantly on the right.
             </p>
          </div>
          <Playground />
        </section>
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <a href="https://twitter.com/tilomitra" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">Tilo Mitra</a>. The source code is available on <a href="https://github.com/tilomitra/timeslottr" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">GitHub</a>.
          </p>
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
