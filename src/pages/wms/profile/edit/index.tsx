/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { User, Mail, Lock, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import router from "next/router";

interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
}

interface FormData {
    id: number;
    name: string;
    email: string;
    username: string;
    password: string;
}

interface ValidationError {
    field: string;
    message: string;
}

export default function UpdateUserProfile() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<FormData>({
        id: 0,
        name: "",
        email: "",
        username: "",
        password: "",
    });

    const [originalData, setOriginalData] = useState<UserProfile | null>(null);

    // Fetch user profile on mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setIsFetching(true);
            const response = await api.get("/user/profile");

            if (response.data.success) {
                const userData = response.data.data;
                setOriginalData(userData);
                setFormData({
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    username: userData.username,
                    password: "",
                });
            }
        } catch (error: any) {
            eventBus.emit("showAlert", {
                title: "Error!",
                description: error.response?.data?.message || "Failed to load profile",
                type: "error",
            });
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        } else if (formData.username.trim().length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            newErrors.username = "Username must contain only letters and numbers";
        }

        if (formData.password && formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const payload: any = {
                id: formData.id,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                username: formData.username.trim().toLowerCase(),
            };

            // Only include password if it's not empty
            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await api.put("/user/profile", payload, { withCredentials: true });
            console.log("Ressss :", response);

            if (response.data.success) {
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: response.data.message,
                    type: "success",
                });

                // Update original data and clear password field
                setOriginalData(response.data.data);
                setFormData((prev) => ({
                    ...prev,
                    password: "",
                }));
                
            }
        } catch (error: any) {
            const errorData = error.response?.data;

            // Handle validation errors from backend
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                const backendErrors: Record<string, string> = {};
                errorData.errors.forEach((err: ValidationError) => {
                    backendErrors[err.field] = err.message;
                });
                setErrors(backendErrors);
            }

            eventBus.emit("showAlert", {
                title: "Error!",
                description: errorData?.message || "Failed to update profile",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-slate-600 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                        Profile Settings
                    </h1>
                    <p className="text-slate-600">
                        Manage your account information and preferences
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    {originalData?.name || "User"}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    @{originalData?.username || "username"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.name
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300 bg-white"
                                        }`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Username Field */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 font-medium">@</span>
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-9 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.username
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300 bg-white"
                                        }`}
                                    placeholder="Enter username"
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.email
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300 bg-white"
                                        }`}
                                    placeholder="Enter your email"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-slate-700 mb-2"
                            >
                                New Password
                                <span className="text-slate-500 font-normal ml-2 text-xs">
                                    (Leave blank to keep current password)
                                </span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.password
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300 bg-white"
                                        }`}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Account Info */}
                        {originalData && (
                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Member since</span>
                                        <p className="font-medium text-slate-700">
                                            {new Date(originalData.created_at).toLocaleDateString(
                                                "en-US",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                }
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Last updated</span>
                                        <p className="font-medium text-slate-700">
                                            {new Date(originalData.updated_at).toLocaleDateString(
                                                "en-US",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Updating Profile...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            {/* button back */}
                            <button 
                                type="button"
                                onClick={() => router.back()}
                                className="w-full mt-4 bg-gradient-to-r from-white-600 to-white-600 text-black py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-white-700 hover:to-white-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 outline-slate-900 border border-slate-900"
                            >
                                Back
                            </button>
                                
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        Your information is secure and will only be used to improve your
                        experience.
                    </p>
                </div>
            </div>
        </div>
    );
}