import { ExternalLink, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GROQ_MODEL, useIde } from "@/lib/ide-store";
import { toast } from "sonner";

const ACCENTS: { id: "purple" | "blue" | "green"; label: string; swatch: string }[] = [
  { id: "purple", label: "Violet", swatch: "bg-[hsl(265_85%_62%)]" },
  { id: "blue", label: "Azure", swatch: "bg-[hsl(210_90%_58%)]" },
  { id: "green", label: "Mint", swatch: "bg-[hsl(152_60%_45%)]" },
];

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const settings = useIde((s) => s.settings);
  const { setSettings } = useIde.getState();
  const [reveal, setReveal] = useState(false);
  const [draft, setDraft] = useState(settings.apiKey);

  useEffect(() => {
    if (open) setDraft(settings.apiKey);
  }, [open, settings.apiKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-surface-1">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Your API key is stored only in this browser.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="ai">
          <TabsList className="bg-surface-2">
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Groq API key</Label>
              <div className="relative">
                <Input
                  type={reveal ? "text" : "password"}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="gsk_..."
                  className="border-border bg-surface-2 pr-8 font-mono text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  aria-label={reveal ? "Hide key" : "Show key"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    setSettings({ apiKey: draft.trim() });
                    toast.success("API key saved in this browser");
                  }}
                  disabled={!draft.trim() || draft.trim() === settings.apiKey}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    setSettings({ apiKey: "" });
                    setDraft("");
                    toast.success("API key deleted");
                  }}
                  disabled={!settings.apiKey}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
              >
                Get a free key at console.groq.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Model</Label>
              <p className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-[12px] text-muted-foreground">
                {GROQ_MODEL}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Temperature · {settings.temperature.toFixed(1)}</Label>
              <Slider
                value={[settings.temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => setSettings({ temperature: value ?? 0.2 })}
              />
            </div>
          </TabsContent>


          <TabsContent value="editor" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-[12px]">Font size · {settings.fontSize}px</Label>
              <Slider value={[settings.fontSize]} min={11} max={20} step={1} onValueChange={([value]) => setSettings({ fontSize: value ?? 13 })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[12px]">Tab size · {settings.tabSize}</Label>
              <Slider value={[settings.tabSize]} min={2} max={8} step={2} onValueChange={([value]) => setSettings({ tabSize: value ?? 2 })} />
            </div>
            {(
              [
                ["wordWrap", "Word wrap"],
                ["minimap", "Minimap"],
                ["lineNumbers", "Line numbers"],
                ["autoSave", "Auto save"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-[12px]">{label}</Label>
                <Switch checked={settings[key]} onCheckedChange={(checked) => setSettings({ [key]: checked })} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="appearance" className="space-y-3 pt-3">
            <Label className="text-[12px]">Accent color</Label>
            <div className="flex gap-2">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.id}
                  onClick={() => setSettings({ accent: accent.id })}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-[11.5px] ${
                    settings.accent === accent.id ? "border-primary text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full ${accent.swatch}`} />
                  {accent.label}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
