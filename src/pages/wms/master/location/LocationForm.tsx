/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  MapPin,
  Building2,
  Layers3,
  Archive,
  Grid3X3,
  Activity,
  Save,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { mutate } from "swr";

// Mock API for demonstration
// const api = {
//   put: async (url, data, config) => {
//     console.log("PUT request:", url, data, config);
//     return new Promise((resolve) => setTimeout(resolve, 1000));
//   },
//   post: async (url, data, config) => {
//     console.log("POST request:", url, data, config);
//     return new Promise((resolve) => setTimeout(resolve, 1000));
//   },
// };

// UI Components
const Button = ({
  children,
  type = "button",
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
  };

  return (
    <button
      // type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", error, ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      error ? "border-red-500 focus-visible:ring-red-500" : ""
    } ${className}`}
    {...props}
  />
);

const Switch = ({ checked, onCheckedChange, ...props }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "bg-blue-600" : "bg-gray-200"
    }`}
    {...props}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

type LocationFormValues = {
  is_active: boolean;
  // tambahkan field lainnya di sini kalau ada, misalnya:
  name: string;
};

export default function LocationForm({ editData, setEditData, onClose }) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    defaultValues: {
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (editData) {
      console.log("Editing data:", editData);
      Object.entries(editData).forEach(([key, value]) => {
        // setValue(key, value);
        setValue(key as keyof LocationFormValues, value as any);
      });
    } else {
      reset({
        is_active: true,
      });
    }
  }, [editData, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      if (editData) {
        await api.put(`/locations/${editData.ID}`, data, {
          withCredentials: true,
        });
      } else {
        await api.post("/locations", data, {
          withCredentials: true,
        });
      }

      mutate("/locations"); // Refresh the locations list
      reset(); // Reset the form

      setEditData(null);
      onClose();
    } catch (error) {
      console.error("Submit failed", error);
    }
  };

  const formFields = [
    // {
    //   name: "location_code",
    //   label: "Location Code",
    //   icon: MapPin,
    //   required: true,
    //   placeholder: "e.g., WH-A1-01",
    //   description: "Unique identifier for the location",
    // },
    {
      name: "row",
      label: "Row",
      icon: Grid3X3,
      placeholder: "",
      description: "Row designation in the warehouse",
      required: true
    },
    {
      name: "bay",
      label: "Bay",
      icon: Building2,
      placeholder: "",
      description: "Bay number within the row",
      required: true,
    },
    {
      name: "level",
      label: "Level",
      icon: Layers3,
      placeholder: "",
      description: "Vertical level or floor",
      required: true,
    },
    {
      name: "bin",
      label: "Bin",
      icon: Archive,
      placeholder: "",
      description: "Specific bin within the level",
      required: true,
    },
    // {
    //   name: "area",
    //   label: "Area",
    //   icon: Grid3X3,
    //   placeholder: "Picking, Storage...",
    //   description: "Functional area designation",
    // },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {editData ? "Edit Location" : "Create New Location"}
              </h2>
              <p className="text-blue-100 text-sm">
                {editData
                  ? "Update location details"
                  : "Add a new location to your inventory"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-white/20 text-white hover:bg-white/30 border-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formFields.map((field) => {
            const Icon = field.icon;
            const error = errors[field.name];

            return (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span>{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  {...register(field.name as keyof LocationFormValues, { required: field.required })}
                  placeholder={field.placeholder}
                  error={error}
                />
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
                {error && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <span>This field is required</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Toggle */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity
                className={`h-5 w-5 ${
                  isActive ? "text-green-600" : "text-gray-400"
                }`}
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Location Status
                </label>
                <p className="text-xs text-gray-500">
                  {isActive
                    ? "This location is active and available for use"
                    : "This location is inactive"}
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{editData ? "Update Location" : "Create Location"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
