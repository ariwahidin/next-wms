"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { List, Upload } from "lucide-react";

export default function BottomNav({ active, setActive, onUpload }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 shadow-sm z-50">
        {/* <Button variant="ghost" className="flex flex-col items-center text-xs">
          <List size={20} />
          Aktivitas
        </Button> */}
        <Button
          //   variant={active === "listSto" ? "default" : "ghost"}
          variant="ghost"
          onClick={() => {
            if (active === "aktivitas") {
              setActive("listSto");
            } else {
              setActive("aktivitas");
            }
          }}
          className="flex flex-col items-center text-xs"
        >
          <List size={20} />
          {active === "aktivitas" ? "List STO" : "Aktivitas"}
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs text-blue-600"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={20} />
          Upload
        </Button>
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[320px] bg-white">
          <DialogHeader>
            <DialogTitle>Upload Data</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            Apakah kamu yakin ingin mengupload semua data stock take ke server?
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setUploadOpen(false);
                onUpload(); // trigger function dari parent
              }}
            >
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
