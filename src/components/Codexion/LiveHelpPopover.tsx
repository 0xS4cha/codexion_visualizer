import { Info, Terminal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const RELEASES = "https://github.com/0xS4cha/codexion_live/releases/latest/download";

function Step({ index, title, children }: { index: number; title: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex items-center justify-center bg-white/10 rounded-full w-5 h-5 font-bold text-[10px] text-white shrink-0">{index}</span>
      <div className="w-full min-w-0">
        <span className="text-white/90 block mb-1 font-medium">{title}</span>
        {children}
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="flex items-center gap-2 mt-1 bg-black/50 p-2 rounded-md border border-white/5 font-mono text-[10px] text-white/70 overflow-x-auto whitespace-nowrap">
      <Terminal className="w-3 h-3 text-white/30 shrink-0" />
      {children}
    </code>
  );
}

export default function LiveHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors" aria-label="How live mode works">
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] border border-white/10 bg-black/60 backdrop-blur-xl text-white/80 p-5 shadow-2xl rounded-2xl" align="end" sideOffset={10}>
        <h4 className="font-semibold text-white mb-2">Live Mode</h4>
        <p className="text-xs text-white/60 mb-5 leading-relaxed">
          Visualize your codexion in real-time. Stop waiting for the simulation to finish to spot deadlocks.
        </p>
        <ol className="text-xs space-y-4 list-none">
          <Step index={1} title="Download the local bridge">
            <div className="flex flex-col gap-1 mt-1">
              <a href={`${RELEASES}/codexion_live`} download className="inline-flex items-center gap-1 text-white hover:underline">
                Download codexion_live (linux)
              </a>
              <a href={`${RELEASES}/codexion_live_mac`} download className="inline-flex items-center gap-1 text-white hover:underline">
                Download codexion_live (mac)
              </a>
              <a href="https://github.com/0xS4cha/codexion_live/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/50 hover:text-white/80 hover:underline">
                View Source Code
              </a>
            </div>
          </Step>
          <Step index={2} title="Let the bridge run your program (recommended)">
            <Code>./codexion_live -- ./codexion 4 800 200 200 200 5 0 fifo</Code>
            <p className="mt-1 text-[10px] text-white/40">The command, exit code and segfaults are sent to the visualizer, and you can rerun from here.</p>
          </Step>
          <Step index={3} title="…or pipe it">
            <Code>./codexion ... | ./codexion_live --auto-reset</Code>
          </Step>
          <Step index={4} title='Click on "Live Connect"' />
        </ol>
      </PopoverContent>
    </Popover>
  );
}
