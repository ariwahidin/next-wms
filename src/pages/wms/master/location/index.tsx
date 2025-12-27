/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LocationTable from "./LocationTable";
import LocationForm from "./LocationForm";
import { useState } from "react";
import Layout from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import router from "next/router";

export default function Page() {
  const [editData, setEditData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    setEditData(null);
    setIsOpen(true);
  };

  const handleEdit = (data: any) => {
    setEditData(data);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditData(null);
  };

  return (
    <Layout title="Master" subTitle="Location">
      <div className="p-6 space-y-6">
        <div className="col-span-2">
          <div className="flex justify-start absolute">
            <Button className="left-6 h-8 top-18" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
            <Button className="left-16 h-8 ml-2 bg-green-500 mb-4 text-slate-950 outline-green-600" onClick={() => { router.push('/wms/master/location/import-excel') }}>
              <Upload className="mr-2 w-4" />
              Import Excel
            </Button>
          </div>
          <LocationTable setEditData={handleEdit} />

          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={handleClose}
              />
              <div className="relative z-50 w-full max-w-4xl">
                <LocationForm
                  editData={editData}
                  setEditData={setEditData}
                  onClose={handleClose}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
