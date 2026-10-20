import { useMemo, useRef, useState } from "react";
import { Upload, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCommand, setOutput } from "@/store/features/inputSlice";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import { downloadBlob } from "@/lib/exporters";
import { splitImportedLog } from "@/lib/importLog";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export default function CodexionOutput() {
    const output = useAppSelector((state) => state.user_input.output);
    const command = useAppSelector((state) => state.user_input.command);
    const dispatch = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const text = useMemo(() => output.join('\n'), [output]);
    const lineCount = useMemo(() => output.filter((l) => l.trim() !== "").length, [output]);

    const importFile = async (file: File) => {
        if (file.size > MAX_FILE_BYTES) {
            toast.error("File is too large (max 50 MB).");
            return;
        }
        try {
            const content = await file.text();
            const { command: importedCommand, lines } = splitImportedLog(content);
            if (importedCommand) dispatch(setCommand(importedCommand));
            dispatch(setOutput(lines));
            toast.success(`Imported ${lines.length} lines from ${file.name}${importedCommand ? " (command detected)" : ""}.`);
        } catch {
            toast.error("Could not read this file.");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) importFile(file);
    };

    const iconButton = "rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer";

    return (
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
            <div className="flex w-full flex-1 flex-col gap-2 self-stretch p-4">
                <div className="mb-2 flex justify-between items-center text-sm font-medium text-white/80">
                    <ShinyText
                        text="Logs Codexion"
                        className="text-sm"
                        color="#888"
                        shineColor="#fff"
                        speed={4}
                        spread={90}
                    />
                    <div className="flex items-center gap-1">
                        <span className="mr-1 text-white/40 text-xs">{lineCount > 0 ? `${lineCount} lines` : "Paste, drop or import"}</span>
                        <button type="button" className={iconButton} onClick={() => fileInputRef.current?.click()} title="Import a log file" aria-label="Import a log file">
                            <Upload className="h-3.5 w-3.5" />
                        </button>
                        {lineCount > 0 && (
                            <>
                                <button
                                    type="button"
                                    className={iconButton}
                                    onClick={() => downloadBlob((command ? `${command}\n` : "") + text + "\n", "codexion.log", "text/plain")}
                                    title="Download the log"
                                    aria-label="Download the log"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" className={iconButton} onClick={() => dispatch(setOutput([]))} title="Clear the log" aria-label="Clear the log">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.log,text/plain"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) importFile(file);
                                e.target.value = "";
                            }}
                        />
                    </div>
                </div>
                <div
                    className="relative"
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <textarea
                        value={text}
                        onChange={(e) => dispatch(setOutput(e.target.value ? e.target.value.split('\n') : []))}
                        placeholder={`0 2 has taken a dongle
0 2 is compiling
4 2 is debugging
5 2 is refactoring
...`}
                        className="min-h-[160px] w-full resize-y rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                        spellCheck={false}
                        aria-label="Codexion log output"
                    />
                    {isDragging && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-white/40 bg-black/70 text-sm text-white/80">
                            Drop your log file here
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
