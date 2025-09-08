/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Select from "react-select";
import useSWR from "swr";

const schema = yup.object({
  // name: yup.string().required("VAS Page name is required"),
  // description: yup.string().default(""),
  isActive: yup.boolean().default(true),
  mainVasIds: yup
    .array()
    .of(yup.number())
    .min(1, "At least one Main VAS must be selected")
    .required("Main VAS selection is required"),
});
type CreateVasPagePayload = yup.InferType<typeof schema>;

interface VasPageFormProps {
  editData?: any;
  clearEditData?: () => void;
}

const fetcher = (url: string) =>
  api.get(url, { withCredentials: true }).then((res) => {
    if (res.data.success) {
      return res.data.data;
    }
    return [];
  });

export default function VasPageForm({
  editData,
  clearEditData,
}: VasPageFormProps) {
  const { data: mainVasOptions } = useSWR("/vas/main-vas", fetcher);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CreateVasPagePayload>({
    resolver: yupResolver(schema),
  });

  const isActive = watch("isActive");

  // useEffect(() => {
  //   if (editData) {
  //     // setValue("name", editData.name || "");
  //     // setValue("description", editData.description || "");
  //     setValue("isActive", editData.is_active !== false);
  //     setValue("mainVasIds", editData.main_vas_ids || []);
  //   }
  // }, [editData, setValue]);

  useEffect(() => {
    if (editData) {
      // setValue("name", editData.name || "");
      // setValue("description", editData.description || "");
      setValue("isActive", editData.is_active !== false);

      // ambil array MainVasId dari main_vas_details
      const mainVasIds =
        editData.main_vas_details?.map((d: any) => d.MainVasId) || [];
      setValue("mainVasIds", mainVasIds);
    }
  }, [editData, setValue]);

  const onSubmit = async (data: CreateVasPagePayload) => {
    try {
      let res;
      if (editData) {
        res = await api.put(`/vas/page/${editData.ID}`, data);
      } else {
        res = await api.post("/vas/page", data);
      }

      if (res.data.success) {
        alert(
          res.data.message ||
            `VAS Page ${editData ? "updated" : "created"} successfully`
        );
        reset();
        if (clearEditData) clearEditData();
        // window.location.reload()
      } else {
        alert(
          res.data.message ||
            `Failed to ${editData ? "update" : "create"} VAS Page`
        );
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

  const selectOptions =
    mainVasOptions?.map((item: any) => ({
      value: item.ID,
      label: `${item.name} - ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(item.defaultPrice || 0)}`,
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editData ? "Edit VAS Page" : "Create VAS Page"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <div className="space-y-2">
            <Label htmlFor="name">VAS Page Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter VAS Page Name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Enter Description (Optional)"
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div> */}

          <div className="space-y-2">
            <Label>Main VAS Selection</Label>
            <Controller
              name="mainVasIds"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={selectOptions}
                  value={selectOptions.filter((option: any) =>
                    field.value?.includes(option.value)
                  )}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions
                      ? selectedOptions.map((option: any) => option.value)
                      : [];
                    field.onChange(values);
                  }}
                  placeholder="Select Main VAS items..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {errors.mainVasIds && (
              <p className="text-sm text-red-500">
                {errors.mainVasIds.message}
              </p>
            )}
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
              {editData ? "Update VAS Page" : "Create VAS Page"}
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
