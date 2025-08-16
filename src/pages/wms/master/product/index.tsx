/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
import { useState } from "react";
import Layout from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Page() {
  const [editData, setEditData] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Kontrol modal

  const handleAdd = () => {
    setEditData(null); // Reset form
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
    <Layout title="Master" subTitle="Items">
      <div className="p-6 space-y-6">
        <div className="col-span-2">
          <Button className="absolute left-6 top-18" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <ProductTable setEditData={handleEdit} />
          {/* Modal Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl bg-white p-6">
              <DialogHeader>
                <DialogTitle>
                  {editData ? "Edit Item" : "Add Item"}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                editData={editData}
                setEditData={setEditData}
                onClose={handleClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}
