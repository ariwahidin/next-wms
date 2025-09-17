/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import eventBus from "@/utils/eventBus";
import { emit } from "process";
import useSWR, { mutate } from "swr";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  isKoli: yup.boolean().default(false),
  isActive: yup.boolean().default(true),
  defaultPrice: yup.number().min(0, "Price must be >= 0").default(0),
});
type CreateMainVasPayload = yup.InferType<typeof schema>;

interface MainVasFormProps {
  editData?: any;
  clearEditData?: () => void;
}

export default function MainVasForm({
  editData,
  clearEditData,
}: MainVasFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateMainVasPayload>({
    resolver: yupResolver(schema),
  });

  const isKoli = watch("isKoli");
  const isActive = watch("isActive");

  useEffect(() => {
    if (editData) {
      setValue("name", editData.name || "");
      setValue("defaultPrice", editData.defaultPrice || 0);
      setValue("isKoli", editData.isKoli || false);
      setValue("isActive", editData.isActive !== false);
    }
  }, [editData, setValue]);

  const onSubmit = async (data: CreateMainVasPayload) => {
    try {
      let res;
      if (editData) {
        res = await api.put(`/vas/main-vas/${editData.ID}`, data);
      } else {
        res = await api.post("/vas/main-vas", data);
      }

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });
        reset();
        if (clearEditData) clearEditData();
        mutate("/vas/main-vas");
      } else {
        eventBus.emit("showAlert", {
          title: "Error!",
          description: res.data.message,
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Server error, please try again");
    }
  };

  const handleCancel = () => {
    reset();
    if (clearEditData) clearEditData();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editData ? "Edit Main VAS" : "Create Main VAS"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Main VAS Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter Main VAS Name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Default Price</Label>
            <Input
              id="defaultPrice"
              type="number"
              step="0.01"
              {...register("defaultPrice")}
              placeholder="Enter Default Price"
            />
            {errors.defaultPrice && (
              <p className="text-sm text-red-500">
                {errors.defaultPrice.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isKoli"
              checked={isKoli}
              onCheckedChange={(checked) => setValue("isKoli", !!checked)}
            />
            <Label htmlFor="isKoli">Is Koli</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", !!checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editData ? "Update Main VAS" : "Create Main VAS"}
            </Button>
            {editData && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
