// components/SerialNumberModal.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface SerialNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serials: string[]) => void | Promise<void>;
  quantity: number;
  initialValue: string[];
  itemCode: string;
}

export default function SerialNumberModal({
  isOpen,
  onClose,
  onSave,
  quantity,
  initialValue,
  itemCode,
}: SerialNumberModalProps) {
  const [serials, setSerials] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const qty = Math.max(0, Math.floor(quantity) || 0);
      const filled = Array.from({ length: qty }, (_, i) => initialValue[i] ?? "");
      setSerials(filled);
      setError("");
      setSaving(false);
    }
  }, [isOpen, quantity, initialValue]);

  if (!isOpen) return null;

  const handleChange = (idx: number, value: string) => {
    setSerials((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length <= 1) return; // biarkan default paste kalau cuma 1 value

    e.preventDefault();
    setSerials((prev) => {
      const next = [...prev];
      for (let i = 0; i < lines.length && idx + i < next.length; i++) {
        next[idx + i] = lines[i];
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const trimmed = serials.map((s) => s.trim());
    const nonEmpty = trimmed.filter((s) => s !== "");

    if (nonEmpty.length !== new Set(nonEmpty).size) {
      setError("Ada serial number yang duplikat");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave(trimmed);
      // onClose sengaja TIDAK dipanggil di sini — biarkan pemanggil (onSave)
      // yang menutup modal setelah dia yakin proses (termasuk API call kalau
      // ada) berhasil. Kalau onSave gagal/throw, modal tetap terbuka supaya
      // user bisa retry tanpa kehilangan input.
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan serial number");
    } finally {
      setSaving(false);
    }
  };

  const filledCount = serials.filter((s) => s.trim() !== "").length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md w-[420px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Serial Number</h3>
            <p className="text-xs text-gray-500">{itemCode} — {filledCount}/{serials.length} filled</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {serials.map((val, idx) => (
            <Input
              key={idx}
              style={{ fontSize: "12px" }}
              placeholder={`Serial #${idx + 1}`}
              value={val}
              disabled={saving}
              onChange={(e) => handleChange(idx, e.target.value)}
              onPaste={(e) => handlePaste(idx, e)}
            />
          ))}
          {serials.length === 0 && (
            <p className="text-xs text-gray-500">Qty masih 0, isi Plan Qty dulu.</p>
          )}
        </div>

        {error && <p className="text-xs text-red-500 px-4">{error}</p>}

        <div className="p-4 border-t flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}